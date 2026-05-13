import { useEffect } from 'react';
import { useTick } from '@pixi/react';

// Реэкспорт удобного hook'а с правильной типизацией.
// useTick из @pixijs/react v8 принимает callback({ deltaTime, deltaMS, ... }).
export function useGameTick(cb: (info: { deltaTime: number; deltaMS: number }) => void): void {
  useTick((ticker) => {
    cb({ deltaTime: ticker.deltaTime, deltaMS: ticker.deltaMS });
  });
}

// Тривиальный hook для подписки на window-события — упрощает чтение кода.
export function useWindowEvent<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  deps: ReadonlyArray<unknown> = [],
): void {
  useEffect(() => {
    window.addEventListener(event, handler as EventListener);
    return () => window.removeEventListener(event, handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
