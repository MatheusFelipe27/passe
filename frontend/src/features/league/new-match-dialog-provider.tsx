import { useMemo, useState, type ReactNode } from 'react';
import { NewMatchDialog } from './new-match-dialog';
import { NewMatchDialogContext } from './new-match-dialog-context';

export function NewMatchDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openNewMatch: () => setOpen(true) }), []);

  return (
    <NewMatchDialogContext.Provider value={value}>
      {children}
      {open && <NewMatchDialog onClose={() => setOpen(false)} />}
    </NewMatchDialogContext.Provider>
  );
}
