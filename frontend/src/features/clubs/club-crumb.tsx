import { useParams } from 'react-router';
import { useClub } from '@/hooks/use-clubs';

// Último item da trilha na página do clube: o nome, lido da mesma consulta da página.
export function ClubCrumb() {
  const { id = '' } = useParams();
  const club = useClub(id);
  return <>{club.data?.name ?? 'Clube'}</>;
}
