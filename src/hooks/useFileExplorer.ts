'use client';

import { useAuth } from "@/context/AuthContext";
import { COLUMN_ID_INODE_TYPE, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED, OP_DEINDEXING, OP_INDEXING } from "@/lib/constants";
import { mockResources } from '@/lib/mockData';
import { IndexStatus, PendingOperation, Resource } from "@/types";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useResourceMutations } from "./file-explorer/useResourceMutations";
import { useResourceQueries } from "./file-explorer/useResourceQueries";

interface Props {
  isOnlineMode: boolean;
  token: string;
}

export function useFileExplorer({ isOnlineMode, token }: Props) {
  const { logout }: { token: string | null, logout: () => void } = useAuth();
  const [connectionId, setConnectionId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId]: [string, Dispatch<SetStateAction<string>>] = useState<string>('');
  const [pendingResources, setPendingResources] = useState<Map<string, PendingOperation>>(new Map());
  const [currentPath, setCurrentPath]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>(undefined);
  const [pathHistory, setPathHistory]: [Resource[], Dispatch<SetStateAction<Resource[]>>] = useState<Resource[]>([]);
  const [pageCursors, setPageCursors]: [string[], Dispatch<SetStateAction<string[]>>] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
  const [sorting, setSorting]: [SortingState, Dispatch<SetStateAction<SortingState>>] = useState<SortingState>([{ id: COLUMN_ID_INODE_TYPE, desc: false }]);
  const [columnFilters, setColumnFilters]: [ColumnFiltersState, Dispatch<SetStateAction<ColumnFiltersState>>] = useState<ColumnFiltersState>([]);
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [isCreatingKb, setIsCreatingKb] = useState<boolean>(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  const {
    organizationQuery,
    connectionsQuery,
    kbsQuery,
    resourcesQuery,
    kbResourcesQuery,
  } = useResourceQueries({
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
  });

  const {
    indexMutation,
    deindexMutation,
    createAndSyncKnowledgeBase,
  } = useResourceMutations({
    isOnlineMode,
    token,
    knowledgeBaseId,
    setKnowledgeBaseId,
    connectionId,
    organizationQuery,
    selectedResources,
    setSelectedResources,
    setPendingResources,
    setCurrentPath,
    setPathHistory,
    setPageCursors,
    setCurrentPageIndex,
    setIsCreatingKb,
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
  }, [kbResourcesQuery.data, setPendingResources]);

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
  }, [setPathHistory, setCurrentPath, setPageCursors, setCurrentPageIndex]);

  const handleBreadcrumbClick = useCallback((index: number): void => {
    const newPathHistory: Resource[] = pathHistory.slice(0, index + 1);
    setPathHistory(newPathHistory);
    setCurrentPath(newPathHistory.length > 0 ? newPathHistory[newPathHistory.length - 1].resource_id : undefined);
    setPageCursors([]);
    setCurrentPageIndex(0);
  }, [pathHistory, setPathHistory, setCurrentPath, setPageCursors, setCurrentPageIndex]);

  const goToNextPage = useCallback(() => {
    setPageCursors((prev: string[]) => [...prev, resourcesQuery.data!.next_cursor!]);
    setCurrentPageIndex((prev: number) => prev + 1);
  }, [resourcesQuery.data, setPageCursors, setCurrentPageIndex]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev: number) => prev - 1);
    }
  }, [currentPageIndex, setCurrentPageIndex]);

  return {
    logout,
    connectionId,
    setConnectionId,
    knowledgeBaseId,
    setKnowledgeBaseId,
    pathHistory,
    setPathHistory,
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
    setDebouncedSearchTerm,
    setCurrentPath,
    currentPath,
    createAndSyncKnowledgeBase,
    selectedResources,
    isCreatingKb,
    setIsCreatingKb,
  };
}