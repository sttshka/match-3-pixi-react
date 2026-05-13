import { useEffect } from 'react';
import { useAppStore } from '@game/state/store';
import { assetManager } from '@assets/AssetManager';

// BootScene: инициализируем Pixi Assets, регистрируем бандлы и сообщаем прогресс
// через zustand. После загрузки переходим в меню.
export function BootScene(): null {
  const setLoaded = useAppStore((s) => s.setLoaded);
  const setLoadProgress = useAppStore((s) => s.setLoadProgress);
  const setScene = useAppStore((s) => s.setScene);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await assetManager.init();
        await assetManager.loadBundle('preload', (p) => {
          if (!cancelled) setLoadProgress(p);
        });
      } catch (err) {
        console.error('[Boot] asset load failed', err);
      }
      if (!cancelled) {
        setLoadProgress(1);
        setLoaded(true);
        setScene('menu');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setLoaded, setLoadProgress, setScene]);

  return null;
}
