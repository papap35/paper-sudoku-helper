"""紙本數獨輔助邏輯：候選數字計算、錯誤檢查、技巧提示與進度評估。

提示設計原則：只指出「哪個區域/格子可以用什麼技巧」，不直接告知答案數字，
讓玩家自己動腦完成最後一步。
"""

ALL_DIGITS = set(range(1, 10))


def is_valid_grid(grid) -> bool:
    if not isinstance(grid, list) or len(grid) != 9:
        return False
    for row in grid:
        if not isinstance(row, list) or len(row) != 9:
            return False
        for v in row:
            if not isinstance(v, int) or not (0 <= v <= 9):
                return False
    return True


def _box_cells(r: int, c: int):
    br, bc = (r // 3) * 3, (c // 3) * 3
    return [(i, j) for i in range(br, br + 3) for j in range(bc, bc + 3)]


def get_candidates(grid):
    """回傳每格的候選數字集合（已填的格子為空集合）。"""
    candidates = [[set() for _ in range(9)] for _ in range(9)]
    for r in range(9):
        for c in range(9):
            if grid[r][c] != 0:
                continue
            used = set(grid[r])
            used |= {grid[i][c] for i in range(9)}
            used |= {grid[i][j] for i, j in _box_cells(r, c)}
            candidates[r][c] = ALL_DIGITS - used
    return candidates


def find_conflicts(grid):
    """回傳違反數獨規則（同列/欄/區塊重複）的格子座標清單。"""
    conflicts = set()

    def check_group(cells):
        seen = {}
        for r, c in cells:
            v = grid[r][c]
            if v == 0:
                continue
            if v in seen:
                conflicts.add((r, c))
                conflicts.add(seen[v])
            else:
                seen[v] = (r, c)

    for r in range(9):
        check_group([(r, c) for c in range(9)])
    for c in range(9):
        check_group([(r, c) for r in range(9)])
    for br in range(3):
        for bc in range(3):
            check_group([(br * 3 + i, bc * 3 + j) for i in range(3) for j in range(3)])

    return sorted(conflicts)


def _naked_single_hint(grid, candidates):
    for r in range(9):
        for c in range(9):
            if grid[r][c] == 0 and len(candidates[r][c]) == 1:
                return {
                    'technique': 'naked_single',
                    'technique_name': '唯一候選數 (Naked Single)',
                    'message': f'看看第 {r + 1} 列、第 {c + 1} 欄這一格——把其他規則排除後，它只剩下一個可能的數字了。',
                    'cells': [[r, c]],
                    'difficulty': '簡單',
                }
    return None


def _hidden_single_hint(grid, candidates):
    groups = []
    for r in range(9):
        groups.append((f'第 {r + 1} 列', [(r, c) for c in range(9)]))
    for c in range(9):
        groups.append((f'第 {c + 1} 欄', [(r, c) for r in range(9)]))
    for br in range(3):
        for bc in range(3):
            cells = [(br * 3 + i, bc * 3 + j) for i in range(3) for j in range(3)]
            groups.append((f'第 {br + 1}-{bc + 1} 宮 (左上數第 {br + 1} 排、第 {bc + 1} 列的 3x3 區塊)', cells))

    for label, cells in groups:
        empty_cells = [(r, c) for r, c in cells if grid[r][c] == 0]
        for digit in range(1, 10):
            if digit in {grid[r][c] for r, c in cells}:
                continue
            holders = [(r, c) for r, c in empty_cells if digit in candidates[r][c]]
            if len(holders) == 1:
                return {
                    'technique': 'hidden_single',
                    'technique_name': '隱性唯一數 (Hidden Single)',
                    'message': f'{label}裡，有一個數字其實只能填在其中一格——比較一下每格的候選數字找出它吧。',
                    'cells': [[holders[0][0], holders[0][1]]],
                    'region': label,
                    'difficulty': '中等',
                }
    return None


def _pointing_pair_hint(grid, candidates):
    for br in range(3):
        for bc in range(3):
            box_cells = [(br * 3 + i, bc * 3 + j) for i in range(3) for j in range(3)]
            box_label = f'第 {br + 1}-{bc + 1} 宮 (左上數第 {br + 1} 排、第 {bc + 1} 列的 3x3 區塊)'
            for digit in range(1, 10):
                if digit in {grid[r][c] for r, c in box_cells}:
                    continue
                holders = [(r, c) for r, c in box_cells
                           if grid[r][c] == 0 and digit in candidates[r][c]]
                if len(holders) < 2:
                    continue
                rows = {r for r, _ in holders}
                cols = {c for _, c in holders}
                if len(rows) == 1:
                    r = next(iter(rows))
                    others = [(r, c) for c in range(9)
                              if (r, c) not in box_cells and grid[r][c] == 0 and digit in candidates[r][c]]
                    if others:
                        return {
                            'technique': 'pointing_pair',
                            'technique_name': '區塊定位 (Pointing Pair)',
                            'message': f'{box_label}內，有個數字的候選位置全部集中在第 {r + 1} 列——這代表同一列其他區塊的這個位置可以排除這個數字。',
                            'cells': [[hr, hc] for hr, hc in holders],
                            'region': box_label,
                            'difficulty': '困難',
                        }
                elif len(cols) == 1:
                    c = next(iter(cols))
                    others = [(r, c) for r in range(9)
                              if (r, c) not in box_cells and grid[r][c] == 0 and digit in candidates[r][c]]
                    if others:
                        return {
                            'technique': 'pointing_pair',
                            'technique_name': '區塊定位 (Pointing Pair)',
                            'message': f'{box_label}內，有個數字的候選位置全部集中在第 {c + 1} 欄——這代表同一欄其他區塊的這個位置可以排除這個數字。',
                            'cells': [[hr, hc] for hr, hc in holders],
                            'region': box_label,
                            'difficulty': '困難',
                        }
    return None


def find_hint(grid, candidates=None):
    """依「簡單→困難」順序尋找下一步可用的技巧提示。"""
    if candidates is None:
        candidates = get_candidates(grid)

    return (
        _naked_single_hint(grid, candidates)
        or _hidden_single_hint(grid, candidates)
        or _pointing_pair_hint(grid, candidates)
    )


def analyze(grid):
    candidates = get_candidates(grid)
    conflicts = find_conflicts(grid)
    filled = sum(1 for row in grid for v in row if v != 0)

    hint = None
    if not conflicts and filled < 81:
        hint = find_hint(grid, candidates)

    if conflicts:
        difficulty = '盤面有衝突，請先修正標記的格子'
    elif filled == 81:
        difficulty = '已完成！'
    elif hint:
        difficulty = hint['difficulty']
    else:
        difficulty = '需要更進階的技巧（本工具尚未涵蓋）'

    return {
        'candidates': {
            f'{r},{c}': sorted(candidates[r][c])
            for r in range(9) for c in range(9) if candidates[r][c]
        },
        'conflicts': [[r, c] for r, c in conflicts],
        'hint': hint,
        'progress': {
            'filled': filled,
            'total': 81,
            'percent': round(filled / 81 * 100, 1),
            'difficulty': difficulty,
        },
    }
