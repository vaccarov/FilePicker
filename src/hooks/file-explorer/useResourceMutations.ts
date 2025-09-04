'use client';

import { DIRECTORY, OP_DEINDEXING, OP_INDEXING, QUERY_KEY_KB_RESOURCES, QUERY_KEY_KNOWLEDGE_BASES } from "@/lib/constants";
import { addKnowledgeBaseResource, createKnowledgeBase, deleteKnowledgeBaseResource, syncKnowledgeBase } from "@/services/api";
import { KnowledgeBase, Resource } from "@/types";
import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Dispatch, SetStateAction } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { Organization, PendingOperation } from "@/types";

interface UseResourceMutationsProps {
  isOnlineMode: boolean;
  token: string | null;
  knowledgeBaseId: string;
  setKnowledgeBaseId: Dispatch<SetStateAction<string>>;
  connectionId: string;
  organizationQuery: UseQueryResult<Organization, Error>;
  selectedResources: Resource[];
  setSelectedResources: Dispatch<SetStateAction<Resource[]>>;
  setPendingResources: Dispatch<SetStateAction<Map<string, PendingOperation>>>;
  setCurrentPath: Dispatch<SetStateAction<string | undefined>>;
  setPathHistory: Dispatch<SetStateAction<Resource[]>>;
  setPageCursors: Dispatch<SetStateAction<string[]>>;
  setCurrentPageIndex: Dispatch<SetStateAction<number>>;
  setIsCreatingKb: Dispatch<SetStateAction<boolean>>;
}

export function useResourceMutations({
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
}: UseResourceMutationsProps) {
  const queryClient = useQueryClient();

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
  }, [token, connectionId, organizationQuery.data?.org_id, selectedResources, queryClient, isOnlineMode, setKnowledgeBaseId, setSelectedResources, setCurrentPath, setPathHistory, setPageCursors, setCurrentPageIndex, setPendingResources, setIsCreatingKb]);

  return {
    indexMutation,
    deindexMutation,
    createAndSyncKnowledgeBase,
  };
}