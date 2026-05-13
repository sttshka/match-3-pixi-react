import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  IconBigExplosion,
  IconBombBooster,
  IconColorBooster,
  IconColorClear,
  IconExplode3x3,
  IconLineBooster,
  IconLineClear,
  IconPlaneSquare,
  IconTwoSpecialCombo,
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
        {open ? 'Закрыть' : 'Бонусы'}
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
            Бонусы на поле
          </h3>
          <p className="booster-hint-lead">
            Собери фигуру — появится бонус. Потом поменяй его местами с соседней клеткой, чтобы
            включить.
          </p>

          <p className="booster-hint-sub">Как получить</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineBooster />
              </span>
              <p>
                Четыре в ряд или в столбик — стрела: горизонтальный матч даёт бонус, который чистит
                <strong> столбец</strong>; вертикальный — <strong>строку</strong> (как в Homescapes).
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorBooster />
              </span>
              <p>Пять в ряд — радужный шар.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconBombBooster />
              </span>
              <p>Линии крест-накрест, L/T или связный кластер из пяти не в одну линию — бомба.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>Квадрат два на два одного цвета — самолётик.</p>
            </div>
          </div>

          <p className="booster-hint-sub">Поменяй с соседом</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineClear />
              </span>
              <p>
                Стрела: чистится целая строка или целый столбец по <strong>виду</strong> бонуса
                (полоска на тайле горизонтальная или вертикальная), направление свопа не важно.
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorClear />
              </span>
              <p>Радужный и обычный тайл — пропадут все того же цвета, что и обычный.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconExplode3x3 />
              </span>
              <p>Бомба — квадрат три на три вокруг неё.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>Самолётик — соседи по кресту и ещё один удар по выбранной клетке.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorBooster />
              </span>
              <p>Два радужных рядом — очищают всё поле.</p>
            </div>
          </div>

          <p className="booster-hint-sub">Два бонуса рядом</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconTwoSpecialCombo />
              </span>
              <p>Поменяй два бонуса местами, если они соседи — их силы складываются.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconBigExplosion />
              </span>
              <p>Две бомбы — очень большой взрыв.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>Два самолётика — три удара по разным клеткам.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
