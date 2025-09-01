'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDictionary } from "@/context/DictionaryContext";
import { Connection, Dictionary, KnowledgeBase } from "@/types";
import { UseQueryResult } from "@tanstack/react-query";
import { Dispatch, JSX, SetStateAction } from "react";

interface FileExplorerHeaderProps {
  connectionsQuery: UseQueryResult<Connection[], Error>;
  connectionId: string;
  setConnectionId: Dispatch<SetStateAction<string>>;
  kbsQuery: UseQueryResult<KnowledgeBase[], Error>;
  knowledgeBaseId: string;
  setKnowledgeBaseId: Dispatch<SetStateAction<string>>;
}

export function FileExplorerHeader({ connectionsQuery, connectionId, setConnectionId, kbsQuery, knowledgeBaseId, setKnowledgeBaseId }: FileExplorerHeaderProps): JSX.Element {
  const dictionary: Dictionary = useDictionary();
  return (
    <div className="flex align-left flex-wrap gap-4">
      <div>
        <label htmlFor="connection-select" className="block text-sm font-medium text-gray-700 mb-1">{dictionary.select_a_connection}</label>
        <Select
          onValueChange={(value: string): void => setConnectionId(value)}
          value={connectionId}>
          <SelectTrigger id="connection-select" className="w-[180px]">
            <SelectValue placeholder={connectionsQuery.isLoading ? dictionary.loading_connections : dictionary.select_a_connection} />
          </SelectTrigger>
          <SelectContent>
            {connectionsQuery.data && Array.isArray(connectionsQuery.data) && connectionsQuery.data.map((connection: Connection) => (
              <SelectItem key={connection.connection_id} value={connection.connection_id}>{connection.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {connectionsQuery.error && <p className="text-red-500 font-bold">{dictionary.error_loading_connections?.replace("{message}", connectionsQuery.error.message)}</p>}
      </div>
      <div>
        <label htmlFor="kb-select" className="block text-sm font-medium text-gray-700 mb-1">{dictionary.knowledge_base}</label>
        <Select
          onValueChange={(value: string): void => setKnowledgeBaseId(value)}
          value={knowledgeBaseId}>
          <SelectTrigger id="kb-select" className="w-[180px]">
            <SelectValue placeholder={kbsQuery.isLoading ? dictionary.loading_knowledge_bases : dictionary.select_a_knowledge_base} />
          </SelectTrigger>
          <SelectContent>
            {kbsQuery.data && Array.isArray(kbsQuery.data) && kbsQuery.data.map((kb: KnowledgeBase) => (
              <SelectItem key={kb.knowledge_base_id} value={kb.knowledge_base_id}>{kb.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kbsQuery.error && <p className="text-red-500 font-bold">{dictionary.error_loading_kbs?.replace("{message}", kbsQuery.error.message)}</p>}
      </div>
    </div>
  );
}