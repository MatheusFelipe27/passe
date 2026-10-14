import { useState } from 'react';

// Liga e desliga uma preferência guardada no navegador (como a barra lateral recolhida).
// Se o armazenamento estiver bloqueado, a preferência só vale até recarregar a página.
export function useStoredFlag(key: string): [boolean, () => void] {
  const [value, setValue] = useState(() => readFlag(key));

  function toggle() {
    const next = !value;
    setValue(next);
    writeFlag(key, next);
  }

  return [value, toggle];
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Armazenamento bloqueado: a escolha fica só na memória.
  }
}
