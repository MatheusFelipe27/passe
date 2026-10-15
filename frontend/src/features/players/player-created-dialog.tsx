import { CircleCheck, Eye } from 'lucide-react';
import type { Player } from '@/api/players';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  return (
    <Dialog
      open={player !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        {player && (
          <>
            <DialogHeader>
              <span className="flex size-10 items-center justify-center rounded-full bg-success-soft">
                <CircleCheck aria-hidden className="size-5 text-success" />
              </span>
              <DialogTitle>Jogador cadastrado</DialogTitle>
              <DialogDescription>
                {player.name} entrou livre e Apto. Valores em moedas, calculados
                pela API ao salvar.
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y rounded-xl border">
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
            </dl>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => onShowDetails(player)}>
                <Eye aria-hidden />
                Ver detalhes
              </Button>
              <Button onClick={onClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  label,
  help,
  value,
  highlight = false,
}: {
  label: string;
  help: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${highlight ? 'bg-muted-subtle' : ''}`}
    >
      <dt className="flex flex-col">
        <span className={highlight ? 'font-medium' : 'text-muted-foreground'}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{help}</span>
      </dt>
      <dd
        className={`tabular-nums ${highlight ? 'text-lg font-semibold' : 'font-medium'}`}
      >
        {value}
      </dd>
    </div>
  );
}
