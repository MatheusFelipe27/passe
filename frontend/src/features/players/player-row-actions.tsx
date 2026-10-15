import { Ellipsis, Eye, HeartPulse, Pencil, Trash2 } from 'lucide-react';
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

export type PlayerAction = 'details' | 'edit' | 'condition' | 'delete';

interface PlayerRowActionsProps {
  player: Player;
  onAction: (action: PlayerAction, player: Player) => void;
}

// Menu "⋯" de cada linha. Excluir só aparece para jogador livre (RN09).
export function PlayerRowActions({ player, onAction }: PlayerRowActionsProps) {
  return (
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
        {player.club_id === null && (
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
  );
}
