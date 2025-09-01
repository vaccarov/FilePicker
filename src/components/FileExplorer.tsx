'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useFileExplorer } from "@/hooks/useFileExplorer";
import { COLUMN_ID_INODE_TYPE, COLUMN_ID_NAME, COLUMN_ID_STATUS, DIRECTORY, INDEXED, INDEXING, NOT_INDEXED } from "@/lib/constants";
import { Resource } from "@/types";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from "@tanstack/react-table";
import { Fragment, JSX, useEffect, useMemo } from "react";
import { FileExplorerHeader } from "./FileExplorerHeader";
import { ResourceTable } from "./ResourceTable";
import { Skeleton } from "./ui/skeleton";

export interface FileExplorerProps {
  isOnlineMode: boolean;
  token: string;
}

export function FileExplorer({ isOnlineMode, token }: FileExplorerProps): JSX.Element {
  const {
    connectionId,
    setConnectionId,
    knowledgeBaseId,
    setKnowledgeBaseId,
    pathHistory,
    setPathHistory,
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
    pendingResources,
    searchTerm,
    setSearchTerm,
    setCurrentPath,
    currentPath
  } = useFileExplorer({ isOnlineMode, token });

  const columns: ColumnDef<Resource>[] = useMemo((): ColumnDef<Resource>[] => [
    {
      accessorKey: COLUMN_ID_STATUS,
      header: 'Synced',
      enableColumnFilter: true,
      size: 60,
      cell: ({ row }: {row: Row<Resource>}) => (
        <Toggle
          className="cursor-pointer"
          onClick={(e: React.MouseEvent<HTMLButtonElement>): void => e.stopPropagation()}
          pressed={row.original.status === INDEXED}
          onPressedChange={(): void => handleResourceSelect(row.original)}
          disabled={row.original.status === INDEXING}
          aria-label="Toggle index status">
          {row.original.status === INDEXING ? '⏳' : row.original.status === INDEXED ? '✔️' : row.original.status === NOT_INDEXED ? '❌' : <Skeleton className="h-5 w-full" />}
        </Toggle>
      ),
    },
    {
      accessorKey: COLUMN_ID_INODE_TYPE,
      header: 'Type',
      enableColumnFilter: true,
      size: 50,
      cell: ({ row }: {row: Row<Resource>}) => (row.original.inode_type === DIRECTORY ? '📁' : '📄'),
    },
    {
      id: COLUMN_ID_NAME,
      accessorKey: 'inode_path.path',
      header: 'Name',
      enableColumnFilter: true,
      cell: ({ row }: {row: Row<Resource>}) => (
        <span className="block truncate" title={row.original.inode_path.path}>
          {row.original.inode_path.path}
        </span>
      ),
    },
  ], [handleResourceSelect]);

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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>File Picker</CardTitle>
        <CardDescription>Select files and folders to index.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FileExplorerHeader
          connectionsQuery={connectionsQuery}
          connectionId={connectionId}
          setConnectionId={setConnectionId}
          kbsQuery={kbsQuery}
          knowledgeBaseId={knowledgeBaseId}
          setKnowledgeBaseId={setKnowledgeBaseId}
        />
        <Input
          placeholder="Search all resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem key='rootBreadcrumb' className="cursor-pointer">
              <BreadcrumbLink onClick={(): void => handleBreadcrumbClick(-1)}>Root</BreadcrumbLink>
            </BreadcrumbItem>
            {pathHistory.map((resource: Resource, index: number) => (
              <Fragment key={resource.resource_id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="cursor-pointer" key={resource.resource_id}>
                  <BreadcrumbLink onClick={(): void => handleBreadcrumbClick(index)}>
                    {resource.inode_path.path}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <ResourceTable
          table={table}
          columns={columns}
          isLoadingResources={resourcesQuery.isLoading || connectionsQuery.isLoading}
          resourcesError={resourcesQuery.error}
          handleFolderClick={handleFolderClick}/>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(): void => setPage((prevPage: number): number => Math.max(0, prevPage - 1))}
                aria-disabled={page === 0}
                size='default'
                className={page === 0 ? "pointer-events-none text-muted-foreground" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="p-2">{page + 1}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={(): void => setPage((prevPage: number): number => prevPage + 1)}
                aria-disabled={!resourcesQuery.data?.next_cursor}
                size='default'
                className={!resourcesQuery.data?.next_cursor ? "pointer-events-none text-muted-foreground" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        {pendingResources.size > 0 && (
          <div className="text-sm text-gray-500 mb-1 grow text-right">
            {pendingResources.size} resource(s) syncing...
          </div>
        )}
      </CardContent>
    </Card>
  );
}