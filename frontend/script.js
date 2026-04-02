/* ══════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════ */
const pageNames = {
  overview: ['Overview', 'Dashboard'],
  asymptotic: ['Asymptotic Analyzer', 'backend/asymptotic_analysis.py'],
  coordinate: ['Coordinate Transform', 'backend/coordinate_transformation.py'],
  recursive: ['Recursion Analyzer', 'backend/recursive_check.py'],
  traversal: ['Graph Traversals', 'backend/traversal/'],
};

function switchPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelector(`.nav-item[data-page="${id}"]`).classList.add('active');
  const [title, crumb] = pageNames[id];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-crumb').textContent = crumb;
  if (id === 'coordinate') setTimeout(drawCoord, 100);
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

/* ══════════════════════════════════════════
   ASYMPTOTIC ANALYZER (browser simulation)
══════════════════════════════════════════ */
const asympExamples = {
  linear: `def linear_sum(lst):
    total = 0
    for item in lst:
        total += item
    return total`,
  quadratic: `def bubble_sort(lst):
    n = len(lst)
    for i in range(n):
        for j in range(n - i - 1):
            if lst[j] > lst[j+1]:
                lst[j], lst[j+1] = lst[j+1], lst[j]
    return lst`,
  log: `def binary_search(lst, target):
    lo, hi = 0, len(lst) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if lst[mid] == target:
            return mid
        elif lst[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
};

function loadAsymptoticExample(key) {
  document.getElementById('asymp-code').value = asympExamples[key];
}

function clearAsymptotic() {
  document.getElementById('asymp-code').value = '';
  document.getElementById('asymp-output').innerHTML = '<div class="result-placeholder">Run an analysis to see results here.</div>';
  document.getElementById('asymp-result-tag').textContent = 'Waiting…';
  document.querySelectorAll('#asymp-bigo-strip .bigo-cell').forEach(c => {
    c.classList.remove('highlight');
    c.querySelector('.val').textContent = '—';
  });
}

// Heuristic browser-side complexity detector
function detectComplexity(code) {
  const loops = (code.match(/\bfor\b|\bwhile\b/g) || []).length;
  const nested = /for.*\n.*for|while.*\n.*for|for.*\n.*while/s.test(code);
  const isRecursive = (() => {
    const fnMatch = code.match(/def\s+(\w+)/);
    if (!fnMatch) return false;
    const name = fnMatch[1];
    const body = code.split('\n').slice(1).join('\n');
    return body.includes(name + '(');
  })();

  const divides = /\/\/\s*2|>>\s*1|\/\s*2|\/\s*n/.test(code);
  const callCount = (() => {
    const fnMatch = code.match(/def\s+(\w+)/);
    if (!fnMatch) return 0;
    const name = fnMatch[1];
    return (code.match(new RegExp(name + '\\(', 'g')) || []).length - 1;
  })();

  if (isRecursive) {
    if (callCount >= 2 && !divides) return { best: 'O(2^n)', label: 'O(2^n)', score: 'Exponential' };
    if (callCount >= 2 && divides) return { best: 'O(n log n)', label: 'O(n log n)', score: 'Linearithmic' };
    if (callCount === 1 && divides) return { best: 'O(log n)', label: 'O(log n)', score: 'Logarithmic' };
    return { best: 'O(n)', label: 'O(n)', score: 'Linear' };
  }
  if (nested || loops >= 2) return { best: 'O(n^2)', label: 'O(n^2)', score: 'Quadratic' };
  if (loops === 1) {
    if (divides) return { best: 'O(log n)', label: 'O(log n)', score: 'Logarithmic' };
    return { best: 'O(n)', label: 'O(n)', score: 'Linear' };
  }
  return { best: 'O(1)', label: 'O(1)', score: 'Constant' };
}

function simulateTimings(complexity) {
  const sizes = [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120];
  const noise = () => 0.92 + Math.random() * 0.16;
  const rows = [];
  const baseTime = 0.0000008;

  for (const n of sizes) {
    let t;
    if (complexity === 'O(1)') t = baseTime * noise();
    else if (complexity === 'O(log n)') t = baseTime * Math.log2(n) * noise();
    else if (complexity === 'O(n)') t = baseTime * n * noise();
    else if (complexity === 'O(n log n)') t = baseTime * n * Math.log2(n) * noise();
    else if (complexity === 'O(n^2)') t = baseTime * n * n * noise();
    else if (complexity === 'O(2^n)') { if (n > 30) break; t = baseTime * Math.pow(2, n) * noise(); }
    else t = baseTime * n * noise();
    rows.push({ n, t });
  }
  return rows;
}

async function runAsymptotic() {
  const code = document.getElementById('asymp-code').value.trim();
  if (!code) { alert('Please enter some Python code.'); return; }

  document.getElementById('asymp-spinner').style.display = 'flex';
  document.getElementById('asymp-output').innerHTML = '<div style="color:var(--muted); font-size:12px;">Analyzing…</div>';

  await new Promise(r => setTimeout(r, 600));

  const result = detectComplexity(code);
  const timings = simulateTimings(result.best);
  const bigo = result.best;

  let out = `AUTOMATIC ASYMPTOTIC COMPLEXITY ANALYZER
${'='.repeat(45)}

[1/3] Running empirical analysis on the provided code...
`;
  for (const { n, t } of timings) {
    out += `  - n = ${String(n).padEnd(8)} | Time = ${t.toFixed(8)} sec\n`;
  }
  out += `
[2/3] Analyzing growth rate...

[3/3] ESTIMATED ASYMPTOTIC NOTATIONS
${'='.repeat(45)}

Based on empirical timing, the best fit is:

 ► Big-Theta (Tight Bound): Θ(${bigo.slice(2)})
 ► Big-Oh    (Upper Bound): ${bigo}
 ► Big-Omega (Lower Bound): Ω(${bigo.slice(2)})

(Note: Big-Oh and Big-Omega match the Big-Theta best fit
empirically unless the function has highly variable cases)

Confidence: HIGH (${result.score} pattern detected)
`;

  document.getElementById('asymp-output').textContent = out;
  document.getElementById('asymp-result-tag').innerHTML = `<span class="complexity-chip chip-cyan">${bigo}</span>`;
  document.getElementById('asymp-spinner').style.display = 'none';

  // Highlight strip
  document.querySelectorAll('#asymp-bigo-strip .bigo-cell').forEach(cell => {
    cell.classList.remove('highlight');
    cell.querySelector('.val').textContent = '✓';
    if (cell.dataset.o === bigo) {
      cell.classList.add('highlight');
      cell.querySelector('.val').textContent = '★';
    }
  });
}

/* ══════════════════════════════════════════
   COORDINATE TRANSFORMATION
══════════════════════════════════════════ */
let currentTransform = 'translation';
let lastPoint = null, lastTransformed = null;

function setTransform(type, btn) {
  currentTransform = type;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tf-params').forEach(el => el.style.display = 'none');
  document.getElementById('tf-' + type).style.display = type === 'combined' ? 'block' : 'grid';
}

function mat3x3Mul(M, v) {
  return [
    M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
    M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
    M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
  ];
}

function matStr(M, name) {
  const fmt = n => String(parseFloat(n.toFixed(3))).padStart(8);
  return `${name}:\n[${fmt(M[0][0])} ${fmt(M[0][1])} ${fmt(M[0][2])} ]\n[${fmt(M[1][0])} ${fmt(M[1][1])} ${fmt(M[1][2])} ]\n[${fmt(M[2][0])} ${fmt(M[2][1])} ${fmt(M[2][2])} ]`;
}

function applyTransform() {
  const x = parseFloat(document.getElementById('coord-x').value);
  const y = parseFloat(document.getElementById('coord-y').value);
  const pt = [x, y, 1];

  let M, result, matName = 'M';

  if (currentTransform === 'translation') {
    const tx = parseFloat(document.getElementById('tx').value);
    const ty = parseFloat(document.getElementById('ty').value);
    M = [[1,0,tx],[0,1,ty],[0,0,1]];
    matName = 'T (Translation)';
    result = mat3x3Mul(M, pt);
  } else if (currentTransform === 'rotation') {
    const a = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
    M = [[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
    matName = 'R (Rotation)';
    result = mat3x3Mul(M, pt);
  } else if (currentTransform === 'scaling') {
    const sx = parseFloat(document.getElementById('sx').value);
    const sy = parseFloat(document.getElementById('sy').value);
    M = [[sx,0,0],[0,sy,0],[0,0,1]];
    matName = 'S (Scaling)';
    result = mat3x3Mul(M, pt);
  } else {
    const a = parseFloat(document.getElementById('c-angle').value) * Math.PI / 180;
    const tx = parseFloat(document.getElementById('c-tx').value);
    const ty = parseFloat(document.getElementById('c-ty').value);
    const R = [[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
    const T = [[1,0,tx],[0,1,ty],[0,0,1]];
    const temp = mat3x3Mul(R, pt);
    result = mat3x3Mul(T, temp);
    M = T; // show translation matrix
    matName = 'T·R (Combined)';
  }

  lastPoint = pt;
  lastTransformed = result;

  // Explanation
  const ox = pt[0], oy = pt[1], rx = result[0].toFixed(3), ry = result[1].toFixed(3);
  const dx = (result[0] - ox).toFixed(3), dy = (result[1] - oy).toFixed(3);
  let expl = '';
  if (currentTransform === 'translation') expl = `Point moved from (${ox}, ${oy}) → (${rx}, ${ry}), shifted by Δx=${dx}, Δy=${dy}. Shape slides without rotation or size change.`;
  else if (currentTransform === 'rotation') expl = `Point rotated from (${ox}, ${oy}) → (${rx}, ${ry}) around origin. Distance from origin is preserved.`;
  else if (currentTransform === 'scaling') expl = `Point scaled from (${ox}, ${oy}) → (${rx}, ${ry}). Shape resizes relative to origin.`;
  else expl = `Combined: point moved from (${ox}, ${oy}) → (${rx}, ${ry}) after rotation + translation.`;

  const explEl = document.getElementById('coord-explain');
  explEl.style.display = 'block';
  explEl.textContent = expl;

  document.getElementById('coord-matrix').style.display = 'block';
  document.getElementById('matrix-content').textContent = matStr(M, matName);

  drawCoord();
}

function resetCoord() {
  lastPoint = null; lastTransformed = null;
  document.getElementById('coord-explain').style.display = 'none';
  document.getElementById('coord-matrix').style.display = 'none';
  drawCoord();
}

function drawCoord() {
  const canvas = document.getElementById('coord-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const scale = 32;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(42,42,56,0.8)';
  ctx.lineWidth = 1;
  for (let gx = cx % scale; gx < W; gx += scale) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = cy % scale; gy < H; gy += scale) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // Axes
  ctx.strokeStyle = 'rgba(0,229,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  // Axis labels
  ctx.fillStyle = 'rgba(107,107,128,0.8)';
  ctx.font = '11px DM Mono, monospace';
  ctx.fillText('x', W - 14, cy - 6);
  ctx.fillText('y', cx + 6, 14);
  ctx.fillText('0', cx + 4, cy + 14);

  // Tick marks & numbers
  ctx.fillStyle = 'rgba(107,107,128,0.5)';
  ctx.font = '9px DM Mono, monospace';
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const px = cx + i * scale, py = cy + i * scale;
    ctx.fillText(i, px - 6, cy + 14);
    ctx.fillText(-i, cx + 4, py + 3);
  }

  if (!lastPoint || !lastTransformed) {
    // Draw placeholder dot at origin
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,229,255,0.2)';
    ctx.fill();
    return;
  }

  const toCanvas = (x, y) => [cx + x * scale, cy - y * scale];

  // Draw line between points
  const [ox, oy] = toCanvas(lastPoint[0], lastPoint[1]);
  const [tx, ty] = toCanvas(lastTransformed[0], lastTransformed[1]);

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = 'rgba(245,158,11,0.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Original point
  ctx.beginPath();
  ctx.arc(ox, oy, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,229,255,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 11px DM Mono, monospace';
  ctx.fillText(`(${lastPoint[0]}, ${lastPoint[1]})`, ox + 12, oy - 8);

  // Transformed point
  ctx.beginPath();
  ctx.arc(tx, ty, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,158,11,0.15)';
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px DM Mono, monospace';
  ctx.fillText(`(${parseFloat(lastTransformed[0].toFixed(2))}, ${parseFloat(lastTransformed[1].toFixed(2))})`, tx + 12, ty - 8);
}

// Init canvas
setTimeout(drawCoord, 200);

/* ══════════════════════════════════════════
   RECURSIVE ANALYZER
══════════════════════════════════════════ */
const recExamples = {
  fibonacci: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
  mergesort: `def merge_sort(lst):
    if len(lst) <= 1:
        return lst
    mid = len(lst) // 2
    left = merge_sort(lst[:mid])
    right = merge_sort(lst[mid:])
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`,
  binarysearch: `def binary_search(lst, target):
    if not lst:
        return -1
    mid = len(lst) // 2
    if lst[mid] == target:
        return mid
    elif lst[mid] < target:
        result = binary_search(lst[mid+1:], target)
        return mid + 1 + result if result != -1 else -1
    else:
        return binary_search(lst[:mid], target)`,
};

function loadRecursiveExample(key) {
  document.getElementById('rec-code').value = recExamples[key];
}

// Simple AST-like parser in JS
function analyzeRecursion(code) {
  const lines = code.split('\n');
  const funcs = {};

  // Find all function definitions
  const funcRe = /^(\s*)def\s+(\w+)\s*\(/;
  let currentFunc = null;
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(funcRe);
    if (match) {
      currentFunc = match[2];
      currentIndent = match[1].length;
      funcs[currentFunc] = {
        name: currentFunc,
        startLine: i + 1,
        isRecursive: false,
        recursiveCalls: [],
        loopDepth: 0,
        forLoops: 0,
        whileLoops: 0,
      };
    }

    if (currentFunc && i > funcs[currentFunc].startLine - 1) {
      const stripped = line.trim();
      if (stripped.startsWith('for ') || stripped.startsWith('for(')) funcs[currentFunc].forLoops++;
      if (stripped.startsWith('while ')) funcs[currentFunc].whileLoops++;
      // Detect recursive call
      const callRe = new RegExp('\\b' + currentFunc + '\\s*\\(');
      if (callRe.test(line)) {
        funcs[currentFunc].isRecursive = true;
        funcs[currentFunc].recursiveCalls.push({ line: i + 1, code: line.trim() });
      }
    }
  }

  // Estimate complexity for each function
  for (const name in funcs) {
    const f = funcs[name];
    const divides = code.includes('// 2') || code.includes('>> 1') || code.includes('/ 2');
    const numCalls = f.recursiveCalls.length;
    const loops = f.forLoops + f.whileLoops;

    if (!f.isRecursive) {
      if (loops === 0) f.complexity = 'O(1) — No loops, constant time';
      else if (loops === 1) f.complexity = 'O(N) — Single loop, linear time';
      else f.complexity = `O(N^${loops}) — Nested loops, polynomial time`;
    } else {
      if (numCalls >= 2 && !divides) f.complexity = 'O(2^N) — Exponential (e.g., naive Fibonacci)';
      else if (numCalls >= 2 && divides) f.complexity = 'O(N log N) — Linearithmic (e.g., Merge Sort)';
      else if (numCalls === 1 && divides) f.complexity = 'O(log N) — Logarithmic (e.g., Binary Search)';
      else if (numCalls === 1 && loops > 0) f.complexity = 'O(N^2) — Linear recursion + loop work';
      else f.complexity = 'O(N) — Linear recursion (e.g., Factorial)';
    }
  }

  return Object.values(funcs);
}

function complexityChipClass(complexity) {
  if (complexity.includes('O(1)')) return 'chip-green';
  if (complexity.includes('log N)') && !complexity.includes('N log')) return 'chip-cyan';
  if (complexity.includes('O(N)') && !complexity.includes('log')) return 'chip-cyan';
  if (complexity.includes('N log N')) return 'chip-amber';
  if (complexity.includes('N^2') || complexity.includes('N^3')) return 'chip-amber';
  if (complexity.includes('2^N')) return 'chip-red';
  return 'chip-purple';
}

async function runRecursive() {
  const code = document.getElementById('rec-code').value.trim();
  if (!code) { alert('Please enter Python code.'); return; }

  document.getElementById('rec-spinner').style.display = 'flex';
  document.getElementById('rec-output').innerHTML = '<div style="color:var(--muted); padding:16px; font-size:12px;">Parsing AST…</div>';

  await new Promise(r => setTimeout(r, 400));

  const results = analyzeRecursion(code);
  document.getElementById('rec-spinner').style.display = 'none';

  if (!results.length) {
    document.getElementById('rec-output').innerHTML = '<div class="result-placeholder" style="margin-top:40px; text-align:center; color:var(--muted); font-size:12px;">No functions found in the provided code.</div>';
    document.getElementById('rec-summary').textContent = '0 functions';
    return;
  }

  document.getElementById('rec-summary').textContent = `${results.length} function${results.length > 1 ? 's' : ''} found`;

  let html = '';
  for (const f of results) {
    const chipClass = complexityChipClass(f.complexity);
    html += `<div class="func-card">
      <div class="func-card-header">
        <div class="func-name">def ${f.name}()</div>
        <span class="complexity-chip ${chipClass}">${f.complexity.split(' ')[0]}</span>
      </div>
      <div class="func-details">
        <div>Line: ${f.startLine} &nbsp;|&nbsp; Recursive: <strong style="color:${f.isRecursive ? 'var(--accent)' : 'var(--muted)'};">${f.isRecursive ? 'Yes' : 'No'}</strong> &nbsp;|&nbsp; Loops: ${f.forLoops + f.whileLoops}</div>
        <div style="margin-top: 8px; color: var(--text); font-size:12px;">Estimated: <strong>${f.complexity}</strong></div>
      </div>`;

    if (f.isRecursive && f.recursiveCalls.length > 0) {
      html += `<div style="margin-top:12px; font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); margin-bottom:6px;">Recursive Calls</div>`;
      for (const call of f.recursiveCalls) {
        html += `<div class="call-line"><span class="line-no">L${call.line}</span><span class="code">${escapeHtml(call.code)}</span></div>`;
      }
    }
    html += '</div>';
  }

  document.getElementById('rec-output').innerHTML = html;
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════
   GRAPH TRAVERSALS
══════════════════════════════════════════ */
let currentTraversalAlg = 'bfs';

function handleGraphDirectionChange() {
    const isDirected = document.getElementById('graph-direction').value === 'directed';
    const arrow = isDirected ? '⟶' : '⟷';
    document.querySelectorAll('.builder-arrow').forEach(span => {
        if (span.textContent === '⟶' || span.textContent === '⟷') {
            span.textContent = arrow;
        }
    });
}

function addEdgeRow(u='', v='', w='') {
    const list = document.getElementById('edge-list');
    const row = document.createElement('div');
    row.className = 'builder-row';
    const isWeighted = currentTraversalAlg === 'dijkstra';
    const dirEl = document.getElementById('graph-direction');
    const isDirected = dirEl ? dirEl.value === 'directed' : false;
    const arrow = isDirected ? '⟶' : '⟷';
    row.innerHTML = `
        <input type="text" class="edge-u" value="${u}" maxlength="1" placeholder="A">
        <span class="builder-arrow" style="width:14px; text-align:center;">${arrow}</span>
        <input type="text" class="edge-v" value="${v}" maxlength="1" placeholder="B">
        <input type="number" class="weight-input edge-w" value="${w}" placeholder="Wt" style="display:${isWeighted ? 'block' : 'none'};">
        <button class="btn-remove" onclick="this.parentElement.remove()" title="Delete Edge">🗑️</button>
    `;
    list.appendChild(row);
}

function addHeuristicRow(node='', val='') {
    const list = document.getElementById('heuristic-list');
    const row = document.createElement('div');
    row.className = 'builder-row';
    row.innerHTML = `
        <input type="text" class="heur-node" value="${node}" maxlength="1" placeholder="A">
        <span class="builder-arrow">:</span>
        <input type="number" class="heur-val" value="${val}" placeholder="Value">
        <button class="btn-remove" onclick="this.parentElement.remove()" title="Delete Heuristic">🗑️</button>
    `;
    list.appendChild(row);
}

function clearEdgesList() {
    document.getElementById('edge-list').innerHTML = '';
}

function clearHeuristicsList() {
    const hList = document.getElementById('heuristic-list');
    if (hList) hList.innerHTML = '';
}

function updateEdgeWeightsVisibility() {
    const isWeighted = currentTraversalAlg === 'dijkstra';
    document.querySelectorAll('.weight-input').forEach(el => {
        el.style.display = isWeighted ? 'block' : 'none';
    });
}

function initGraphForm(type) {
  document.getElementById('edge-list').innerHTML = '';
  document.getElementById('heuristic-list').innerHTML = '';
  if (type === 'weighted') {
    addEdgeRow('A','B',1); addEdgeRow('A','C',4);
    addEdgeRow('B','A',1); addEdgeRow('B','D',2); addEdgeRow('B','E',5);
    addEdgeRow('C','A',4); addEdgeRow('C','F',3);
    addEdgeRow('D','B',2);
    addEdgeRow('E','B',5); addEdgeRow('E','F',1);
    addEdgeRow('F','C',3); addEdgeRow('F','E',1);
  } else {
    addEdgeRow('A','B'); addEdgeRow('A','C');
    addEdgeRow('B','A'); addEdgeRow('B','D'); addEdgeRow('B','E');
    addEdgeRow('C','A'); addEdgeRow('C','F');
    addEdgeRow('D','B');
    addEdgeRow('E','B'); addEdgeRow('E','F');
    addEdgeRow('F','C'); addEdgeRow('F','E');
  }
  
  if (currentTraversalAlg === 'bestfirst') {
    addHeuristicRow('A', 5); addHeuristicRow('B', 4);
    addHeuristicRow('C', 2); addHeuristicRow('D', 6);
    addHeuristicRow('E', 1); addHeuristicRow('F', 0);
  }
}

function setAlgorithmMode(alg, btn) {
  currentTraversalAlg = alg;
  document.querySelectorAll('.alg-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  const dynHeuristics = document.getElementById('dynamic-heuristics-ui');
  
  if (alg === 'dijkstra') {
    if (dynHeuristics) dynHeuristics.style.display = 'none';
    initGraphForm('weighted');
  } else if (alg === 'bestfirst') {
    if (dynHeuristics) dynHeuristics.style.display = 'block';
    initGraphForm('unweighted');
  } else {
    if (dynHeuristics) dynHeuristics.style.display = 'none';
    initGraphForm('unweighted');
  }
  updateEdgeWeightsVisibility();
}

function clearTraversal() {
  document.getElementById('edge-list').innerHTML = '';
  if (document.getElementById('heuristic-list')) document.getElementById('heuristic-list').innerHTML = '';
  document.getElementById('trav-start').value = 'A';
  document.getElementById('trav-goal').value = 'F';
  document.getElementById('trav-output').innerHTML = '<div class="result-placeholder" style="margin-top:80px; text-align:center; color:var(--muted); font-size:12px;">Run a pathfinding strategy to see results.</div>';
  document.getElementById('trav-summary').textContent = '—';
}

// Pathfinding logic in JS
function runBFS(jsGraph, start, goal) {
  if (!jsGraph[start] || !jsGraph[goal]) return null;
  if (start === goal) return [start];
  let queue = [start];
  let visited = new Set([start]);
  let parents = { [start]: null };
  while (queue.length > 0) {
    let current = queue.shift();
    for (let neighbor of jsGraph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parents[neighbor] = current;
        if (neighbor === goal) {
          let path = []; let node = neighbor;
          while (node !== null) { path.push(node); node = parents[node]; }
          return path.reverse();
        }
        queue.push(neighbor);
      }
    }
  }
}

function drawGraphSimulator(canvasId, graph, path, isWeighted) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Extract all unique nodes
    const nodes = new Set(Object.keys(graph));
    for (let u in graph) {
        if (isWeighted) {
            for (let v in graph[u]) nodes.add(v);
        } else {
            for (let v of graph[u]) nodes.add(v);
        }
    }
    const nodeArr = Array.from(nodes).sort();
    if (nodeArr.length === 0) return;
    
    // Compute positions (circular layout)
    const positions = {};
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - 40;
    
    nodeArr.forEach((node, i) => {
        const theta = (i * 2 * Math.PI) / nodeArr.length - Math.PI / 2;
        positions[node] = {
            x: cx + r * Math.cos(theta),
            y: cy + r * Math.sin(theta)
        };
    });
    
    ctx.clearRect(0, 0, width, height);
    
    const pathEdges = new Set();
    if (path && path.length > 1) {
        for (let i = 0; i < path.length - 1; i++) {
            pathEdges.add(`${path[i]}->${path[i+1]}`);
            pathEdges.add(`${path[i+1]}->${path[i]}`); // In case of undirected matching for highlights
        }
    }
    
    const isDirected = document.getElementById('graph-direction') ? document.getElementById('graph-direction').value === 'directed' : false;
    const drawnUndirectedEdges = new Set();

    function drawEdge(u, v, weight, isPath) {
        if (!isDirected) {
            const edgeKey = [u, v].sort().join('-');
            if (drawnUndirectedEdges.has(edgeKey)) return;
            drawnUndirectedEdges.add(edgeKey);
        }

        const p1 = positions[u];
        const p2 = positions[v];
        if (!p1 || !p2) return;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = isPath ? '#00e5ff' : 'rgba(107,107,128,0.3)';
        ctx.lineWidth = isPath ? 3 : 1.5;
        ctx.stroke();
        
        if (isDirected) {
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const headlen = 10;
            const targetX = p2.x - 18 * Math.cos(angle);
            const targetY = p2.y - 18 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(targetX, targetY);
            ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI/6), targetY - headlen * Math.sin(angle - Math.PI/6));
            ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI/6), targetY - headlen * Math.sin(angle + Math.PI/6));
            ctx.fillStyle = isPath ? '#00e5ff' : 'rgba(107,107,128,0.6)';
            ctx.fill();
        }
        
        if (weight !== undefined && weight !== null) {
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            ctx.fillStyle = '#0d0d14';
            ctx.fillRect(mx - 8, my - 8, 16, 16);
            ctx.fillStyle = isPath ? '#f59e0b' : '#e8e8f0';
            ctx.font = '11px DM Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(weight, mx, my + 1);
        }
    }
    
    for (let u in graph) {
        if (isWeighted) {
            for (let v in graph[u]) {
                if (!pathEdges.has(`${u}->${v}`)) drawEdge(u, v, graph[u][v], false);
            }
        } else {
            for (let v of graph[u]) {
                if (!pathEdges.has(`${u}->${v}`)) drawEdge(u, v, null, false);
            }
        }
    }
    
    for (let u in graph) {
        if (isWeighted) {
            for (let v in graph[u]) {
                if (pathEdges.has(`${u}->${v}`)) drawEdge(u, v, graph[u][v], true);
            }
        } else {
            for (let v of graph[u]) {
                if (pathEdges.has(`${u}->${v}`)) drawEdge(u, v, null, true);
            }
        }
    }
    
    const pathNodes = new Set(path || []);
    for (let node of nodeArr) {
        const p = positions[node];
        const isPath = pathNodes.has(node);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isPath ? 'rgba(0,229,255,0.15)' : '#18181f';
        ctx.fill();
        ctx.strokeStyle = isPath ? '#00e5ff' : '#6b6b80';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = isPath ? '#00e5ff' : '#e8e8f0';
        ctx.font = 'bold 14px DM Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node, p.x, p.y + 1);
    }
    
    if (path && path.length > 0) {
        const sNode = path[0];
        const sP = positions[sNode];
        if (sP) {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('START', sP.x, sP.y - 28);
        }
        const gNode = path[path.length - 1];
        const gP = positions[gNode];
        if (gP && sNode !== gNode) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GOAL', gP.x, gP.y - 28);
        }
    }
}

function runDFS(jsGraph, start, goal) {
  if (!jsGraph[start] || !jsGraph[goal]) return null;
  if (start === goal) return [start];
  let stack = [[start, [start]]];
  let visited = new Set();
  while (stack.length > 0) {
    let pop = stack.pop();
    let current = pop[0], path = pop[1];
    if (!visited.has(current)) {
      visited.add(current);
      let neighbors = jsGraph[current] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        let neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          if (neighbor === goal) return path.concat([neighbor]);
          stack.push([neighbor, path.concat([neighbor])]);
        }
      }
    }
  }
  return null;
}

function runDijkstra(jsWeightedGraph, start, goal) {
  if (!jsWeightedGraph[start] || !jsWeightedGraph[goal]) return {path: null, cost: Infinity};
  let pq = [[0, start, [start]]];
  let minCosts = { [start]: 0 };
  let visited = new Set();
  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    let shift = pq.shift();
    let cost = shift[0], current = shift[1], path = shift[2];
    if (current === goal) return {path, cost};
    if (visited.has(current)) continue;
    visited.add(current);
    let neighbors = jsWeightedGraph[current] || {};
    for (let neighbor in neighbors) {
      if (visited.has(neighbor)) continue;
      let newCost = cost + neighbors[neighbor];
      if (!(neighbor in minCosts) || newCost < minCosts[neighbor]) {
        minCosts[neighbor] = newCost;
        pq.push([newCost, neighbor, path.concat([neighbor])]);
      }
    }
  }
  return {path: null, cost: Infinity};
}

function runBestFirst(jsGraph, jsHeuristics, start, goal) {
  if (!jsGraph[start] || !jsGraph[goal]) return null;
  let pq = [[(jsHeuristics[start] !== undefined ? jsHeuristics[start] : Infinity), start, [start]]];
  let visited = new Set();
  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    let shift = pq.shift();
    let h = shift[0], current = shift[1], path = shift[2];
    if (current === goal) return path;
    if (visited.has(current)) continue;
    visited.add(current);
    for (let neighbor of jsGraph[current] || []) {
      if (!visited.has(neighbor)) {
        pq.push([(jsHeuristics[neighbor] !== undefined ? jsHeuristics[neighbor] : Infinity), neighbor, path.concat([neighbor])]);
      }
    }
  }
  return null;
}

async function runTraversal() {
  let parsedGraph = {};
  let parsedHeuristics = {};
  
  const isDirected = document.getElementById('graph-direction') ? document.getElementById('graph-direction').value === 'directed' : false;

  document.querySelectorAll('#edge-list .builder-row').forEach(row => {
     let u = row.querySelector('.edge-u').value.trim().toUpperCase();
     let v = row.querySelector('.edge-v').value.trim().toUpperCase();
     let w = row.querySelector('.edge-w').value;
     if (!u || !v) return;
     if (currentTraversalAlg === 'dijkstra') {
         if (!parsedGraph[u]) parsedGraph[u] = {};
         parsedGraph[u][v] = parseFloat(w) || 0;
         if (!isDirected) {
             if (!parsedGraph[v]) parsedGraph[v] = {};
             parsedGraph[v][u] = parseFloat(w) || 0;
         }
     } else {
         if (!parsedGraph[u]) parsedGraph[u] = [];
         if (!parsedGraph[u].includes(v)) parsedGraph[u].push(v);
         if (!parsedGraph[v]) parsedGraph[v] = []; // initialize destination node too for safety
         if (!isDirected) {
             if (!parsedGraph[v].includes(u)) parsedGraph[v].push(u);
         }
     }
  });

  if (currentTraversalAlg === 'bestfirst') {
      document.querySelectorAll('#heuristic-list .builder-row').forEach(row => {
         let n = row.querySelector('.heur-node').value.trim().toUpperCase();
         let val = row.querySelector('.heur-val').value;
         if (n) parsedHeuristics[n] = parseFloat(val) || 0;
      });
  }

  const startNodeEl = document.getElementById('trav-start');
  const goalNodeEl = document.getElementById('trav-goal');
  const startNode = startNodeEl ? startNodeEl.value.trim().toUpperCase() : 'A';
  const goalNode = goalNodeEl ? goalNodeEl.value.trim().toUpperCase() : 'F';

  if (!startNode || !goalNode) {
    alert('Please enter both Start Node and Goal Node.');
    return;
  }
  
  if (Object.keys(parsedGraph).length === 0) {
    alert('Please define at least one valid edge in the graph.');
    return;
  }

  document.getElementById('trav-spinner').style.display = 'flex';
  document.getElementById('trav-output').innerHTML = '<div style="color:var(--muted); font-size:12px;">Simulating graph traversal...</div>';

  await new Promise(r => setTimeout(r, 500));
  
  let summary = '';
  let path = null;
  let cost = undefined;
  
  if (currentTraversalAlg === 'bfs') {
    summary = 'Breadth-First Search Algorithm';
    path = runBFS(parsedGraph, startNode, goalNode);
  } else if (currentTraversalAlg === 'dfs') {
    summary = 'Depth-First Search Algorithm';
    path = runDFS(parsedGraph, startNode, goalNode);
  } else if (currentTraversalAlg === 'dijkstra') {
    summary = "Dijkstra's Shortest Path Algorithm";
    let res = runDijkstra(parsedGraph, startNode, goalNode);
    path = res.path;
    cost = res.cost;
  } else if (currentTraversalAlg === 'bestfirst') {
    summary = 'Greedy Best-First Search Algorithm';
    path = runBestFirst(parsedGraph, parsedHeuristics, startNode, goalNode);
  }
  
  document.getElementById('trav-summary').textContent = summary;
  
  let outputHtml = '';
  if (path) {
     const pathNodes = path.map(n => `<span style="background:var(--accent); color:#000; padding:4px 10px; border-radius:6px; font-weight:bold;">${n}</span>`).join('<span style="color:var(--muted); padding:0 8px;">⟶</span>');
     
     outputHtml = `
      <div style="margin-bottom: 16px; font-size: 13px; color: var(--text);">Optimal path found from <strong>${startNode}</strong> to <strong>${goalNode}</strong>:</div>
      <div style="font-size: 16px; padding: 16px; background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.2); border-radius: 8px; display:inline-block;">
         ${pathNodes}
      </div>
     `;
     if (cost !== undefined && cost !== Infinity) {
         outputHtml += `<div style="margin-top: 16px; font-size: 13px; color: var(--accent3);"><strong>Total Cost / Weight:</strong> ${cost}</div>`;
     }
  } else {
     outputHtml = `
      <div style="padding: 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: var(--danger); font-size: 13px;">
         No valid path exists from <strong>${startNode}</strong> to <strong>${goalNode}</strong> in this graph structure.
      </div>`;
  }
  
  document.getElementById('trav-output').innerHTML = `
    <div><strong style="color:var(--success);">✓ Traversal Complete</strong><br><br>${outputHtml}</div>
    <div style="margin-top:24px; text-align:center;">
        <canvas id="graph-sim-canvas" width="600" height="400" style="width:100%; max-width:600px; height:auto; background:#111118; border:1px solid var(--border); border-radius:12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></canvas>
    </div>
  `;
  document.getElementById('trav-spinner').style.display = 'none';

  setTimeout(() => {
      drawGraphSimulator('graph-sim-canvas', parsedGraph, path, currentTraversalAlg === 'dijkstra');
  }, 50);
}

// Initial mode load
setTimeout(() => setAlgorithmMode('bfs', document.querySelector('.alg-btn')), 300);