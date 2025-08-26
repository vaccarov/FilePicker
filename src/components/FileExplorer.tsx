import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { listConnections, listResources } from "@/services/api";
import { Connection, Resource } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { JSX, useEffect, useState, useMemo, Fragment } from "react";
import { SORT_DIRECTION_ASC, SORT_DIRECTION_DESC, SORT_KEY_TYPE, SORT_KEY_NAME } from '@/lib/constants';

export function FileExplorer(): JSX.Element {
  const { token, logout } = useAuth();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [checkedResources, setCheckedResources] = useState<Resource[]>([]);
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const [pathHistory, setPathHistory] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const itemsPerPage: number = 10;
  const [sortConfig, setSortConfig] = useState<{ key: typeof SORT_KEY_TYPE | typeof SORT_KEY_NAME; direction: typeof SORT_DIRECTION_ASC | typeof SORT_DIRECTION_DESC }>({ key: SORT_KEY_NAME, direction: SORT_DIRECTION_ASC });

  const { data: connections, isLoading: isLoadingConnections, error: connectionsError } = useQuery<Connection[], Error>({
    queryKey: ['connections'],
    queryFn: () => listConnections(token!),
    enabled: !!token,
  });

  useEffect(() => {
    setSelectedResources([]);
    setCheckedResources([]);
    setPathHistory([]);
    setCurrentPath(undefined);
    setPage(0);
    if (connections && connections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connections[0].connection_id);
    }
  }, [connections, selectedConnectionId]);

  const handleSort = (key: typeof SORT_KEY_TYPE | typeof SORT_KEY_NAME): void => {
    setSortConfig((prevSortConfig) => {
      let direction: typeof SORT_DIRECTION_ASC | typeof SORT_DIRECTION_DESC = SORT_DIRECTION_ASC;
      if (prevSortConfig.key === key && prevSortConfig.direction === SORT_DIRECTION_ASC) {
        direction = SORT_DIRECTION_DESC;
      }
      return { key, direction };
    });
  };

  const { data: resourcesData, isLoading: isLoadingResources, error: resourcesError } = useQuery({
    queryKey: ['resources', selectedConnectionId, currentPath],
    queryFn: () => listResources(token!, selectedConnectionId!, currentPath),
    enabled: !!selectedConnectionId,
  });

  const filteredResources: Resource[] | undefined = resourcesData?.data.filter((resource: Resource) =>
    resource.inode_path.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedResources: Resource[] = useMemo(() => {
    if (!filteredResources) return [];
    const sortableItems: Resource[] = [...filteredResources];
    sortableItems.sort((a: Resource, b: Resource) => {
      const aValue: string = sortConfig.key === SORT_KEY_TYPE ? a.inode_type : a.inode_path.path;
      const bValue: string = sortConfig.key === SORT_KEY_TYPE ? b.inode_type : b.inode_path.path;
      if (aValue < bValue) {
        return sortConfig.direction === SORT_DIRECTION_ASC ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === SORT_DIRECTION_ASC ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [filteredResources, sortConfig]);

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
    setSelectedResources((prevSelectedResources: Resource[]) => {
      const isSelected: boolean = prevSelectedResources.some((res: Resource) => res.resource_id === resource.resource_id);
      let checkedResources: Resource[] = [];
      if (resource.inode_type === 'file') {
        if (isSelected) {
          checkedResources = prevSelectedResources.filter((res: Resource) => res.resource_id !== resource.resource_id);
        } else {
          checkedResources = [...prevSelectedResources, resource];
        }
      } else if (resource.inode_type === 'directory') {
        const children: Resource[] = getChildrenOfDirectory(resource.resource_id);
        const allResourcesInFolder: Resource[] = [resource, ...children];
        if (isSelected) {
          // Deselect the folder and all its children
          const allResourceIdsInFolder = new Set(allResourcesInFolder.map(r => r.resource_id));
          checkedResources = prevSelectedResources.filter((res: Resource) => !allResourceIdsInFolder.has(res.resource_id));
        } else {
          // Select the folder and all its children
          const existingResourceIds: Set<string> = new Set(prevSelectedResources.map((res: Resource) => res.resource_id));
          checkedResources = [
            ...prevSelectedResources,
            resource,
            ...children.filter((res: Resource) => !existingResourceIds.has(res.resource_id))
          ];
        }
      }

      setCheckedResources(checkedResources);
      // Filter to avoid folders and files duplicates
      return checkedResources;
    });
  };

  const handleFolderClick = (resource: Resource): void => {
    if (resource.inode_type === 'directory') {
      setCurrentPath(resource.resource_id);
      setPathHistory((prevPathHistory: Resource[]) => [...prevPathHistory, resource]);
    }
  };

  const handleBreadcrumbClick = (index: number): void => {
    const newPathHistory: Resource[] = pathHistory.slice(0, index + 1);
    setPathHistory(newPathHistory);
    setCurrentPath(newPathHistory.length > 0 ? newPathHistory[newPathHistory.length - 1].resource_id : undefined);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>File Picker</CardTitle>
        </div>
        <CardDescription>Select files and folders to index.</CardDescription>
        <CardAction>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoadingConnections && <p>Loading connections...</p>}
        {connectionsError && <p className="text-red-500 font-bold">Error loading connections: {connectionsError.message}</p>}
        {!isLoadingConnections && !connectionsError && (!connections || connections.length === 0) && (
          <p className="text-gray-500">No connections found. Please add a connection to get started.</p>
        )}
        {connections && connections.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Connections:</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {connections.map((connection: Connection) => (
                <Button
                  key={connection.connection_id}
                  variant={selectedConnectionId === connection.connection_id ? "default" : "outline"}
                  onClick={() => setSelectedConnectionId(connection.connection_id)}>
                  {connection.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        {selectedConnectionId && (
          <div>
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
            {isLoadingResources && <p>Loading resources...</p>}
            {resourcesError && <p className="text-red-500 font-bold">Error loading resources: {resourcesError.message}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
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
                {sortedResources.length === 0 ?
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No resources found.
                    </TableCell>
                  </TableRow>
                :
                sortedResources.map((resource: Resource) => (
                  <TableRow
                    key={resource.resource_id}
                    onClick={() => resource.inode_type === 'directory' && handleFolderClick(resource)}
                    className="cursor-pointer hover:bg-gray-50">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checkedResources.some((res: Resource) => res.resource_id === resource.resource_id)}
                        onCheckedChange={() => handleResourceSelect(resource)}/>
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
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
          <Button
            disabled={selectedResources.length === 0}
            onClick={() => console.log("Add to Knowledge Base:", selectedResources)}>
            {selectedResources.length === 0 ? 'Select files/folders' : `Add ${selectedResources.length} to Knowledge Base`}
          </Button>
      </CardFooter>
    </Card>
  );
}