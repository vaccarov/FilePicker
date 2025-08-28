import { mockKnowledgeBases, mockResources } from '@/lib/mockData';
import { getEnvVar } from '@/lib/utils';
import { AuthResponse, Connection, KnowledgeBase, Organization, PaginatedResponse, Resource } from '@/types';

const backendUrl: string = getEnvVar('NEXT_PUBLIC_BACKEND_URL');

const KB_RESOURCES_KEY = 'kb_resources';
const getKbResourcesFromLocalStorage = (): Resource[] => {
  if (typeof window === 'undefined') return [];
  const storedResources = localStorage.getItem(KB_RESOURCES_KEY);
  return storedResources ? JSON.parse(storedResources) : [];
};

const saveKbResourcesToLocalStorage = (resources: Resource[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KB_RESOURCES_KEY, JSON.stringify(resources));
};

export const addKbResourceToLocalStorage = (resource: Resource): void => {
  const currentResources = getKbResourcesFromLocalStorage();
  const updatedResources = [...currentResources, { ...resource }];
  saveKbResourcesToLocalStorage(updatedResources);
};

export const removeKbResourceFromLocalStorage = (resourceId: string): void => {
  const currentResources = getKbResourcesFromLocalStorage();
  const updatedResources = currentResources.filter(r => r.resource_id !== resourceId);
  saveKbResourcesToLocalStorage(updatedResources);
};

export const getAuthToken = async (password: string): Promise<string> => {
  const supabaseUrl: string = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey: string = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const email: string = getEnvVar('NEXT_PUBLIC_EMAIL');

  const response: Response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Apikey: anonKey },
    body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Authentication failed');
  }
  const data: AuthResponse = await response.json();
  return data.access_token;
};

export const listConnections = async (token: string): Promise<Connection[]> => {
  const response: Response = await fetch(`${backendUrl}/connections?connection_provider=gdrive`,
    { headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) { throw new Error('Failed to fetch connections'); }
  return response.json();
};

export const listResources = async (token: string, connectionId: string, parentId?: string, limit: number = 20, offset: number = 0): Promise<PaginatedResponse<Resource>> => {
  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredResources: Resource[] = mockResources;
      if (parentId) {
        // Filter resources by parentId
        filteredResources = mockResources.filter((resource: Resource) => resource.parent_id === parentId);
      } else {
        // If no parentId, show root level resources (those without a parent_id)
        filteredResources = mockResources.filter((resource: Resource) => !resource.parent_id);
      }

      // Apply pagination
      const paginatedResources = filteredResources.slice(offset, offset + limit);
      const nextCursor = offset + limit < filteredResources.length ? `cursor-${offset + limit}` : null;

      resolve({
        data: paginatedResources,
        next_cursor: nextCursor,
        current_cursor: `cursor-${offset}`,
      });
    }, 500);
  });

  /* Original API call (commented out)
  const response: Response = await fetch(`${backendUrl}/connections/${connectionId}/resources/children?limit=${limit}&offset=${offset}${parentId ? `&parent_id=${parentId}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) { throw new Error(`Failed to fetch resources`); }
  return response.json();
  */
};

export const getCurrentOrganization = async (token: string): Promise<Organization> => {
  const response: Response = await fetch(`${backendUrl}/organizations/me/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) { throw new Error('Failed to fetch organization'); }
  return response.json();
};

export const listKnowledgeBases = async (token: string): Promise<KnowledgeBase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockKnowledgeBases), 500);
  });
  // Original API call
  // const response: Response = await fetch(`${backendUrl}/knowledge_bases`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!response.ok) { throw new Error('Failed to list knowledge bases'); }
  // return response.json();
};

export const createKnowledgeBase = async (token: string, connection_id: string, connection_source_ids: string[]): Promise<KnowledgeBase> => {
  const response: Response = await fetch(`${backendUrl}/knowledge_bases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      connection_id,
      connection_source_ids,
      // Using default indexing params as seen in the notebook
      indexing_params: { ocr: false, unstructured: true, embedding_params: { embedding_model: 'text-embedding-ada-002', api_key: null }, chunker_params: { chunk_size: 1500, chunk_overlap: 500, chunker: 'sentence' } },
    }),
  });
  if (!response.ok) { throw new Error('Failed to create knowledge base'); }
  return response.json();
};

// export const syncKnowledgeBase = async (token: string, kbId: string, orgId: string): Promise<void> => {
  // const response: Response = await fetch(`${backendUrl}/knowledge_bases/sync/trigger/${kbId}/${orgId}`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (response.status !== 200) { // Sync endpoint returns 200 on success
  //   throw new Error('Failed to trigger knowledge base sync');
  // }
// };

export const listKnowledgeBaseResources = async (token: string, kbId: string): Promise<PaginatedResponse<Resource>> => {
  
  // Mock data for development using localStorage
  return new Promise((resolve) => {
    setTimeout(() => {
      const data =  getKbResourcesFromLocalStorage();
      console.log('Fetching KB resources from localStorage', data.length);
      resolve({
        data,
        next_cursor: null,
        current_cursor: null,
      });
    }, 500);
  });

  /* Original API call (commented out)
  const response: Response = await fetch(`${backendUrl}/knowledge_bases/${kbId}/resources/children`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) { throw new Error('Failed to fetch knowledge base resources'); }
  return response.json();
  */
};

export const addKnowledgeBaseResource = async (token: string, resource: Resource): Promise<void> => {
  console.log('Adding KB resources from localStorage');
  setTimeout(() => addKbResourceToLocalStorage(resource), 2000);
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200);
  });
};

export const deleteKnowledgeBaseResource = async (token: string, kbId: string, resourcePath: string, resId: string): Promise<void> => {
  console.log('Deleting KB resources from localStorage');
  setTimeout(() => removeKbResourceFromLocalStorage(resId), 2000);
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200);
  });
  /* Original API call (commented out)
  const url: URL = new URL(`${backendUrl}/knowledge_bases/${kbId}/resources`);
  url.searchParams.append('resource_path', resourcePath);
  const response: Response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 204) { // Delete returns 204 on success
    throw new Error('Failed to delete resource from knowledge base');
  }
  */
};