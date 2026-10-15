import { Trash2 } from 'lucide-react';
import type { Player } from '@/api/players';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { useDeletePlayer } from '@/hooks/use-players';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { notifyError, notifySuccess } from '@/lib/notify';
import { PlayerSummary } from './player-summary';

interface DeletePlayerDialogProps {
  player: Player | undefined;
  onClose: () => void;
}

// Exclusão lógica (RN09): só para jogador livre, com confirmação.
export function DeletePlayerDialog({
  player,
  onClose,
}: DeletePlayerDialogProps) {
  const deletePlayer = useDeletePlayer();
  const submitOnce = useSubmitOnce();

  if (!player) {
    return null;
  }

  function confirm(target: Player) {
    void submitOnce(async () => {
      try {
        await deletePlayer.mutateAsync(target.id);
        notifySuccess(
          'Jogador excluído',
          `${target.name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`,
        );
        onClose();
      } catch (error) {
        notifyError('Não foi possível excluir o jogador', error);
      }
    });
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir ${player.name}?`}
      description="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
      confirmLabel="Excluir jogador"
      confirmIcon={Trash2}
      destructive
      isPending={deletePlayer.isPending}
      onConfirm={() => confirm(player)}
      onOpenChange={(open) => !open && onClose()}
    >
      <PlayerSummary
        player={player}
        badge={<Badge variant="secondary">Livre</Badge>}
      />
    </ConfirmDialog>
  );
}
