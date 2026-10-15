import { Fragment, type ComponentType, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, PanelLeft, RefreshCw } from 'lucide-react';
import { Outlet, useMatches } from 'react-router';
import { Button } from '@/components/ui/button';
import { NewClubDialogProvider } from '@/features/clubs/new-club-dialog-provider';
import { useStoredFlag } from '@/hooks/use-stored-flag';
import { AppSidebar } from './app-sidebar';

// A trilha da rota: itens fixos e, nas páginas de um registro, o nome dele no fim.
export interface RouteHandle {
  breadcrumb: string[];
  current?: ComponentType;
}

const SIDEBAR_COLLAPSED_KEY = 'passe:sidebar-collapsed';

export function AppLayout() {
  const [collapsed, toggleSidebar] = useStoredFlag(SIDEBAR_COLLAPSED_KEY);

  return (
    <NewClubDialogProvider>
      <div className="flex h-svh bg-sidebar">
        <AppSidebar collapsed={collapsed} />
        <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] bg-background shadow-sm">
            <Topbar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-y-auto px-8 pt-7 pb-10">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </NewClubDialogProvider>
  );
}

function Topbar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const queryClient = useQueryClient();
  const handle = useMatches()
    .map((match) => match.handle as RouteHandle | undefined)
    .findLast(Boolean);
  const Current = handle?.current;
  const crumbs: ReactNode[] = [
    ...(handle?.breadcrumb ?? []),
    ...(Current ? [<Current key="current" />] : []),
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-expanded={!collapsed}
        onClick={onToggleSidebar}
      >
        <PanelLeft aria-hidden />
      </Button>
      <span aria-hidden className="h-4 w-px bg-border" />
      <nav aria-label="Trilha de navegação" className="flex-1 pl-1">
        <ol className="flex items-center gap-2 text-sm">
          {crumbs.map((item, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 text-muted-foreground"
                />
              )}
              <li
                aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                className={
                  index === crumbs.length - 1
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {item}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Atualizar dados"
        onClick={() => void queryClient.invalidateQueries()}
      >
        <RefreshCw aria-hidden />
      </Button>
    </header>
  );
}
