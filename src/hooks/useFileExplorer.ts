'use client';

import { useAuth } from "@/context/AuthContext";
import { COLUMN_ID_INODE_TYPE, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED, OP_DEINDEXING, OP_INDEXING, QUERY_KEY_CONNECTIONS, QUERY_KEY_KB_RESOURCES, QUERY_KEY_KNOWLEDGE_BASES, QUERY_KEY_ORGANIZATION, QUERY_KEY_RESOURCES, REFRESH_MS } from "@/lib/constants";
import { mockResources } from '@/lib/mockData';
import { addKnowledgeBaseResource, createKnowledgeBase, deleteKnowledgeBaseResource, getCurrentOrganization, listConnections, listKnowledgeBaseResources, listKnowledgeBases, listResources, syncKnowledgeBase } from "@/services/api";
import { Connection, IndexStatus, KnowledgeBase, Organization, PendingOperation, Resource } from "@/types";
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  isOnlineMode: boolean;
  token: string;
}

export function useFileExplorer({ isOnlineMode, token }: Props) {
  const { logout }: { token: string | null, logout: () => void } = useAuth();
  const queryClient = useQueryClient();
  const [connectionId, setConnectionId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [pendingResources, setPendingResources] = useState<Map<string, PendingOperation>>(new Map());
  const [searchTerm, setSearchTerm]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [currentPath, setCurrentPath]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>(undefined);
  const [pathHistory, setPathHistory]: [Resource[], Dispatch<SetStateAction<Resource[]>>] = useState<Resource[]>([]);
  const [pageCursors, setPageCursors]: [string[], Dispatch<SetStateAction<string[]>>] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
  const [sorting, setSorting]: [SortingState, Dispatch<SetStateAction<SortingState>>] = useState<SortingState>([{ id: COLUMN_ID_INODE_TYPE, desc: false }]);
  const [columnFilters, setColumnFilters]: [ColumnFiltersState, Dispatch<SetStateAction<ColumnFiltersState>>] = useState<ColumnFiltersState>([]);
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [isCreatingKb, setIsCreatingKb] = useState<boolean>(false);

  useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const organizationQuery: UseQueryResult<Organization, Error> = useQuery<Organization, Error>({
    queryKey: [QUERY_KEY_ORGANIZATION, isOnlineMode],
    queryFn: () => getCurrentOrganization(token!),
    enabled: !!token && isOnlineMode
  });

  const connectionsQuery: UseQueryResult<Connection[], Error> = useQuery<Connection[], Error>({
    queryKey: [QUERY_KEY_CONNECTIONS, isOnlineMode],
    queryFn: () => listConnections(isOnlineMode, token!),
    enabled: !!token,
  });

  useEffect((): void => {
    setPathHistory([]);
    setCurrentPath(undefined);
    setPageCursors([]);
    setCurrentPageIndex(0);
    if (connectionsQuery.data && connectionsQuery.data.length > 0 && !connectionId) {
      setConnectionId(connectionsQuery.data[0].connection_id);
    }
  }, [connectionsQuery.data, connectionId]);

  useEffect((): void => {
    setPathHistory([]);
    setCurrentPath(undefined);
    setPageCursors([]);
    setCurrentPageIndex(0);
  }, [debouncedSearchTerm]);

  const kbsQuery: UseQueryResult<KnowledgeBase[], Error> = useQuery<KnowledgeBase[], Error>({
    queryKey: [QUERY_KEY_KNOWLEDGE_BASES, isOnlineMode],
    queryFn: () => listKnowledgeBases(isOnlineMode, token!),
    enabled: !!token
  });

  useEffect((): void => {
    if (kbsQuery.data && kbsQuery.data.length > 0 && !knowledgeBaseId) {
      setKnowledgeBaseId(kbsQuery.data[0].knowledge_base_id);
    }
  }, [kbsQuery.data, knowledgeBaseId]);

  const resourcesQuery: UseQueryResult<{ data: Resource[], next_cursor: string | null }, Error> = useQuery({
    queryKey: [QUERY_KEY_RESOURCES, connectionId, currentPath, debouncedSearchTerm, isOnlineMode, currentPageIndex],
    queryFn: () => listResources(isOnlineMode, token!, connectionId, currentPath, debouncedSearchTerm, pageCursors[currentPageIndex - 1]),
    enabled: !!connectionId,
  });

  const kbQueryPath: string = useMemo(() => {
    if (pathHistory.length === 0) {
      return '/';
    }
    const lastResource: Resource = pathHistory[pathHistory.length - 1];
    return `/${lastResource.inode_path.path}`;
  }, [pathHistory]);
  const isPollingEnabled: boolean = useMemo(() => pendingResources.size > 0, [pendingResources]);
  const kbResourcesQuery: UseQueryResult<{ data: Resource[] }, Error> = useQuery({
    queryKey: [QUERY_KEY_KB_RESOURCES, knowledgeBaseId, isOnlineMode, kbQueryPath],
    queryFn: () => listKnowledgeBaseResources(isOnlineMode, token!, knowledgeBaseId, kbQueryPath),
    enabled: !!knowledgeBaseId,
    refetchInterval: isPollingEnabled ? REFRESH_MS : false,
  });

  useEffect(() => {
    if (knowledgeBaseId) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_KB_RESOURCES, knowledgeBaseId] });
    }
  }, [knowledgeBaseId, queryClient]);

  const indexMutation: UseMutationResult<void, Error, Resource, unknown> = useMutation({
    mutationFn: async (resource: Resource): Promise<void> => {
      if (!token || !knowledgeBaseId) throw new Error('Required info missing.');
      await addKnowledgeBaseResource(isOnlineMode, token, knowledgeBaseId, resource);
    },
    onMutate: async (resource: Resource) => {
      setPendingResources(prev => new Map(prev).set(resource.resource_id, OP_INDEXING));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_KB_RESOURCES, knowledgeBaseId] });
    },
  });

  const deindexMutation: UseMutationResult<void, Error, Resource, unknown> = useMutation({
    mutationFn: async (resource: Resource): Promise<void> => {
      if (!token || !knowledgeBaseId) throw new Error('Required info missing.');
      await deleteKnowledgeBaseResource(isOnlineMode, token, knowledgeBaseId, resource.inode_path.path);
    },
    onMutate: async (resource: Resource) => {
      setPendingResources(prev => new Map(prev).set(resource.resource_id, OP_DEINDEXING));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_KB_RESOURCES, knowledgeBaseId] });
    },
  });

  const createAndSyncKnowledgeBase = useCallback(async () => {
    if (!token || !connectionId || !organizationQuery.data?.org_id || selectedResources.length === 0) {
      console.error("Missing required information for creating and syncing knowledge base.");
      return;
    }
    // Logic to remove files when a parent directory is included
    const selectedDirs: Resource[] = selectedResources.filter((r: Resource) => r.inode_type === DIRECTORY);
    const finalResourceIds = selectedResources
      .filter((resource: Resource) => {
        const parentDir: Resource | undefined = selectedDirs.find((dir: Resource) =>
          resource.resource_id !== dir.resource_id &&
          resource.inode_path.path.startsWith(dir.inode_path.path + '/')
        );
        return !parentDir;
      })
      .map((r: Resource) => r.resource_id);

    setIsCreatingKb(true);
    setPendingResources((prev: Map<string, string>) => {
      const newPending: Map<string, string> = new Map(prev);
      finalResourceIds.forEach((id: string) => newPending.set(id, OP_INDEXING));
      return newPending;
    });

    try {
      const newKb: KnowledgeBase = await createKnowledgeBase(token, connectionId, finalResourceIds);
      await syncKnowledgeBase(token, newKb.knowledge_base_id, organizationQuery.data.org_id);
      queryClient.setQueryData([QUERY_KEY_KNOWLEDGE_BASES, isOnlineMode], (oldData: KnowledgeBase[] | undefined) => (oldData ? [...oldData, newKb] : [newKb]));
      setKnowledgeBaseId(newKb.knowledge_base_id);
      setSelectedResources([]);
      setCurrentPath(undefined);
      setPathHistory([]);
      setPageCursors([]);
      setCurrentPageIndex(0);
    } catch (error) {
      console.error("Failed to create or sync knowledge base:", error);
      setPendingResources(new Map());
    } finally {
      setIsCreatingKb(false);
    }
  }, [token, connectionId, organizationQuery.data?.org_id, selectedResources, queryClient, setKnowledgeBaseId, isOnlineMode]);

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

    return resourcesQuery.data?.data.map((res: Resource) => {
      const pendingOperation: string | undefined = pendingResources.get(res.resource_id);
      return {
        ...res,
        status: pendingOperation ? INDEXING : kbStatusMap.get(res.resource_id) || NOT_INDEXED
      };
    });
  }, [resourcesQuery.data, kbResourcesQuery.data, pendingResources]);

  const handleResourceSelect = useCallback((resource: Resource): void => {
    if (resource.status === INDEXING) return;
    if (isOnlineMode) {
      if (knowledgeBaseId) {
        if (resource.status === INDEXED) {
          deindexMutation.mutate(resource);
        } else if (resource.status === NOT_INDEXED) {
          indexMutation.mutate(resource);
        }
      } else {
        setSelectedResources((prev: Resource[]) =>
          prev.some((r: Resource) => r.resource_id === resource.resource_id)
            ? prev.filter((r: Resource) => r.resource_id !== resource.resource_id)
            : [...prev, resource]
        );
      }
    } else {
      const traverseAndMutate = (res: Resource, action: PendingOperation) => {
        const kbStatusMap: Map<string, string> = new Map<string, string>();
        kbResourcesQuery.data?.data.forEach((kbRes: Resource) => kbStatusMap.set(kbRes.resource_id, INDEXED));
        const currentStatus: IndexStatus = pendingResources.has(res.resource_id) ? INDEXING : (kbStatusMap.get(res.resource_id) || NOT_INDEXED);
        if (action === OP_INDEXING && currentStatus === NOT_INDEXED) {
          indexMutation.mutate(res);
        } else if (action === OP_DEINDEXING && currentStatus === INDEXED) {
          deindexMutation.mutate(res);
        }
        mockResources
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
        } else if (resource.status === NOT_INDEXED) {
          indexMutation.mutate(resource);
        }
      }
    }
  }, [isOnlineMode, knowledgeBaseId, indexMutation, deindexMutation, pendingResources, kbResourcesQuery.data, setSelectedResources]);

  const handleFolderClick = useCallback((resource: Resource): void => {
    setPathHistory((prevPathHistory: Resource[]): Resource[] => [...prevPathHistory, resource]);
    setCurrentPath(resource.resource_id);
    setPageCursors([]);
    setCurrentPageIndex(0);
  }, [setPathHistory, setCurrentPath]);

  const handleBreadcrumbClick = useCallback((index: number): void => {
    const newPathHistory: Resource[] = pathHistory.slice(0, index + 1);
    setPathHistory(newPathHistory);
    setCurrentPath(newPathHistory.length > 0 ? newPathHistory[newPathHistory.length - 1].resource_id : undefined);
    setPageCursors([]);
    setCurrentPageIndex(0);
  }, [pathHistory, setPathHistory, setCurrentPath]);

  const goToNextPage = useCallback(() => {
    setPageCursors((prev: string[]) => [...prev, resourcesQuery.data!.next_cursor!]);
    setCurrentPageIndex((prev: number) => prev + 1);
  }, [resourcesQuery.data]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev: number) => prev - 1);
    }
  }, [currentPageIndex]);

  return {
    logout,
    connectionId,
    setConnectionId,
    knowledgeBaseId,
    setKnowledgeBaseId,
    pathHistory,
    pageCursors,
    currentPageIndex,
    goToNextPage,
    goToPreviousPage,
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
    pendingResources,
    searchTerm,
    setSearchTerm,
    setPathHistory,
    setCurrentPath,
    currentPath,
    createAndSyncKnowledgeBase,
    selectedResources,
    isCreatingKb,
  };
}
