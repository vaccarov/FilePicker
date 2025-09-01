import { mockConnections, mockKnowledgeBases, mockResources } from '@/lib/mockData';
import { getEnvVar } from '@/lib/utils';
import { AuthResponse, Connection, KnowledgeBase, Organization, PaginatedResponse, Resource } from '@/types';
import { addKbResourceToLocalStorage, getKbResourcesFromLocalStorage, removeKbResourceFromLocalStorage } from './localStorage';

const backendUrl: string = getEnvVar('NEXT_PUBLIC_BACKEND_URL');

const customFetch = async (url: string | URL, options?: RequestInit): Promise<Response> => {
  const response: Response = await fetch(url, options);
  if (response.status === 401) {
    window.dispatchEvent(new Event('unauthorized'));
  }
  return response;
};

export const getAuthToken = async ({ email, password }: { email: string; password: string }): Promise<string> => {
  const supabaseUrl: string = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey: string = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

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

export const listConnections = async (isOnline: boolean, token: string): Promise<Connection[]> => {
  if (!isOnline) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockConnections), 500);
    });
  }
  const response: Response = await customFetch(`${backendUrl}/connections?connection_provider=gdrive`,
    { headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) { throw new Error('Failed to fetch connections'); }
  return response.json();
};

export const listResources = async (
  isOnline: boolean,
  token: string,
  connectionId: string,
  parentId?: string,
  searchTerm?: string,
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResponse<Resource>> => {
  if (!isOnline) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredResources: Resource[] = mockResources;
        if (searchTerm) {
          filteredResources = mockResources.filter((resource: Resource) =>
            resource.inode_path.path.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (parentId) {
          filteredResources = mockResources.filter((resource: Resource) => resource.parent_id === parentId);
        } else {
          // If no parentId and no searchTerm, show root level resources (those without a parent_id)
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
  }
  const url: URL = new URL(`${backendUrl}/connections/${connectionId}/resources/${searchTerm ? 'search' : 'children'}`);
  url.searchParams.append('limit', String(limit));
  if (parentId) url.searchParams.append('resource_id', parentId);
  if (searchTerm) url.searchParams.append('query', searchTerm);
  const response: Response = await customFetch(url.toString(),
    { headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) { throw new Error(`Failed to fetch resources`); }
  return response.json();
};

export const getCurrentOrganization = async (token: string): Promise<Organization> => {
  const response: Response = await customFetch(`${backendUrl}/organizations/me/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) { throw new Error('Failed to fetch organization'); }
  return response.json();
};

export const listKnowledgeBases = async (isOnline: boolean, token: string): Promise<KnowledgeBase[]> => {
  if (!isOnline) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockKnowledgeBases), 500);
    });
  }
  const response: Response = await customFetch(`${backendUrl}/knowledge_bases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) { throw new Error('Failed to list knowledge bases'); }
  return response.json();
};

export const createKnowledgeBase = async (token: string, connection_id: string, connection_source_ids: string[]): Promise<KnowledgeBase> => {
  const response: Response = await customFetch(`${backendUrl}/knowledge_bases`, {
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

export const syncKnowledgeBase = async (isOnline: boolean, token: string, kbId: string, orgId: string): Promise<void> => {
  if (!isOnline) {
    console.log('Syncing knowledge base (offline):', kbId);
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 2000);
    });
  }
  const response: Response = await customFetch(`${backendUrl}/knowledge_bases/sync/trigger/${kbId}/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 200) { // Sync endpoint returns 200 on success
    throw new Error('Failed to trigger knowledge base sync');
  }
};

export const listKnowledgeBaseResources = async (isOnline: boolean, token: string, kbId: string): Promise<PaginatedResponse<Resource>> => {
  if (!isOnline) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: getKbResourcesFromLocalStorage(),
          next_cursor: null,
          current_cursor: null,
        });
      }, 500);
    });
  }

  const response: Response = await customFetch(`${backendUrl}/knowledge_bases/${kbId}/resources/children`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) { throw new Error('Failed to fetch knowledge base resources'); }
  return response.json();
};

export const addKnowledgeBaseResource = async (isOnline: boolean, token: string, kbId: string, resource: Resource): Promise<void> => {
  if (!isOnline) {
    setTimeout(() => addKbResourceToLocalStorage(resource), 2000);
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  }
  const response: Response = await customFetch(`${backendUrl}/knowledge_bases/${kbId}/resources`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resource_id: resource.resource_id })
    });
  if (response.status !== 201) { // POST returns 201 on success
    throw new Error('Failed to add resource to knowledge base');
  }
};

export const deleteKnowledgeBaseResource = async (isOnline: boolean, token: string, kbId: string, resourceId: string): Promise<void> => {
  console.log('deinexing resource:', resourceId, isOnline);
  if (!isOnline) {
    setTimeout(() => removeKbResourceFromLocalStorage(resourceId), 2000);
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  }
  const url: URL = new URL(`${backendUrl}/knowledge_bases/${kbId}/resources`);
  url.searchParams.append('resource_id', resourceId);
  const response: Response = await customFetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status !== 204) { // Delete returns 204 on success
    throw new Error('Failed to delete resource from knowledge base');
  }
};