import { api } from "./api";

export const fetcher = <T>(url: string): Promise<T> =>
  api.get(url).then((response) => response.data.data as T);
