'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDictionary } from "@/context/DictionaryContext";
import { COLUMN_ID_INODE_TYPE, COLUMN_ID_STATUS, DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED } from "@/lib/constants";
import { Dictionary, Resource } from "@/types";
import { Column } from "@tanstack/react-table";
import { JSX } from "react";

export function Filter({ column }: { column: Column<Resource, unknown> }): JSX.Element {
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