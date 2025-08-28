import { DIRECTORY, FILE, INDEXED, INDEXING, NOT_INDEXED, OP_DEINDEXING, OP_INDEXING, SORT_DIRECTION_ASC, SORT_DIRECTION_DESC, SORT_KEY_NAME, SORT_KEY_TYPE } from "@/lib/constants";

export type SortKey = typeof SORT_KEY_TYPE | typeof SORT_KEY_NAME;
export type SortDirection = typeof SORT_DIRECTION_ASC | typeof SORT_DIRECTION_DESC;
export type IndexStatus = typeof NOT_INDEXED | typeof INDEXED | typeof INDEXING;
export type InodeType = typeof DIRECTORY | typeof FILE;
export type PendingOperation = typeof OP_INDEXING | typeof OP_DEINDEXING;

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    phone: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: {
      provider: string;
      providers: string[];
    };
    user_metadata: Record<string, unknown>;
    identities: {
      identity_id: string;
      id: string;
      user_id: string;
      identity_data: {
        email: string;
        email_verified: boolean;
        phone_verified: boolean;
        sub: string;
      };
      provider: string;
      last_sign_in_at: string;
      created_at: string;
      updated_at: string;
    }[];
    created_at: string;
    updated_at: string;
  };
}

export interface Connection {
  connection_id: string;
  name: string;
  connection_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  resource_id: string;
  inode_path: {
    path: string;
  };
  inode_type: InodeType;
  mime_type?: string;
  parent_id?: string; // Added parent_id
  status?: IndexStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  current_cursor: string | null;
}

export interface Organization {
  org_id: string;
  created_at: string;
  org_name: string;
  org_plan: string;
  public_key: string;
  private_key: string;
  stripe_customer_id: string | null;
  client_reference_id: string | null;
  rate_limit: number;
  runs: number;
  runs_date: string;
  runs_day: string;
  runs_per_day: number;
  knowledge_base_max_files_to_sync: number;
  knowledge_base_max_urls_to_sync: number;
  storage_max_bytes_limit: number;
  seats_limit: number | null;
  daily_token_limit: number;
  daily_token_date: string;
  daily_token_usage: number;
  token_usage_last_sent: string | null;
  trial_ends: string | null;
}

export interface KnowledgeBase {
  knowledge_base_id: string;
  connection_id: string | null;
  created_at: string;
  updated_at: string;
  connection_source_ids: string[];
  website_sources: any[];
  connection_provider_type: string | null;
  is_empty: boolean;
  total_size: number;
  name: string;
  description: string;
  indexing_params: {
    ocr: boolean;
    unstructured: boolean;
    embedding_params: {
      api: string | null;
      base_url: string | null;
      embedding_model: string;
      provider: string | null;
      batch_size: number;
      track_usage: boolean;
      timeout: number;
    };
    chunker_params: {
      chunk_size: number;
      chunk_overlap: number;
      chunker_type: string;
    };
  };
  cron_job_id: string | null;
  org_id: string;
  org_level_role: string | null;
  user_metadata_schema: string | null;
  dataloader_metadata_schema: string | null;
}
