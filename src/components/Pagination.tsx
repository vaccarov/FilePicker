'use client';

import { Pagination as ShadcnPagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination";
import { JSX } from "react";

interface PaginationProps {
  currentPageIndex: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  canGoToNextPage: boolean;
}

export function Pagination({ currentPageIndex, goToPreviousPage, goToNextPage, canGoToNextPage }: PaginationProps): JSX.Element {
  return (
    <ShadcnPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={goToPreviousPage}
            aria-disabled={currentPageIndex === 0}
            className={currentPageIndex === 0 ? "pointer-events-none text-muted-foreground" : "cursor-pointer"}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="p-2">{currentPageIndex + 1}</span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={goToNextPage}
            aria-disabled={!canGoToNextPage}
            className={!canGoToNextPage ? "pointer-events-none text-muted-foreground" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
}