'use client';

import { QUERY_KEY_CONNECTIONS, QUERY_KEY_KB_RESOURCES, QUERY_KEY_KNOWLEDGE_BASES, QUERY_KEY_ORGANIZATION, QUERY_KEY_RESOURCES, REFRESH_MS } from "@/lib/constants";
import { getCurrentOrganization, listConnections, listKnowledgeBaseResources, listKnowledgeBases, listResources } from "@/services/api";
import { Connection, KnowledgeBase, Organization, Resource } from "@/types";
import { QueryClient, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";

interface UseResourceQueriesProps {
  isOnlineMode: boolean;
  token: string | null;
  connectionId: string;
  setConnectionId: Dispatch<SetStateAction<string>>;
  knowledgeBaseId: string;
  setKnowledgeBaseId: Dispatch<SetStateAction<string>>;
  currentPath: string | undefined;
  debouncedSearchTerm: string;
  pageCursors: string[];
  currentPageIndex: number;
  pathHistory: Resource[];
  pendingResources: Map<string, string>;
  setPathHistory: Dispatch<SetStateAction<Resource[]>>;
  setCurrentPath: Dispatch<SetStateAction<string | undefined>>;
  setPageCursors: Dispatch<SetStateAction<string[]>>;
  setCurrentPageIndex: Dispatch<SetStateAction<number>>;
}

export function useResourceQueries({
  isOnlineMode,
  token,
  connectionId,
  setConnectionId,
  knowledgeBaseId,
  setKnowledgeBaseId,
  currentPath,
  debouncedSearchTerm,
  pageCursors,
  currentPageIndex,
  pathHistory,
  pendingResources,
  setPathHistory,
  setCurrentPath,
  setPageCursors,
  setCurrentPageIndex,
}: UseResourceQueriesProps) {
  const queryClient: QueryClient = useQueryClient();

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
  }, [connectionsQuery.data, connectionId, setConnectionId, setCurrentPageIndex, setPageCursors, setPathHistory, setCurrentPath]);

  useEffect((): void => {
    setPathHistory([]);
    setCurrentPath(undefined);
    setPageCursors([]);
    setCurrentPageIndex(0);
  }, [debouncedSearchTerm, setCurrentPageIndex, setPageCursors, setPathHistory, setCurrentPath]);

  const kbsQuery: UseQueryResult<KnowledgeBase[], Error> = useQuery<KnowledgeBase[], Error>({
    queryKey: [QUERY_KEY_KNOWLEDGE_BASES, isOnlineMode],
    queryFn: () => listKnowledgeBases(isOnlineMode, token!),
    enabled: !!token
  });

  useEffect((): void => {
    if (kbsQuery.data && kbsQuery.data.length > 0 && !knowledgeBaseId) {
      setKnowledgeBaseId(kbsQuery.data[0].knowledge_base_id);
    }
  }, [kbsQuery.data, knowledgeBaseId, setKnowledgeBaseId]);

  const resourcesQuery: UseQueryResult<{ data: Resource[], next_cursor: string | null }, Error> = useQuery({
    queryKey: [QUERY_KEY_RESOURCES, connectionId, currentPath, debouncedSearchTerm, isOnlineMode, currentPageIndex],
    queryFn: () => listResources(isOnlineMode, token!, connectionId, currentPath, debouncedSearchTerm, pageCursors[currentPageIndex - 1]),
    enabled: !!connectionId,
  });

  const kbQueryPath: string = useMemo(() => pathHistory.length === 0 ? '/' : `/${pathHistory[pathHistory.length - 1].inode_path.path}`, [pathHistory]);
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

  return {
    organizationQuery,
    connectionsQuery,
    kbsQuery,
    resourcesQuery,
    kbResourcesQuery,
  };
}
