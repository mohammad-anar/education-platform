export type IPaginationOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export interface IQueryParams {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number | string;
  limit?: number | string;
  fields?: string;
  [key: string]: any;
}

export type IMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type IGenericResponse<T> = {
  meta: IMeta;
  data: T;
};