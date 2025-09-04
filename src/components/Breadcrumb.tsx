'use client';

import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, Breadcrumb as ShadcnBreadcrumb, } from "@/components/ui/breadcrumb";
import { useDictionary } from "@/context/DictionaryContext";
import { Resource } from "@/types";
import { Fragment, JSX } from "react";

interface BreadcrumbProps {
  pathHistory: Resource[];
  handleBreadcrumbClick: (index: number) => void;
}

export function Breadcrumb({ pathHistory, handleBreadcrumbClick }: BreadcrumbProps): JSX.Element {
  const dictionary = useDictionary();

  return (
    <ShadcnBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem key='rootBreadcrumb' className="cursor-pointer">
          <BreadcrumbLink onClick={(): void => handleBreadcrumbClick(-1)}>{dictionary.root}</BreadcrumbLink>
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
    </ShadcnBreadcrumb>
  );
}