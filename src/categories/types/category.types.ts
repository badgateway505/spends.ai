export interface Group {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  archived?: boolean;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
}