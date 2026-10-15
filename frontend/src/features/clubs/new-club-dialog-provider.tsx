import { useMemo, useState, type ReactNode } from 'react';
import { NewClubDialog } from './new-club-dialog';
import { NewClubDialogContext } from './new-club-dialog-context';

export function NewClubDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openNewClub: () => setOpen(true) }), []);

  return (
    <NewClubDialogContext.Provider value={value}>
      {children}
      <NewClubDialog open={open} onOpenChange={setOpen} />
    </NewClubDialogContext.Provider>
  );
}
