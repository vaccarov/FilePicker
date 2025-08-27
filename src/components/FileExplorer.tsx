import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { useAuth } from "@/context/AuthContext";
import { INDEXED, INDEXING, SORT_DIRECTION_ASC, SORT_DIRECTION_DESC, SORT_KEY_NAME, SORT_KEY_TYPE } from '@/lib/constants';
import { deleteKnowledgeBaseResource, getCurrentOrganization, listConnections, listKnowledgeBaseResources, listKnowledgeBases, listResources, syncKnowledgeBase } from "@/services/api";
import { Connection, KnowledgeBase, Organization, Resource, SortDirection, SortKey } from "@/types";
import { QueryClient, useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, JSX, useEffect, useMemo, useState } from "react";

export function FileExplorer(): JSX.Element {
  const { token, logout } = useAuth();
  const queryClient: QueryClient = useQueryClient();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>('');
  const [pendingResources, setPendingResources] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const [pathHistory, setPathHistory] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: SORT_KEY_NAME, direction: SORT_DIRECTION_ASC });
  const { data: organization } = useQuery<Organization, Error>({
    queryKey: ['organization'],
    queryFn: () => getCurrentOrganization(token!),
    enabled: !!token
  });

  const { data: connections, isLoading: isLoadingConnections, error: connectionsError } = useQuery<Connection[], Error>({
    queryKey: ['connections'],
    queryFn: () => listConnections(token!),
    enabled: !!token,
  });

  useEffect(() => {
    setPathHistory([]);
    setCurrentPath(undefined);
    setPage(0);
    if (connections && connections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connections[0].connection_id);
    }
  }, [connections, selectedConnectionId]);

  const { data: kbs, isLoading: isLoadingKbs, error: kbsError } = useQuery<KnowledgeBase[], Error>({
    queryKey: ['knowledgeBases'],
    queryFn: () => listKnowledgeBases(token!),
    enabled: !!token
  });

  useEffect(() => {
    if (kbs && kbs.length > 0 && !knowledgeBaseId) {
      setKnowledgeBaseId(kbs[0].knowledge_base_id);
    }
  }, [kbs]);

  const { data: resourcesData, isLoading: isLoadingResources, error: resourcesError } = useQuery({
    queryKey: ['resources', selectedConnectionId, currentPath],
    queryFn: () => listResources(token!, selectedConnectionId!, currentPath),
    enabled: !!selectedConnectionId,
  });

  const isPollingEnabled: boolean = pendingResources.size > 0;
  const { data: kbResourcesData, isLoading: isLoadingKbResources, error: kbError } = useQuery({
    queryKey: ['kbResources', knowledgeBaseId],
    queryFn: () => listKnowledgeBaseResources(token!, knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
    refetchInterval: isPollingEnabled ? 3000 : false,
  });

  useEffect(() => {
    console.log('kbResourcesData', kbResourcesData);
  }, [kbResourcesData]);

  const indexMutation: UseMutationResult<Resource, Error, Resource, unknown> = useMutation({
    // mutationFn: async (resource: Resource): Promise<void> => {
    //   if (!token || !organization || !knowledgeBaseId) throw new Error('Required info missing.');
    //   await syncKnowledgeBase(token, knowledgeBaseId, organization.org_id);
    // },
    // onSuccess: (_, variables: Resource) => { setPendingResources(prev => new Set(prev).add(variables.resource_id)); },
    mutationFn: async (resource: Resource): Promise<Resource> => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(r => r.resource_id === resource.resource_id ? { ...r, status: INDEXING } : r)
        };
      });
      await new Promise(resolve => setTimeout(resolve, 5000));
      return resource;
    },
    onSuccess: (resource: Resource) => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(r => r.resource_id === resource.resource_id ? { ...r, status: INDEXED } : r)
        };
      });
    },
  });

  const deindexMutation: UseMutationResult<Resource, Error, Resource, unknown> = useMutation({
    // mutationFn: async (resource: Resource): Promise<void> => {
    //   if (!token || !knowledgeBaseId) throw new Error('Required info missing.');
    //   await deleteKnowledgeBaseResource(token, knowledgeBaseId, resource.inode_path.path);
    // },
    // onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kbResources'] }); },
    mutationFn: async (resource: Resource): Promise<Resource> => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(r => r.resource_id === resource.resource_id ? { ...r, status: INDEXING } : r)
        };
      });
      await new Promise(resolve => setTimeout(resolve, 5000));
      return resource;
    },
    onSuccess: (resource: Resource) => {
      queryClient.setQueryData(['resources', selectedConnectionId, currentPath], (oldData: { data: Resource[] } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(r => r.resource_id === resource.resource_id ? { ...r, status: 'notIndexed' } : r)
        };
      });
    },
  });

  const processedResource: Resource[] = useMemo(() => {
    if (!resourcesData) return [];
    const indexedMap: Map<string, string> = new Map<string, string>();
    kbResourcesData?.data.forEach((res: Resource) => indexedMap.set(res.resource_id, res.status || 'Indexed'));

    // Combining, Filtering and sorting
    return resourcesData?.data
      .map((res: Resource) => ({
        ...res,
        isPending: pendingResources.has(res.resource_id),
      }))
      .filter((resource: Resource) =>
        resource.inode_path.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: Resource, b: Resource) => {
        const aValue: string = sortConfig.key === SORT_KEY_TYPE ? a.inode_type : a.inode_path.path;
        const bValue: string = sortConfig.key === SORT_KEY_TYPE ? b.inode_type : b.inode_path.path;
        if (aValue < bValue) return sortConfig.direction === SORT_DIRECTION_ASC ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === SORT_DIRECTION_ASC ? 1 : -1;
        return 0;
      });
  }, [sortConfig, searchQuery, resourcesData, pendingResources, kbResourcesData]);

  const handleSort = (key: SortKey): void => {
    setSortConfig((prevSortConfig: {key: SortKey; direction: SortDirection;}) => {
      let direction: SortDirection = SORT_DIRECTION_ASC;
      if (prevSortConfig.key === key && prevSortConfig.direction === SORT_DIRECTION_ASC) {
        direction = SORT_DIRECTION_DESC;
      }
      return { key, direction };
    });
  };

  const getChildrenOfDirectory = (directoryId: string): Resource[] => {
    const children: Resource[] = resourcesData?.data.filter((resource: Resource) => resource.parent_id === directoryId) || [];
    let allChildren: Resource[] = [...children];

    children.forEach((child: Resource) => {
      if (child.inode_type === 'directory') {
        allChildren = [...allChildren, ...getChildrenOfDirectory(child.resource_id)];
      }
    });
    return allChildren;
  };

  const handleResourceSelect = (resource: Resource): void => {
    if (resource.status === INDEXING) return;
    if (resource.status === INDEXED) {
      deindexMutation.mutate(resource);
    } else {
      indexMutation.mutate(resource);
    }
  //     const isSelected: boolean = prevSelectedResources.some((res: Resource) => res.resource_id === resource.resource_id);
  //     let checkedResources: Resource[] = [];
  //     if (resource.inode_type === 'file') {
  //       if (isSelected) {
  //         checkedResources = prevSelectedResources.filter((res: Resource) => res.resource_id !== resource.resource_id);
  //       } else {
  //         checkedResources = [...prevSelectedResources, resource];
  //       }
  //     } else if (resource.inode_type === 'directory') {
  //       const children: Resource[] = getChildrenOfDirectory(resource.resource_id);
  //       const allResourcesInFolder: Resource[] = [resource, ...children];
  //       if (isSelected) {
  //         // Deselect the folder and all its children
  //         const allResourceIdsInFolder = new Set(allResourcesInFolder.map(r => r.resource_id));
  //         checkedResources = prevSelectedResources.filter((res: Resource) => !allResourceIdsInFolder.has(res.resource_id));
  //       } else {
  //         // Select the folder and all its children
  //         const existingResourceIds: Set<string> = new Set(prevSelectedResources.map((res: Resource) => res.resource_id));
  //         checkedResources = [
  //           ...prevSelectedResources,
  //           resource,
  //           ...children.filter((res: Resource) => !existingResourceIds.has(res.resource_id))
  //         ];
  //       }
  //     }
  //     // Filter to avoid folders and files duplicates
  //     return checkedResources;
  };

  const handleFolderClick = (resource: Resource): void => {
    setPathHistory((prevPathHistory: Resource[]) => [...prevPathHistory, resource]);
    setCurrentPath(resource.resource_id);
  };

  const handleBreadcrumbClick = (index: number): void => {
    const newPathHistory: Resource[] = pathHistory.slice(0, index + 1);
    setPathHistory(newPathHistory);
    setCurrentPath(newPathHistory.length > 0 ? newPathHistory[newPathHistory.length - 1].resource_id : undefined);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>File Picker</CardTitle>
        <CardDescription>Select files and folders to index.</CardDescription>
        <CardAction>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex align-left flex-wrap gap-4">
          <div>
            <label htmlFor="connection-select" className="block text-sm font-medium text-gray-700 mb-1">Connection</label>
            <Select
              onValueChange={(value: string) => setSelectedConnectionId(value)}
              value={selectedConnectionId}>
              <SelectTrigger id="connection-select" className="w-[180px]">
                <SelectValue placeholder={isLoadingConnections ? "Loading connections..." : "Connections"} />
              </SelectTrigger>
              <SelectContent>
                {connections?.map((connection: Connection) => (
                  <SelectItem key={connection.connection_id} value={connection.connection_id}>{connection.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {connectionsError && <p className="text-red-500 font-bold">Error loading connections: {connectionsError.message}</p>}
          </div>
          <div>
            <label htmlFor="kb-select" className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base</label>
            <Select
              onValueChange={(value: string) => setKnowledgeBaseId(value)}
              value={knowledgeBaseId}>
              <SelectTrigger id="kb-select" className="w-[180px]">
                <SelectValue placeholder={isLoadingKbs ? "Loading knowledge bases..." : "Knowledge Bases"} />
              </SelectTrigger>
              <SelectContent>
                {kbs?.map((kb: KnowledgeBase) => (
                  <SelectItem key={kb.knowledge_base_id} value={kb.knowledge_base_id}>{kb.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kbsError && <p className="text-red-500 font-bold">Error loading knowledge bases: {kbsError.message}</p>}
          </div>
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem key='rootBreadcrumb' className="cursor-pointer">
              <BreadcrumbLink onClick={() => handleBreadcrumbClick(-1)}>Root</BreadcrumbLink>
            </BreadcrumbItem>
            {pathHistory.map((resource: Resource, index: number) => (
              <Fragment key={resource.resource_id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="cursor-pointer" key={resource.resource_id}>
                  <BreadcrumbLink onClick={() => handleBreadcrumbClick(index)}>
                    {resource.inode_path.path}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Synced</TableHead>
              <TableHead onClick={() => handleSort(SORT_KEY_TYPE)} className="cursor-pointer">
                Type {sortConfig.key === SORT_KEY_TYPE && (sortConfig.direction === SORT_DIRECTION_ASC ? '⬆️' : '⬇️')}
              </TableHead>
              <TableHead onClick={() => handleSort(SORT_KEY_NAME)} className="cursor-pointer">
                <div className="flex items-center">
                  <span>Name {sortConfig.key === SORT_KEY_NAME && (sortConfig.direction === SORT_DIRECTION_ASC ? '⬆️' : '⬇️')}</span>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent sorting when clicking on the input
                    className="ml-2 w-auto inline-flex h-8 bg-background"
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedResource.length === 0 ?
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  {isLoadingResources && 'Loading resources...'}
                  {resourcesError && `Error loading resources: ${resourcesError.message}`}
                  {!isLoadingResources && !resourcesError && processedResource.length === 0 && 'No resources found.'}
                </TableCell>
              </TableRow>
            :
            processedResource.map((resource: Resource) => (
              <TableRow
                key={resource.resource_id}
                onClick={() => resource.inode_type === 'directory' && handleFolderClick(resource)}
                className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <Toggle
                    onClick={(e) => e.stopPropagation()}
                    pressed={resource.status === INDEXED}
                    onPressedChange={() => handleResourceSelect(resource)}
                    disabled={resource.status === INDEXING}
                    aria-label="Toggle index status">
                    {resource.status === INDEXING ? '⏳' : resource.status === INDEXED ? '✔️' : '❌'}
                  </Toggle>
                </TableCell>
                <TableCell>{resource.inode_type === 'directory' ? '📁' : '📄'}</TableCell>
                <TableCell><span>{resource.inode_path.path}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => setPage((prevPage: number) => Math.max(0, prevPage - 1))}
            disabled={page === 0}
            variant="outline">
            ⬅️
          </Button>
          <span>Page {page + 1}</span>
          <Button
            onClick={() => setPage((prevPage: number) => prevPage + 1)}
            disabled={!resourcesData?.next_cursor}
            variant="outline">
            ➡️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}