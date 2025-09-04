'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useDictionary } from "@/context/DictionaryContext";
import { useFileExplorer } from "@/hooks/useFileExplorer";
import { COLUMN_ID_INODE_TYPE, COLUMN_ID_NAME, COLUMN_ID_STATUS, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED } from "@/lib/constants";
import { Dictionary, Resource } from "@/types";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from "@tanstack/react-table";
import { CheckCircle2, Filter as FilterIcon, FilterX, Loader2, XCircle } from "lucide-react";
import { JSX, useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { FileExplorerHeader } from "./FileExplorerHeader";
import { Pagination } from "./Pagination";
import { ResourceTable } from "./ResourceTable";
import { Skeleton } from "./ui/skeleton";

const renderIcon = (status: string| undefined): JSX.Element => {
  switch (status) {
    case INDEXING:
      return <Loader2 className="h-5 w-5 animate-spin" />;
    case INDEXED:
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case NOT_INDEXED:
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Skeleton className="h-5 w-full" />;
  }
};

interface FileExplorerProps {
  isOnlineMode: boolean;
  token: string;
}

export function FileExplorer({ isOnlineMode, token }: FileExplorerProps): JSX.Element {
  const dictionary: Dictionary = useDictionary();
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const {
    connectionId,
    setConnectionId,
    knowledgeBaseId,
    setKnowledgeBaseId,
    pathHistory,
    setPathHistory,
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
    setCurrentPath,
    currentPath,
    createAndSyncKnowledgeBase,
    selectedResources,
    isCreatingKb,
    setDebouncedSearchTerm
  } = useFileExplorer({ isOnlineMode, token });

  const columns: ColumnDef<Resource>[] = useMemo((): ColumnDef<Resource>[] => [
    {
      accessorKey: COLUMN_ID_STATUS,
      header: dictionary.synced,
      enableColumnFilter: true,
      size: 100,
      cell: ({ row }: { row: Row<Resource> }) => {
        if (isOnlineMode && !knowledgeBaseId)
          return (
            <Checkbox
              onClick={(e: React.MouseEvent<HTMLButtonElement>): void => e.stopPropagation()}
              className="cursor-pointer"
              checked={selectedResources.some((resource: Resource) => resource.resource_id === row.original.resource_id)}
              onCheckedChange={(): void => handleResourceSelect(row.original)}
              disabled={isCreatingKb}
              aria-label="Select resource"
            />
          );
        if (!isOnlineMode || row.original.inode_type === FILE)
          return (
            <Toggle
              className="cursor-pointer data-[state=on]:bg-transparent dark:data-[state=on]:bg-transparent"
              onClick={(e: React.MouseEvent<HTMLButtonElement>): void => e.stopPropagation()}
              pressed={row.original.status === INDEXED}
              onPressedChange={(): void => handleResourceSelect(row.original)}
              disabled={row.original.status === INDEXING}
              aria-label="Toggle index status">
              {renderIcon(row.original.status)}
            </Toggle>
          );
      },
    },
    {
      accessorKey: COLUMN_ID_INODE_TYPE,
      header: dictionary.type,
      enableColumnFilter: true,
      size: 60,
      cell: ({ row }: {row: Row<Resource>}) => (row.original.inode_type === DIRECTORY ? '📁' : '📄'),
    },
    {
      id: COLUMN_ID_NAME,
      accessorKey: 'inode_path.path',
      header: dictionary.name,
      enableColumnFilter: true,
      cell: ({ row }: {row: Row<Resource>}) => (
        <span className="block truncate" title={row.original.inode_path.path}>
          {row.original.inode_path.path}
        </span>
      ),
    },
  ], [handleResourceSelect, dictionary, isOnlineMode, selectedResources, knowledgeBaseId, isCreatingKb]);

  const table = useReactTable<Resource>({
    data: processedResource,
    columns,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm, setDebouncedSearchTerm]);

  useEffect(() => {
    if (searchTerm) {
      setPathHistory([]);
      setCurrentPath(undefined);
    }
  }, [searchTerm, setPathHistory, setCurrentPath]);

  useEffect(() => {
    if (currentPath !== undefined && searchTerm !== '') {
      setSearchTerm('');
    }
  }, [currentPath, searchTerm, setSearchTerm]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{dictionary.file_picker}</h1>
          <p className="text-muted-foreground">{dictionary.select_files_and_folders}</p>
        </div>
      </div>
      <FileExplorerHeader
        connectionsQuery={connectionsQuery}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        kbsQuery={kbsQuery}
        knowledgeBaseId={knowledgeBaseId}
        setKnowledgeBaseId={setKnowledgeBaseId}
        // For creating and syncing knowledge base
        isOnlineMode={isOnlineMode}
        isCreatingKb={isCreatingKb}
        selectedResources={selectedResources}
        createAndSyncKnowledgeBase={createAndSyncKnowledgeBase}
      />
      <div className="flex items-center gap-2">
        <Input
          placeholder={dictionary.search_all_resources}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <FilterX className="h-5 w-5" /> : <FilterIcon className="h-5 w-5" />}
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Breadcrumb pathHistory={pathHistory} handleBreadcrumbClick={handleBreadcrumbClick} />
          <ResourceTable
            table={table}
            columns={columns}
            isLoadingResources={resourcesQuery.isFetching || connectionsQuery.isFetching}
            resourcesError={resourcesQuery.error}
            handleFolderClick={handleFolderClick}
            showFilters={showFilters}
          />
        </CardContent>
      </Card>
      <Pagination
        currentPageIndex={currentPageIndex}
        goToPreviousPage={goToPreviousPage}
        goToNextPage={goToNextPage}
        canGoToNextPage={!!resourcesQuery.data?.next_cursor}
      />
      <div className="flex justify-end items-center gap-4">
        {isOnlineMode && !knowledgeBaseId && selectedResources?.length > 0 && !isCreatingKb && (
          <div className="text-sm text-gray-500">
            {dictionary.resources_selected?.replace('{count}', String(selectedResources.length))}
          </div>
        )}
        {!isOnlineMode && pendingResources.size > 0 && (
          <div className="text-sm text-gray-500">
            {dictionary.resources_syncing?.replace('{count}', String(pendingResources.size))}
          </div>
        )}
      </div>
    </div>
  );
}
