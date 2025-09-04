import { Resource } from "@/types";

const KB_RESOURCES_KEY: string = 'kb_resources';

const saveKbResourcesToLocalStorage = (resources: Resource[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KB_RESOURCES_KEY, JSON.stringify(resources));
};

export const getKbResourcesFromLocalStorage = (): Resource[] => {
  if (typeof window === 'undefined') return [];
  const storedResources: string | null = localStorage.getItem(KB_RESOURCES_KEY);
  return storedResources ? JSON.parse(storedResources) : [];
};

export const addKbResourceToLocalStorage = (resource: Resource): void => {
  const currentResources: Resource[] = getKbResourcesFromLocalStorage();
  const updatedResources: Resource[] = [...currentResources, { ...resource }];
  saveKbResourcesToLocalStorage(updatedResources);
};

export const removeKbResourceFromLocalStorage = (resource_path: string): void => {
  const currentResources: Resource[] = getKbResourcesFromLocalStorage();
  const updatedResources: Resource[] = currentResources.filter(r => r.inode_path.path !== resource_path);
  saveKbResourcesToLocalStorage(updatedResources);
};
