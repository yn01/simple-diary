export interface Entry {
  id: number;
  date: string; // YYYY-MM-DD
  content: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface CreateEntryRequest {
  date: string;
  content: string;
}

export interface UpdateEntryRequest {
  date: string;
  content: string;
}
