import { useParams } from 'react-router';
import { useMatch } from '@/hooks/use-league';

// Último item da trilha na página da partida: o placar, lido da mesma consulta da página.
export function MatchCrumb() {
  const { id = '' } = useParams();
  const match = useMatch(id);
  if (!match.data) {
    return <>Partida</>;
  }
  const { home, away } = match.data;
  return (
    <>
      {home.club_name} {home.goals} × {away.goals} {away.club_name}
    </>
  );
}
