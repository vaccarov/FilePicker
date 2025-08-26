
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
  inode_type: "directory" | "file";
  mime_type?: string;
  parent_id?: string; // Added parent_id
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  current_cursor: string | null;
}

export interface Organization {
  org_id: string;
}

export interface KnowledgeBase {
  knowledge_base_id: string;
}
