import {
  Ellipsis,
  Eye,
  HeartPulse,
  Pencil,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import type { Player } from '@/api/players';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type PlayerAction = 'details' | 'edit' | 'condition' | 'buy' | 'delete';

interface PlayerRowActionsProps {
  player: Player;
  onAction: (action: PlayerAction, player: Player) => void;
}

// Ações de cada linha: Comprar e Excluir só aparecem para jogador livre (RN09 e RN12).
export function PlayerRowActions({ player, onAction }: PlayerRowActionsProps) {
  const isFree = player.club_id === null;
  return (
    <div className="flex items-center justify-end gap-1">
      {isFree && (
        <Button
          variant="outline"
          size="sm"
          aria-label={`Comprar ${player.name}`}
          onClick={() => onAction('buy', player)}
        >
          <ShoppingCart aria-hidden />
          Comprar
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações de ${player.name}`}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{player.name}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onAction('details', player)}>
            <Eye aria-hidden />
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction('edit', player)}>
            <Pencil aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction('condition', player)}>
            <HeartPulse aria-hidden />
            Alterar condição
          </DropdownMenuItem>
          {isFree && (
            <DropdownMenuItem onSelect={() => onAction('buy', player)}>
              <ShoppingCart aria-hidden />
              Comprar
            </DropdownMenuItem>
          )}
          {isFree && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onAction('delete', player)}
                className="items-start"
              >
                <Trash2 aria-hidden className="mt-0.5" />
                <span className="flex flex-col">
                  Excluir
                  <span className="text-xs text-muted-foreground">
                    Disponível porque o jogador está livre.
                  </span>
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
