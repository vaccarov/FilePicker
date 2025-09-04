'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDictionary } from "@/context/DictionaryContext";
import { COLUMN_ID_INODE_TYPE, COLUMN_ID_STATUS, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED } from "@/lib/constants";
import { Dictionary, Resource } from "@/types";
import { Column, ColumnDef, flexRender, Header, HeaderGroup, Table as TanstackTable } from "@tanstack/react-table";
import { Fragment, JSX } from "react";

interface ResourceTableProps {
  table: TanstackTable<Resource>;
  columns: ColumnDef<Resource>[];
  isLoadingResources: boolean;
  resourcesError: Error | null;
  handleFolderClick: (resource: Resource) => void;
  showFilters: boolean;
}

function Filter({ column }: { column: Column<Resource, unknown> }): JSX.Element {
  const dictionary: Dictionary = useDictionary();
  const columnFilterValue: string | undefined = column.getFilterValue() as string | undefined;

  const handleSelectChange = (value: string): void => {
    column.setFilterValue(value !== 'all' ? value : undefined);
  };

  if (column.id === COLUMN_ID_STATUS) {
    return (
      <Select
        onValueChange={handleSelectChange}
        value={columnFilterValue?.toString() || 'all'}>
        <SelectTrigger className="w-full border shadow rounded" onClick={(e: React.MouseEvent<HTMLButtonElement>): void => e.stopPropagation()}>
          <SelectValue placeholder={dictionary.filter_status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{dictionary.all}</SelectItem>
          <SelectItem value={INDEXED}>{dictionary.indexed}</SelectItem>
          <SelectItem value={NOT_INDEXED}>{dictionary.not_indexed}</SelectItem>
          <SelectItem value={INDEXING}>{dictionary.indexing}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (column.id === COLUMN_ID_INODE_TYPE) {
    return (
      <Select
        onValueChange={handleSelectChange}
        value={columnFilterValue?.toString() || 'all'}>
        <SelectTrigger className="w-full border shadow rounded" onClick={(e: React.MouseEvent<HTMLButtonElement>): void => e.stopPropagation()}>
          <SelectValue placeholder={dictionary.filter_type} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{dictionary.all}</SelectItem>
          <SelectItem value={DIRECTORY}>{dictionary.directory}</SelectItem>
          <SelectItem value={FILE}>{dictionary.file}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e: React.ChangeEvent<HTMLInputElement>): void => column.setFilterValue(e.target.value)}
      placeholder={dictionary.search_name}
      className="w-full border shadow rounded"
      onClick={(e: React.MouseEvent<HTMLInputElement>): void => e.stopPropagation()}
    />
  );
}

export function ResourceTable({ table, columns, isLoadingResources, resourcesError, handleFolderClick, showFilters }: ResourceTableProps): JSX.Element {
  const dictionary: Dictionary = useDictionary();

  return (
    <div className="flex flex-col gap-4">
      <Table className="table-fixed w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<Resource>) => (
            <Fragment key={headerGroup.id}>
              {showFilters && (
                <TableRow className="hover:bg-transparent">
                  {headerGroup.headers
                    .filter((header: Header<Resource, unknown>) => header.column.getCanFilter())
                    .map((header: Header<Resource, unknown>) => (
                      <TableHead key={`${header.id}-search`} className="pl-0 pr-1 pt-2 pb-2" style={{ width: `${header.getSize()}px` }}>
                        <Filter column={header.column} />
                      </TableHead>
                    ))
                  }
                </TableRow>
              )}
              <TableRow>
                {headerGroup.headers.map((header: Header<Resource, unknown>) => (
                  <TableHead key={`${header.id}-sort`} style={{ width: `${header.getSize()}px` }}>
                    <div
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ⬆️',
                        desc: ' ⬇️',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </Fragment>
          ))}
        </TableHeader>
        <TableBody>
          {isLoadingResources ? (
            [...Array(3)].map((_, i: number) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                <TableCell><Skeleton className="h-9 w-full" /></TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-9 text-center py-4">
                {resourcesError && dictionary.error_loading_resources?.replace('{message}', resourcesError.message)}
                {!resourcesError && dictionary.no_resources_found}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                onClick={(): void => { if (row.original.inode_type === DIRECTORY) { handleFolderClick(row.original); } }}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    <div className="h-9 flex items-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}