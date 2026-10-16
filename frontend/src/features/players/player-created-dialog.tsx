import { Eye } from 'lucide-react';
import type { Player } from '@/api/players';
import { ResultDialog } from '@/components/result-dialog';
import { ResultList, ResultRow } from '@/components/result-list';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { POSITION_NAMES } from './player-labels';

interface PlayerCreatedDialogProps {
  player: Player | undefined;
  onClose: () => void;
  onShowDetails: (player: Player) => void;
}

// Resultado do cadastro, com os valores que a API calculou ao salvar.
export function PlayerCreatedDialog({
  player,
  onClose,
  onShowDetails,
}: PlayerCreatedDialogProps) {
  if (!player) {
    return null;
  }
  return (
    <ResultDialog
      open
      title="Jogador cadastrado"
      description={`${player.name} entrou livre e Apto. Valores em moedas, calculados pela API ao salvar.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={() => onShowDetails(player)}>
            <Eye aria-hidden />
            Ver detalhes
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </>
      }
    >
      <ResultList>
        <ResultRow
          label="Valor base"
          help="Calculado no cadastro; não muda depois"
          value={formatMoney(player.base_value)}
          highlight
        />
        <ResultRow
          label="Valor de mercado"
          help="Com condição, agilidade e idade"
          value={formatMoney(player.market_value)}
        />
        <ResultRow
          label="Overall"
          help={`Pelos pesos da posição ${POSITION_NAMES[player.position]}`}
          value={String(player.overall)}
        />
      </ResultList>
    </ResultDialog>
  );
}
