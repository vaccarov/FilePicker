import { Connection, KnowledgeBase, Resource } from '@/types';
import { DIRECTORY, FILE } from './constants';

export const mockConnections: Connection[] = [
  {
    name: "Google Drive",
    connection_id: "96891794-4313-42f1-9d98-237e526165b8",
    user_id: "d0ce1828-ef26-4cf6-8d05-84e0406cc27d",
    org_id: "0d582f36-52dd-403f-a38a-ccf4dfa06180",
    share_with_org: false,
    created_at: "2025-06-19T02:28:05.881189+00:00",
    updated_at: "2025-08-26T22:28:26.399868+00:00",
    connection_provider: "gdrive",
    connection_provider_data: {
      access_token: "ya29.A0AS3H6Nw2Z2Rd2MjST4F6voMyd--uHrtanb6EN_nX2SSgcpM2UpKHk6EY-PSqvH_XrW3W1h9JKcF7_Tki66wubinYtReXgAYeMPq06JG3WpD6Anx8QK_cm_31wu7AbMBCQKMeTL-ZZqbOKaqU8Eh5qMh85GojJIKxIYLHgewmJF9GCi5X-LXErwDldUfcfXtGzQlxAbgaCgYKASASARYSFQHGX2MiJwOd5q2zFls7hzORvJG26A0206",
      refresh_token: "1//05g05sPyu2Il_CgYIARAAGAUSNwF-L9IrFxc7mqTFA_eU1Qt7gXXQgbYZ1LP_Xev7ZoxcV0sxnvCm0aCkUVjk2Mmtw-zLjB-gKV4",
      scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/drive.file",
      token_type: "Bearer",
      can_be_knowledge_base: true
    },
    created_by: {
      avatar_url: null,
      full_name: null,
      has_completed_onboarding: true,
      last_signed_in: "2025-08-29 18:09:23.338452+00:00",
      updated_at: "None",
      id: "d0ce1828-ef26-4cf6-8d05-84e0406cc27d",
      email: "stackaitest@gmail.com"
    }
  }
];

export const mockResources: Resource[] = [
  // Root level resources
  {
    resource_id: 'mock-folder-1',
    inode_path: { path: 'My Documents' },
    inode_type: DIRECTORY,
  },
  {
    resource_id: 'mock-file-1',
    inode_path: { path: 'document.pdf' },
    inode_type: FILE,
    mime_type: 'application/pdf',
  },
  {
    resource_id: 'mock-folder-2',
    inode_path: { path: 'Images' },
    inode_type: DIRECTORY,
  },
  {
    resource_id: 'mock-file-2',
    inode_path: { path: 'image.jpg' },
    inode_type: FILE,
    mime_type: 'image/jpeg',
  },
  {
    resource_id: 'mock-file-3',
    inode_path: { path: 'spreadsheet.xlsx' },
    inode_type: FILE,
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  // Children of 'My Documents' (mock-folder-1)
  {
    resource_id: 'mock-subfolder-1',
    inode_path: { path: 'My Documents/Subfolder A' },
    inode_type: DIRECTORY,
    parent_id: 'mock-folder-1',
  },
  {
    resource_id: 'mock-file-a',
    inode_path: { path: 'My Documents/File A.txt' },
    inode_type: FILE,
    mime_type: 'text/plain',
    parent_id: 'mock-folder-1',
  },
  // Children of 'Images' (mock-folder-2)
  {
    resource_id: 'mock-image-a',
    inode_path: { path: 'Images/Vacation.jpg' },
    inode_type: FILE,
    mime_type: 'image/jpeg',
    parent_id: 'mock-folder-2',
  },
  {
    resource_id: 'mock-image-b',
    inode_path: { path: 'Images/Family.png' },
    inode_type: FILE,
    mime_type: 'image/png',
    parent_id: 'mock-folder-2',
  },
  // Children of 'Subfolder A' (mock-subfolder-1)
  {
    resource_id: 'mock-nested-file',
    inode_path: { path: 'My Documents/Subfolder A/Nested File.doc' },
    inode_type: FILE,
    mime_type: 'application/msword',
    parent_id: 'mock-subfolder-1',
  },
];

export const mockKnowledgeBases: KnowledgeBase[] = [
  {
    "knowledge_base_id": "9d376111-8357-4455-8119-78a3c3067110",
    "connection_id": null,
    "created_at": "2025-08-26T16:16:40.838658Z",
    "updated_at": "2025-08-26T16:16:40.838661Z",
    "connection_source_ids": [],
    "website_sources": [],
    "connection_provider_type": null,
    "is_empty": true,
    "total_size": 0,
    "name": "Victor BC",
    "description": "This is the description, edit it as you see fit.",
    "indexing_params": {
      "ocr": false,
      "unstructured": false,
      "embedding_params": {
        "api": null,
        "base_url": null,
        "embedding_model": "text-embedding-3-large",
        "provider": null,
        "batch_size": 300,
        "track_usage": true,
        "timeout": 5
      },
      "chunker_params": {
        "chunk_size": 2500,
        "chunk_overlap": 100,
        "chunker_type": "sentence"
      }
    },
    "cron_job_id": null,
    "org_id": "0d582f36-52dd-403f-a38a-ccf4dfa06180",
    "org_level_role": null,
    "user_metadata_schema": null,
    "dataloader_metadata_schema": null
  },
  {
    "knowledge_base_id": "28919395-e766-48f9-8282-e4c4f19391fc",
    "connection_id": null,
    "created_at": "2025-08-21T15:09:09.576565Z",
    "updated_at": "2025-08-21T15:09:09.576572Z",
    "connection_source_ids": [],
    "website_sources": [],
    "connection_provider_type": null,
    "is_empty": true,
    "total_size": 0,
    "name": "TestTest",
    "description": "This is the description, edit it as you see fit.",
    "indexing_params": {
      "ocr": false,
      "unstructured": false,
      "embedding_params": {
        "api": null,
        "base_url": null,
        "embedding_model": "text-embedding-3-large",
        "provider": null,
        "batch_size": 300,
        "track_usage": true,
        "timeout": 5
      },
      "chunker_params": {
        "chunk_size": 2500,
        "chunk_overlap": 100,
        "chunker_type": "sentence"
      }
    },
    "cron_job_id": null,
    "org_id": "0d582f36-52dd-403f-a38a-ccf4dfa06180",
    "org_level_role": null,
    "user_metadata_schema": null,
    "dataloader_metadata_schema": null
  },
  {
    "knowledge_base_id": "f9fa84c3-d454-4765-81f1-883f7834fa6d",
    "connection_id": null,
    "created_at": "2025-08-13T08:58:55.321623Z",
    "updated_at": "2025-08-13T08:58:55.321633Z",
    "connection_source_ids": [],
    "website_sources": [],
    "connection_provider_type": null,
    "is_empty": true,
    "total_size": 0,
    "name": "Documents for \"Agent Builder\"",
    "description": "Document knowledge base for \"Agent Builder\"",
    "indexing_params": {
      "ocr": false,
      "unstructured": false,
      "embedding_params": {
        "api": null,
        "base_url": null,
        "embedding_model": "text-embedding-3-large",
        "provider": null,
        "batch_size": 300,
        "track_usage": true,
        "timeout": 5
      },
      "chunker_params": {
        "chunk_size": 2500,
        "chunk_overlap": 100,
        "chunker_type": "sentence"
      }
    },
    "cron_job_id": null,
    "org_id": "0d582f36-52dd-403f-a38a-ccf4dfa06180",
    "org_level_role": null,
    "user_metadata_schema": null,
    "dataloader_metadata_schema": null
  }
]