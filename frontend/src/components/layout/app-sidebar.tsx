import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  ListOrdered,
  Shield,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { Link, useMatch } from 'react-router';
import { cn } from 'cn';
import { Logo } from '@/components/brand/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useClubs, useMatches } from '@/hooks/use-league';
import { usePlayers } from '@/hooks/use-players';
import { formatInteger, pluralize } from '@/lib/format';

const COUNT_ONLY = { limit: 1 };

interface AppSidebarProps {
  collapsed: boolean;
}

// Barra lateral do sistema de design: 256 px aberta e 48 px recolhida, só com ícones.
export function AppSidebar({ collapsed }: AppSidebarProps) {
  const players = usePlayers(COUNT_ONLY);
  const clubs = useClubs();
  const matches = useMatches();
  const playerCount = players.data?.meta.total_items;

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-64',
      )}
    >
      <Link
        to="/"
        aria-label="Passe, página inicial"
        className={collapsed ? 'px-2 py-3' : 'px-4 py-3'}
      >
        <Logo size={collapsed ? 'icon' : 'sm'} />
      </Link>
      <SidebarGroup label="Mercado" collapsed={collapsed}>
        <SidebarLink
          to="/jogadores"
          label="Jogadores"
          icon={Users}
          count={playerCount}
          collapsed={collapsed}
        />
        <SidebarLink
          to="/clubes"
          label="Clubes"
          icon={Shield}
          count={clubs.data?.length}
          collapsed={collapsed}
        />
      </SidebarGroup>
      <SidebarGroup label="Liga" collapsed={collapsed}>
        <SidebarLink
          to="/partidas"
          label="Partidas"
          icon={Swords}
          count={matches.data?.length}
          collapsed={collapsed}
        />
        <SidebarLink
          to="/classificacao"
          label="Classificação"
          icon={ListOrdered}
          collapsed={collapsed}
        />
      </SidebarGroup>
      {clubs.data && clubs.data.length > 0 && (
        <SidebarGroup label="Clubes" collapsed={collapsed}>
          {clubs.data.map((club) => (
            <SidebarLink
              key={club.id}
              to={`/clubes/${club.id}`}
              label={club.name}
              initial={club.acronym[0]}
              collapsed={collapsed}
            />
          ))}
        </SidebarGroup>
      )}
      <div className="flex-1" />
      {!collapsed && (
        <footer className="p-2">
          <div className="flex flex-col gap-2.5 rounded-xl border border-sidebar-border bg-background p-3 shadow-xs">
            <SummaryLine icon={Trophy} title="Liga Fictícia 2026">
              {describeLeague(clubs.data?.length, playerCount)}
            </SummaryLine>
            {matches.data && (
              <SummaryLine icon={Swords} title="Última partida">
                {matches.data.length > 0
                  ? `${matches.data[0].home.club_name} ${matches.data[0].home.goals} × ${matches.data[0].away.goals} ${matches.data[0].away.club_name}`
                  : 'Nenhuma partida ainda'}
              </SummaryLine>
            )}
            <div className="h-px bg-sidebar-border" />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock aria-hidden className="size-4" />
              Horário de Brasília (UTC−3)
            </span>
          </div>
        </footer>
      )}
    </aside>
  );
}

function SidebarGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label={label}
      className={cn('flex flex-col gap-0.5', collapsed ? 'px-1.5 py-2' : 'p-2')}
    >
      {!collapsed && (
        <span className="flex h-8 items-center px-2 text-xs text-muted-foreground">
          {label}
        </span>
      )}
      {children}
    </nav>
  );
}

interface SidebarLinkProps {
  to: string;
  label: string;
  collapsed: boolean;
  icon?: LucideIcon;
  initial?: string;
  count?: number;
}

function SidebarLink({
  to,
  label,
  collapsed,
  icon: Icon,
  initial,
  count,
}: SidebarLinkProps) {
  // As classes vão como texto: o Tooltip do Radix junta classes e não aceita a função do NavLink.
  const isActive = useMatch({ path: to, end: false }) !== null;
  const link = (
    <Link
      to={to}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-8 items-center gap-2 rounded-lg border text-sm',
        collapsed ? 'justify-center' : 'px-2',
        isActive
          ? 'border-sidebar-border bg-background font-medium shadow-xs'
          : 'border-transparent hover:bg-accent',
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden
          className={cn('size-4 shrink-0', isActive && 'text-primary')}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-sm text-[11px] font-medium',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {initial}
        </span>
      )}
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground">
              {formatInteger(count)}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (!collapsed) {
    return link;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SummaryLine({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  );
}

function describeLeague(
  clubCount: number | undefined,
  playerCount: number | undefined,
): string {
  const parts = [
    clubCount === undefined
      ? undefined
      : `${formatInteger(clubCount)} ${pluralize(clubCount, 'clube', 'clubes')}`,
    playerCount === undefined
      ? undefined
      : `${formatInteger(playerCount)} ${pluralize(playerCount, 'jogador', 'jogadores')}`,
  ];
  return parts.filter(Boolean).join(' · ') || '–';
}
