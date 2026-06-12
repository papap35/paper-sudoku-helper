(function () {
  const board = document.getElementById('board');
  const imageInput = document.getElementById('image-input');
  const scanBtn = document.getElementById('scan-btn');
  const preview = document.getElementById('preview');
  const analyzeBtn = document.getElementById('analyze-btn');
  const hintBtn = document.getElementById('hint-btn');
  const clearBtn = document.getElementById('clear-btn');
  const showCandidates = document.getElementById('show-candidates');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const hintText = document.getElementById('hint-text');
  const message = document.getElementById('message');

  const cells = [];
  let lastAnalysis = null;

  function buildBoard() {
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (c % 3 === 2 && c !== 8) cell.classList.add('border-right-3');
        if (r % 3 === 2 && r !== 8) cell.classList.add('border-bottom-3');

        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.className = 'cell-input';
        input.dataset.r = r;
        input.dataset.c = c;
        input.addEventListener('input', onCellInput);
        input.addEventListener('keydown', onCellKeydown);

        const candidates = document.createElement('div');
        candidates.className = 'candidates';
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement('span');
          span.dataset.n = String(n);
          span.textContent = String(n);
          candidates.appendChild(span);
        }

        cell.appendChild(input);
        cell.appendChild(candidates);
        board.appendChild(cell);
        row.push({ cell, input });
      }
      cells.push(row);
    }
  }

  function onCellInput(e) {
    const input = e.target;
    let v = input.value.replace(/[^1-9]/g, '');
    input.value = v;
    input.closest('.cell').classList.toggle('has-value', v !== '');
    clearAnalysisHighlights();
  }

  function onCellKeydown(e) {
    const r = parseInt(e.target.dataset.r, 10);
    const c = parseInt(e.target.dataset.c, 10);
    let target = null;
    if (e.key === 'ArrowRight') target = cells[r][Math.min(c + 1, 8)];
    else if (e.key === 'ArrowLeft') target = cells[r][Math.max(c - 1, 0)];
    else if (e.key === 'ArrowDown') target = cells[Math.min(r + 1, 8)][c];
    else if (e.key === 'ArrowUp') target = cells[Math.max(r - 1, 0)][c];
    if (target) {
      e.preventDefault();
      target.input.focus();
    }
  }

  function collectGrid() {
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const v = cells[r][c].input.value.trim();
        row.push(v ? parseInt(v, 10) : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  function setGrid(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = grid[r][c] || 0;
        const { cell, input } = cells[r][c];
        input.value = v ? String(v) : '';
        cell.classList.toggle('has-value', v !== 0);
      }
    }
    clearAnalysisHighlights();
  }

  function clearAnalysisHighlights() {
    lastAnalysis = null;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const { cell, input } = cells[r][c];
        cell.classList.remove('conflict', 'hint');
        cell.querySelectorAll('.candidates span').forEach((span) => span.classList.remove('active'));
      }
    }
    progressText.textContent = '';
    progressFill.style.width = '0%';
    hintText.textContent = '';
    message.textContent = '';
  }

  function setMessage(text, isError) {
    message.textContent = text || '';
    message.style.color = isError ? '#c0392b' : '#3a8a3a';
  }

  function renderCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const list = (lastAnalysis && lastAnalysis.candidates[`${r},${c}`]) || [];
        cells[r][c].cell.querySelectorAll('.candidates span').forEach((span) => {
          const n = parseInt(span.dataset.n, 10);
          span.classList.toggle('active', list.includes(n));
        });
      }
    }
  }

  function applyAnalysis(data) {
    lastAnalysis = data;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cells[r][c].cell.classList.remove('conflict', 'hint');
      }
    }

    (data.conflicts || []).forEach(([r, c]) => {
      cells[r][c].cell.classList.add('conflict');
    });

    renderCandidates();

    const { filled, total, percent, difficulty } = data.progress;
    progressText.textContent = `已填入 ${filled} / ${total} 格 (${percent}%)　目前難度：${difficulty}`;
    progressFill.style.width = `${percent}%`;

    if (data.conflicts && data.conflicts.length > 0) {
      hintText.textContent = '⚠️ 標記為紅色的格子互相衝突，請先修正。';
    } else if (data.hint) {
      hintText.textContent = `💡 ${data.hint.technique_name}：${data.hint.message}`;
    } else if (filled === total) {
      hintText.textContent = '🎉 恭喜完成！';
    } else {
      hintText.textContent = '目前盤面看起來沒有衝突，但找不到更簡單的提示了，可能需要更進階的技巧。';
    }
  }

  function showHint() {
    if (!lastAnalysis) {
      setMessage('請先按「分析盤面」', true);
      return;
    }
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cells[r][c].cell.classList.remove('hint');
      }
    }
    const hint = lastAnalysis.hint;
    if (!hint) {
      setMessage('目前沒有可提供的提示。', false);
      return;
    }
    (hint.cells || []).forEach(([r, c]) => {
      cells[r][c].cell.classList.add('hint');
    });
    hintText.textContent = `💡 ${hint.technique_name}：${hint.message}`;
    setMessage('');
  }

  async function analyze() {
    setMessage('');
    const grid = collectGrid();
    try {
      const res = await fetch('/sudoku/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || '分析失敗', true);
        return;
      }
      applyAnalysis(data);
    } catch (err) {
      setMessage('連線失敗，請稍後再試。', true);
    }
  }

  async function scanImage() {
    const file = imageInput.files[0];
    if (!file) return;

    scanBtn.disabled = true;
    scanBtn.textContent = '辨識中...';
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/sudoku/scan', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || '辨識失敗', true);
        return;
      }
      setGrid(data.grid);
      setMessage('辨識完成，請確認盤面是否正確（可手動修正），再按「分析盤面」。', false);
    } catch (err) {
      setMessage('連線失敗，請稍後再試。', true);
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = '辨識盤面';
    }
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) {
      preview.hidden = true;
      scanBtn.disabled = true;
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    scanBtn.disabled = false;
  });

  scanBtn.addEventListener('click', scanImage);
  analyzeBtn.addEventListener('click', analyze);
  hintBtn.addEventListener('click', showHint);
  clearBtn.addEventListener('click', () => setGrid(Array.from({ length: 9 }, () => Array(9).fill(0))));
  showCandidates.addEventListener('change', () => {
    board.classList.toggle('show-candidates', showCandidates.checked);
  });

  buildBoard();
})();
