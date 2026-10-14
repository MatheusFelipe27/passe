export const API_PREFIX = 'api/v1';

export function resourceLocation(resource: string, id: number): string {
  return `/${API_PREFIX}/${resource}/${id}`;
}
