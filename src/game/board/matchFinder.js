// Поиск совпадений: горизонтальные и вертикальные линии длиной ≥ 3,
// а также объединение пересечений в "крест".
export function findMatches(board) {
    const groups = [];
    // Горизонтальные линии.
    for (let r = 0; r < board.rows; r++) {
        let runStart = 0;
        for (let c = 1; c <= board.cols; c++) {
            const cur = c < board.cols ? board.get(c, r) : null;
            const prev = board.get(c - 1, r);
            const same = cur && prev && cur.type === prev.type;
            if (!same) {
                const runLen = c - runStart;
                if (runLen >= 3 && prev) {
                    const tiles = [];
                    for (let i = runStart; i < c; i++)
                        tiles.push({ col: i, row: r });
                    groups.push({ tiles, length: runLen, kind: 'row' });
                }
                runStart = c;
            }
        }
    }
    // Вертикальные линии.
    for (let c = 0; c < board.cols; c++) {
        let runStart = 0;
        for (let r = 1; r <= board.rows; r++) {
            const cur = r < board.rows ? board.get(c, r) : null;
            const prev = board.get(c, r - 1);
            const same = cur && prev && cur.type === prev.type;
            if (!same) {
                const runLen = r - runStart;
                if (runLen >= 3 && prev) {
                    const tiles = [];
                    for (let i = runStart; i < r; i++)
                        tiles.push({ col: c, row: i });
                    groups.push({ tiles, length: runLen, kind: 'col' });
                }
                runStart = r;
            }
        }
    }
    return mergeCrosses(groups);
}
// Объединяет пересекающиеся row+col группы в один "cross" — это нужно
// для корректного подсчёта очков (без двойного начисления за пересечения).
function mergeCrosses(groups) {
    if (groups.length < 2)
        return groups;
    const used = new Set();
    const merged = [];
    for (let i = 0; i < groups.length; i++) {
        if (used.has(i))
            continue;
        let acc = groups[i];
        for (let j = i + 1; j < groups.length; j++) {
            if (used.has(j))
                continue;
            if (acc.kind === groups[j].kind)
                continue;
            if (hasIntersection(acc.tiles, groups[j].tiles)) {
                const tiles = uniqPositions([...acc.tiles, ...groups[j].tiles]);
                acc = { tiles, length: tiles.length, kind: 'cross' };
                used.add(j);
            }
        }
        used.add(i);
        merged.push(acc);
    }
    return merged;
}
function hasIntersection(a, b) {
    for (const p of a) {
        for (const q of b) {
            if (p.col === q.col && p.row === q.row)
                return true;
        }
    }
    return false;
}
function uniqPositions(arr) {
    const seen = new Set();
    const out = [];
    for (const p of arr) {
        const k = `${p.col}:${p.row}`;
        if (!seen.has(k)) {
            seen.add(k);
            out.push(p);
        }
    }
    return out;
}
