import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createClub,
  getClub,
  listClubs,
  type ClubSort,
  type NewClub,
} from '@/api/clubs';
import { queryKeys } from '@/api/query-keys';

export function useClubs(sort: ClubSort = 'name') {
  return useQuery({
    queryKey: queryKeys.clubs.list(sort),
    queryFn: () => listClubs(sort),
    placeholderData: keepPreviousData,
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: queryKeys.clubs.detail(id),
    queryFn: () => getClub(id),
  });
}

// O clube novo aparece na lista, na barra lateral e nos filtros sem recarregar a página.
export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (club: NewClub) => createClub(club),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all }),
  });
}
