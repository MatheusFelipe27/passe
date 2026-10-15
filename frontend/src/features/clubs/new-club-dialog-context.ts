import { createContext, useContext } from 'react';

interface NewClubDialogContextValue {
  openNewClub: () => void;
}

export const NewClubDialogContext =
  createContext<NewClubDialogContextValue | null>(null);

// A mesma janela de criação abre pelo botão da lista, pelo estado vazio e pelo "+" da barra lateral.
export function useNewClubDialog(): NewClubDialogContextValue {
  const context = useContext(NewClubDialogContext);
  if (!context) {
    throw new Error('useNewClubDialog precisa do NewClubDialogProvider.');
  }
  return context;
}
