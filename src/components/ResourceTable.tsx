'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDictionary } from "@/context/DictionaryContext";
import { DIRECTORY } from "@/lib/constants";
import { Dictionary, Resource } from "@/types";
import { ColumnDef, flexRender, Header, HeaderGroup, Table as TanstackTable } from "@tanstack/react-table";
import { Fragment, JSX } from "react";
import { Filter } from "./Filter";

interface ResourceTableProps {
  table: TanstackTable<Resource>;
  columns: ColumnDef<Resource>[];
  isLoadingResources: boolean;
  resourcesError: Error | null;
  handleFolderClick: (resource: Resource) => void;
  showFilters: boolean;
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