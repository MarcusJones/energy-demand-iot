export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SortParams {
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface ListParams extends Partial<SortParams> {
  page?: number;
  pageSize?: number;
}
