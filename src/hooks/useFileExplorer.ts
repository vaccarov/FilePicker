'use client';

import { useAuth } from "@/context/AuthContext";
import { COLUMN_ID_INODE_TYPE, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED, OP_DEINDEXING, OP_INDEXING } from "@/lib/constants";
import { addKnowledgeBaseResource, deleteKnowledgeBaseResource, getCurrentOrganization, listConnections, listKnowledgeBaseResources, listKnowledgeBases, listResources } from "@/services/api";
import { Connection, KnowledgeBase, Organization, PendingOperation, Resource } from "@/types";
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

export function useFileExplorer() {
  const { token, logout }: { token: string | null, logout: () => void } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConnectionId, setSelectedConnectionId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [pendingResources, setPendingResources] = useState<Map<string, PendingOperation>>(new Map());
  const [currentPath, setCurrentPath]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>(undefined);
  const [pathHistory, setPathHistory]: [Resource[], Dispatch<SetStateAction<Resource[]>>] = useState<Resource[]>([]);
  const [page, setPage]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
  const [sorting, setSorting]: [SortingState, Dispatch<SetStateAction<SortingState>>] = useState<SortingState>([{ id: COLUMN_ID_INODE_TYPE, desc: false }]);
  const [columnFilters, setColumnFilters]: [ColumnFiltersState, Dispatch<SetStateAction<ColumnFiltersState>>] = useState<ColumnFiltersState>([]);

  const organizationQuery: UseQueryResult<Organization, Error> = useQuery<Organization, Error>({
    queryKey: ['organization'],
    queryFn: () => getCurrentOrganization(token!),
    enabled: !!token
  });

  const connectionsQuery: UseQueryResult<Connection[], Error> = useQuery<Connection[], Error>({
    queryKey: ['connections'],
    queryFn: () => listConnections(token!),
    enabled: !!token,
  });

  useEffect((): void => {
    setPathHistory([]);
    setCurrentPath(undefined);
    setPage(0);
    if (connectionsQuery.data && connectionsQuery.data.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connectionsQuery.data[0].connection_id);
    }
  }, [connectionsQuery.data, selectedConnectionId]);

  const kbsQuery: UseQueryResult<KnowledgeBase[], Error> = useQuery<KnowledgeBase[], Error>({
    queryKey: ['knowledgeBases'],
    queryFn: () => listKnowledgeBases(token!),
    enabled: !!token
  });

  useEffect((): void => {
    if (kbsQuery.data && kbsQuery.data.length > 0 && !knowledgeBaseId) {
      setKnowledgeBaseId(kbsQuery.data[0].knowledge_base_id);
    }
  }, [kbsQuery.data, knowledgeBaseId]);

  const resourcesQuery: UseQueryResult<{ data: Resource[], next_cursor: string | null }, Error> = useQuery({
    queryKey: ['resources', selectedConnectionId, currentPath],
    queryFn: () => listResources(token!, selectedConnectionId!, currentPath),
    enabled: !!selectedConnectionId,
  });

  const isPollingEnabled: boolean = pendingResources.size > 0;
  const kbResourcesQuery: UseQueryResult<{ data: Resource[] }, Error> = useQuery({
    queryKey: ['kbResources', knowledgeBaseId],
    queryFn: () => listKnowledgeBaseResources(token!, knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
    refetchInterval: isPollingEnabled ? 3000 : false,
  });

  useEffect(() => {
    if (pendingResources.size > 0) {
      queryClient.invalidateQueries({ queryKey: ['kbResources'] });
    }
  }, [pendingResources, queryClient]);

  const indexMutation: UseMutationResult<void, Error, Resource, unknown> = useMutation({
    mutationFn: async (resource: Resource): Promise<void> => {
      if (!token || !organizationQuery.data || !knowledgeBaseId) throw new Error('Required info missing.');
      await addKnowledgeBaseResource(token, resource);
    },
    onSuccess: (_, variables: Resource) => {
      setPendingResources(prev => new Map(prev).set(variables.resource_id, OP_INDEXING));
    },
  });

  const deindexMutation: UseMutationResult<void, Error, Resource, unknown> = useMutation({
    mutationFn: async (resource: Resource): Promise<void> => {
      if (!token || !knowledgeBaseId) throw new Error('Required info missing.');
      await deleteKnowledgeBaseResource(token, knowledgeBaseId, resource.inode_path.path, resource.resource_id);
    },
    onSuccess: (_, variables: Resource) => {
      setPendingResources(prev => new Map(prev).set(variables.resource_id, OP_DEINDEXING));
    },
  });

  useEffect(() => {
    if (kbResourcesQuery.data) {
      const indexedResources: Set<string> = new Set(kbResourcesQuery.data.data.map(r => r.resource_id));
      setPendingResources((prev: Map<string, string>) => {
        const newPending: Map<string, string> = new Map(prev);
        let changed: boolean = false;
        for (const [id, action] of prev.entries()) {
          if (action === OP_INDEXING && indexedResources.has(id)) {
            newPending.delete(id);
            changed = true;
          } else if (action === OP_DEINDEXING && !indexedResources.has(id)) {
            newPending.delete(id);
            changed = true;
          }
        }
        return changed ? newPending : prev;
      });
    }
  }, [kbResourcesQuery.data]);

  const processedResource: Resource[] = useMemo((): Resource[] => {
    if (!resourcesQuery.data) return [];
    const kbStatusMap: Map<string, string> = new Map<string, string>();
    kbResourcesQuery.data?.data.forEach((res: Resource) => kbStatusMap.set(res.resource_id, INDEXED));

    return resourcesQuery.data?.data.map((res: Resource) => ({
      ...res,
      status: pendingResources.has(res.resource_id) ? INDEXING : (kbStatusMap.get(res.resource_id) || NOT_INDEXED),
    }));
  }, [resourcesQuery.data, kbResourcesQuery.data, pendingResources]);

  const indexingResourcesCount: number = useMemo(() => {
    return processedResource.filter(r => r.status === INDEXING).length;
  }, [processedResource]);

  const handleResourceSelect = useCallback((resource: Resource): void => {
    if (resource.status === INDEXING) return;

    const traverseAndMutate = (res: Resource, action: PendingOperation) => {
      if (action === OP_INDEXING && res.status === NOT_INDEXED) {
        indexMutation.mutate(res);
      } else if (action === OP_DEINDEXING && res.status === INDEXED) {
        deindexMutation.mutate(res);
      }
      resourcesQuery.data?.data
        .filter((child: Resource) => child.parent_id === res.resource_id)
        .forEach((child: Resource) => traverseAndMutate(child, action));
    };

    if (resource.inode_type === DIRECTORY) {
      if (resource.status === INDEXED) {
        traverseAndMutate(resource, OP_DEINDEXING);
      } else {
        traverseAndMutate(resource, OP_INDEXING);
      }
    } else if (resource.inode_type === FILE) {
      if (resource.status === INDEXED) {
        deindexMutation.mutate(resource);
      } else {
        indexMutation.mutate(resource);
      }
    }
  }, [indexMutation, deindexMutation, resourcesQuery.data?.data]);

  const handleFolderClick = useCallback((resource: Resource): void => {
    setPathHistory((prevPathHistory: Resource[]): Resource[] => [...prevPathHistory, resource]);
    setCurrentPath(resource.resource_id);
  }, [setPathHistory, setCurrentPath]);

  const handleBreadcrumbClick = useCallback((index: number): void => {
    const newPathHistory: Resource[] = pathHistory.slice(0, index + 1);
    setPathHistory(newPathHistory);
    setCurrentPath(newPathHistory.length > 0 ? newPathHistory[newPathHistory.length - 1].resource_id : undefined);
  }, [pathHistory, setPathHistory, setCurrentPath]);

  return {
    logout,
    selectedConnectionId,
    setSelectedConnectionId,
    knowledgeBaseId,
    setKnowledgeBaseId,
    pathHistory,
    page,
    setPage,
    connectionsQuery,
    kbsQuery,
    resourcesQuery,
    processedResource,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    handleResourceSelect,
    handleFolderClick,
    handleBreadcrumbClick,
    indexingResourcesCount
  };
}