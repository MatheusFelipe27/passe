import { createContext, useContext } from 'react';

interface NewMatchDialogContextValue {
  openNewMatch: () => void;
}

export const NewMatchDialogContext =
  createContext<NewMatchDialogContextValue | null>(null);

// A mesma janela de nova partida abre pela tela de Partidas, pelo estado vazio e pela Classificação.
export function useNewMatchDialog(): NewMatchDialogContextValue {
  const context = useContext(NewMatchDialogContext);
  if (!context) {
    throw new Error('useNewMatchDialog precisa do NewMatchDialogProvider.');
  }
  return context;
}
