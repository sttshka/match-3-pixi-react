import { useEffect } from 'react';
import { useTick } from '@pixi/react';
// Реэкспорт удобного hook'а с правильной типизацией.
// useTick из @pixijs/react v8 принимает callback({ deltaTime, deltaMS, ... }).
export function useGameTick(cb) {
    useTick((ticker) => {
        cb({ deltaTime: ticker.deltaTime, deltaMS: ticker.deltaMS });
    });
}
// Тривиальный hook для подписки на window-события — упрощает чтение кода.
export function useWindowEvent(event, handler, deps = []) {
    useEffect(() => {
        window.addEventListener(event, handler);
        return () => window.removeEventListener(event, handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
