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
            Собери фигуру — появится бонус. <strong>Перетащи</strong> фишку на соседнюю клетку, чтобы
            поменять местами (в том числе два бонуса для комбо). Ракету, бомбу и самолётик можно
            также включить <strong>коротким тапом</strong> без движения. Радужный шар — только своп
            с соседней фишкой нужного цвета.
          </p>

          <p className="booster-hint-sub">Как получить</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineBooster />
              </span>
              <p>
                Четыре в ряд или в столбик — <strong>ракета</strong>: горизонтальный матч даёт бонус,
                который чистит <strong>столбец</strong>; вертикальный — <strong>строку</strong>.
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorBooster />
              </span>
              <p>Пять в ряд или в столбик — радужный шар.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconBombBooster />
              </span>
              <p>Пять или шесть фишек в форме Г, Т или плюса (пересечение линий) — бомба.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>Квадрат два на два одного цвета — самолётик.</p>
            </div>
          </div>

          <p className="booster-hint-sub">Короткий тап или свайп на соседа</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconLineClear />
              </span>
              <p>
                <strong>Ракета</strong> — короткий тап или свайп на соседа: чистится целая строка
                или целый столбец по виду бонуса (полоска на тайле).
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorClear />
              </span>
              <p>
                <strong>Радужный</strong> — свайп на соседнюю обычную фишку: пропадут все того же
                цвета.
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconExplode3x3 />
              </span>
              <p>
                <strong>Бомба</strong> — короткий тап или свайп на соседа: квадрат три на три
                вокруг неё.
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>
                <strong>Самолётик</strong> — короткий тап или свайп на соседа: крест вокруг себя и
                удар по цели (в приоритете цели уровня и препятствия), плюс крест вокруг цели.
              </p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconColorBooster />
              </span>
              <p>
                Два радужных рядом — очищают всё поле; у клеток с препятствием снимается один слой.
              </p>
            </div>
          </div>

          <p className="booster-hint-sub">Два бонуса рядом</p>
          <div className="booster-hint-rows">
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconTwoSpecialCombo />
              </span>
              <p>Перетащи один бонус на соседний, если оба — бонусы: их силы складываются.</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconBigExplosion />
              </span>
              <p>Две бомбы — вдвое больший радиус взрыва (5×5 вокруг центра пары).</p>
            </div>
            <div className="booster-hint-row">
              <span className="booster-hint-icon" aria-hidden>
                <IconPlaneSquare />
              </span>
              <p>
                Два самолётика — один полный взлёт, затем три волны из центра между бустерами.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
