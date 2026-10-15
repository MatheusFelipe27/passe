import { useCallback, useRef } from 'react';

// Ignora um segundo envio enquanto o primeiro não termina: o clique duplo manda um só pedido.
// Desabilitar o botão não basta, porque dois cliques podem chegar antes de a tela se redesenhar.
export function useSubmitOnce() {
  const inFlight = useRef(false);

  return useCallback(async (submit: () => Promise<unknown>) => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      await submit();
    } finally {
      inFlight.current = false;
    }
  }, []);
}
