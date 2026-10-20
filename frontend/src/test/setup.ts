import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// O jsdom não implementa estas APIs, que os menus do Radix usam.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// As buscas que esperam a tela (findBy) têm 1 s por padrão; com a bateria inteira em paralelo,
// numa máquina mais lenta, isso não basta.
configure({ asyncUtilTimeout: 15_000 });

afterEach(() => {
  cleanup();
});
