'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { getCurrentOrganization, listConnections, listKnowledgeBases, listKnowledgeBaseResources, listResources, } from "@/services/api";
import { Organization, Connection, KnowledgeBase, Resource } from "@/types";
import { COLUMN_ID_INODE_TYPE, INDEXED, INDEXING, NOT_INDEXED } from "@/lib/constants";
import { Dispatch, SetStateAction } from "react";

export function useFileExplorer() {
  const { token, logout }: { token: string | null, logout: () => void } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConnectionId, setSelectedConnectionId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [pendingResources, setPendingResources]: [Set<string>, Dispatch<SetStateAction<Set<string>>>] = useState<Set<string>>(new Set());
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

  useEffect((): void => {
    console.log('kbResourcesData', kbResourcesQuery.data);
  }, [kbResourcesQuery.data]);

  const indexMutation: UseMutationResult<Resource, Error, Resource, unknown> = useMutation<Resource, Error, Resource, unknown>({
    mutationFn: async (resource: Resource): Promise<Resource> => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: Resource) => r.resource_id === resource.resource_id ? { ...r, status: INDEXING } : r)
        };
      });
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 5000));
      return resource;
    },
    onSuccess: (resource: Resource): void => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: Resource) => r.resource_id === resource.resource_id ? { ...r, status: INDEXED } : r)
        };
      });
    },
  });

  const deindexMutation: UseMutationResult<Resource, Error, Resource, unknown> = useMutation<Resource, Error, Resource, unknown>({
    mutationFn: async (resource: Resource): Promise<Resource> => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: Resource) => r.resource_id === resource.resource_id ? { ...r, status: INDEXING } : r)
        };
      });
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 5000));
      return resource;
    },
    onSuccess: (resource: Resource): void => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((r: Resource) => r.resource_id === resource.resource_id ? { ...r, status: NOT_INDEXED } : r)
        };
      });
    },
  });

  const processedResource: Resource[] = useMemo((): Resource[] => {
    if (!resourcesQuery.data) return [];
    const indexedMap: Map<string, string> = new Map<string, string>();
    kbResourcesQuery.data?.data.forEach((res: Resource) => indexedMap.set(res.resource_id, res.status || INDEXED));

    return resourcesQuery.data?.data.map((res: Resource) => ({
      ...res,
      status: indexedMap.get(res.resource_id) || res.status || NOT_INDEXED,
    }));
  }, [resourcesQuery.data, kbResourcesQuery.data]);

  const indexingResourcesCount: number = useMemo(() => {
    return processedResource.filter(r => r.status === INDEXING).length;
  }, [processedResource]);

  const handleResourceSelect = useCallback((resource: Resource): void => {
    if (resource.status === INDEXING) return;
    if (resource.status === INDEXED) {
      deindexMutation.mutate(resource);
    } else {
      indexMutation.mutate(resource);
    }
  }, [indexMutation, deindexMutation]);

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