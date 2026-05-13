import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  IconBombBooster,
  IconColorBooster,
  IconColorClear,
  IconExplode3x3,
  IconLineBooster,
  IconLineClear,
  IconNoSwap,
} from './boosterHintIcons';

export function BoosterHintPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      close();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, close]);

  return (
    <div className={`booster-hint-wrap${open ? ' booster-hint-wrap--open' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="booster-hint-toggle"
        aria-expanded={open}
        aria-controls={open ? 'booster-hint-popover' : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Закрыть' : 'Супер-фишки'}
      </button>
      {open && (
        <div
          ref={panelRef}
          id="booster-hint-popover"
          className="booster-hint-popover"
          role="dialog"
          aria-labelledby={titleId}
        >
          <h3 id={titleId} className="booster-hint-title">
            Супер-фишки
          </h3>
          <p className="booster-hint-lead">
            Собери линию — получишь подарок. Потом подвинь его к соседу.
          </p>

          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineBooster />
              </span>
              <p>Четыре одинаковых в ряд или в столбик — появится полоска.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorBooster />
              </span>
              <p>Пять подряд — кружок с яркой обводкой.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconBombBooster />
              </span>
              <p>Крест из линий — круглая бомба.</p>
            </div>
          </div>

          <p className="booster-hint-sub">Свайпни к соседне клетке:</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineClear />
              </span>
              <p>Полоска — исчезнет целая строка или целый столбик.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorClear />
              </span>
              <p>Кружок с обводкой — пропадут все такого же цвета, как сосед.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconExplode3x3 />
              </span>
              <p>Бомба — «бум» на маленьком квадрате три на три.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconNoSwap />
              </span>
              <p>Два серых кружка друг к другу не подходят — ход не считается.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
