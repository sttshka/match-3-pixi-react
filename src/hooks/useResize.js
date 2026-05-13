import { useEffect, useState } from 'react';
// Слушаем resize окна и возвращаем актуальные размеры viewport.
// Используется, чтобы пересчитать размер Pixi-канваса и масштаб доски.
export function useResize() {
    const [size, setSize] = useState(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
    }));
    useEffect(() => {
        const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, []);
    return size;
}
