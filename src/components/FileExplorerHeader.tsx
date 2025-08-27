'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Connection, KnowledgeBase } from "@/types";
import { UseQueryResult } from "@tanstack/react-query";
import { Dispatch, JSX, SetStateAction } from "react";

interface FileExplorerHeaderProps {
  connectionsQuery: UseQueryResult<Connection[], Error>;
  selectedConnectionId: string;
  setSelectedConnectionId: Dispatch<SetStateAction<string>>;
  kbsQuery: UseQueryResult<KnowledgeBase[], Error>;
  knowledgeBaseId: string;
  setKnowledgeBaseId: Dispatch<SetStateAction<string>>;
}

export function FileExplorerHeader({ connectionsQuery, selectedConnectionId, setSelectedConnectionId, kbsQuery, knowledgeBaseId, setKnowledgeBaseId, }: FileExplorerHeaderProps): JSX.Element {
  return (
    <div className="flex align-left flex-wrap gap-4">
      <div>
        <label htmlFor="connection-select" className="block text-sm font-medium text-gray-700 mb-1">Connection</label>
        <Select
          onValueChange={(value: string): void => setSelectedConnectionId(value)}
          value={selectedConnectionId}>
          <SelectTrigger id="connection-select" className="w-[180px]">
            <SelectValue placeholder={connectionsQuery.isLoading ? "Loading connections..." : "Connections"} />
          </SelectTrigger>
          <SelectContent>
            {connectionsQuery.data?.map((connection: Connection) => (
              <SelectItem key={connection.connection_id} value={connection.connection_id}>{connection.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {connectionsQuery.error && <p className="text-red-500 font-bold">Error loading connections: {connectionsQuery.error.message}</p>}
      </div>
      <div>
        <label htmlFor="kb-select" className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base</label>
        <Select
          onValueChange={(value: string): void => setKnowledgeBaseId(value)}
          value={knowledgeBaseId}>
          <SelectTrigger id="kb-select" className="w-[180px]">
            <SelectValue placeholder={kbsQuery.isLoading ? "Loading knowledge bases..." : "Knowledge Bases"} />
          </SelectTrigger>
          <SelectContent>
            {kbsQuery.data?.map((kb: KnowledgeBase) => (
              <SelectItem key={kb.knowledge_base_id} value={kb.knowledge_base_id}>{kb.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kbsQuery.error && <p className="text-red-500 font-bold">Error loading knowledge bases: {kbsQuery.error.message}</p>}
      </div>
    </div>
  );
}