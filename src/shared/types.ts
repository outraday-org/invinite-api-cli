export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface PaginatedResponse {
  next_url?: string;
}

export interface CommandOptions {
  json?: boolean;
  all?: boolean;
}
