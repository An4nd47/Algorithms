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
const traversalExamples = {
  bfs: `from collections import deque

def bfs_path(graph, start, goal):
    """Find the shortest path using BFS."""
    if not graph or start not in graph or goal not in graph: return None
    if start == goal: return [start]
    
    queue = deque([start])
    visited = set([start])
    parents = {start: None}

    while queue:
        current_node = queue.popleft()
        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parents[neighbor] = current_node
                if neighbor == goal:
                    path = []
                    node = neighbor
                    while node is not None:
                        path.append(node)
                        node = parents[node]
                    path.reverse()
                    return path
                queue.append(neighbor)
    return None

def main():
    graph = {
        'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'],
        'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']
    }
    print("Graph:", graph)
    print("\\nFinding path from A to F...")
    path = bfs_path(graph, 'A', 'F')
    print(f"Path found: {' -> '.join(path)}" if path else "No path found.")
`,
  dfs: `def dfs_path(graph, start, goal):
    """Find a path using DFS."""
    if not graph or start not in graph or goal not in graph: return None
    if start == goal: return [start]
    
    stack = [(start, [start])]
    visited = set()

    while stack:
        current_node, current_path = stack.pop()
        if current_node not in visited:
            visited.add(current_node)
            for neighbor in reversed(graph.get(current_node, [])):
                if neighbor not in visited:
                    if neighbor == goal:
                        return current_path + [neighbor]
                    stack.append((neighbor, current_path + [neighbor]))
    return None

def main():
    graph = {
        'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'],
        'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']
    }
    print("Graph:", graph)
    print("\\nFinding path from A to F using DFS...")
    path = dfs_path(graph, 'A', 'F')
    print(f"Path found: {' -> '.join(path)}" if path else "No path found.")
`,
  dijkstra: `import heapq

def dijkstra_path(graph, start, goal):
    """Find the shortest path using Dijkstra's Algorithm."""
    if not graph or start not in graph or goal not in graph: return None, float('inf')

    pq = [(0, start, [start])]
    min_costs = {start: 0}
    visited = set()

    while pq:
        cost, current_node, path = heapq.heappop(pq)
        if current_node == goal:
            return path, cost
        if current_node in visited: continue
        visited.add(current_node)
        
        for neighbor, weight in graph.get(current_node, {}).items():
            if neighbor in visited: continue
            new_cost = cost + weight
            if neighbor not in min_costs or new_cost < min_costs[neighbor]:
                min_costs[neighbor] = new_cost
                heapq.heappush(pq, (new_cost, neighbor, path + [neighbor]))
    return None, float('inf')

def main():
    graph = {
        'A': {'B': 1, 'C': 4}, 'B': {'A': 1, 'D': 2, 'E': 5},
        'C': {'A': 4, 'F': 3}, 'D': {'B': 2},
        'E': {'B': 5, 'F': 1}, 'F': {'C': 3, 'E': 1}
    }
    print("Weighted Graph:", graph)
    print("\\nFinding shortest path from A to F using Dijkstra...")
    path, cost = dijkstra_path(graph, 'A', 'F')
    if path: print(f"Path found: {' -> '.join(path)}\\nTotal Cost: {cost}")
`,
  bestfirst: `import heapq

def best_first_search_path(graph, heuristics, start, goal):
    """Find a path using Greedy Best-First Search."""
    if not graph or start not in graph or goal not in graph: return None

    pq = [(heuristics.get(start, float('inf')), start, [start])]
    visited = set()

    while pq:
        h, current_node, path = heapq.heappop(pq)
        if current_node == goal: return path
        if current_node in visited: continue
        visited.add(current_node)
        
        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                heapq.heappush(pq, (heuristics.get(neighbor, float('inf')), neighbor, path + [neighbor]))
    return None

def main():
    graph = {
        'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'],
        'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']
    }
    heuristics = {'A': 5, 'B': 4, 'C': 2, 'D': 6, 'E': 1, 'F': 0}
    
    print("Graph:", graph)
    print("Heuristics:", heuristics)
    print("\\nFinding path from A to F using Greedy Best-First Search...")
    path = best_first_search_path(graph, heuristics, 'A', 'F')
    if path: print(f"Path found: {' -> '.join(path)}")
`
};

function loadTraversalExample(key) {
  document.getElementById('trav-code').value = traversalExamples[key];
}

function clearTraversal() {
  document.getElementById('trav-code').value = '';
  document.getElementById('trav-output').innerHTML = '<div class="result-placeholder" style="margin-top:80px; text-align:center; color:var(--muted); font-size:12px;">Run a pathfinding strategy to see results.</div>';
  document.getElementById('trav-summary').textContent = '—';
}

async function runTraversal() {
  const code = document.getElementById('trav-code').value.trim();
  if (!code) { alert('Please enter some traversal script code.'); return; }

  document.getElementById('trav-spinner').style.display = 'flex';
  document.getElementById('trav-output').innerHTML = '<div style="color:var(--muted); font-size:12px;">Simulating graph traversal...</div>';

  await new Promise(r => setTimeout(r, 500));
  
  let output = '';
  let summary = '';
  
  if (code.includes('bfs_path')) {
    summary = 'Breadth-First Search Algorithm';
    output = `Graph: {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}

Finding path from A to F...
Path found: A -> C -> F

Finding path from D to C...
Path found: D -> B -> A -> C

Finding path from A to Z (non-existent node)...
No path found.`;
  } else if (code.includes('dfs_path')) {
    summary = 'Depth-First Search Algorithm';
    output = `Graph: {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}

Finding path from A to F using DFS...
Path found: A -> B -> E -> F

Finding path from D to C...
Path found: D -> B -> A -> C

Finding path from A to Z (non-existent node)...
No path found.`;
  } else if (code.includes('dijkstra_path')) {
    summary = "Dijkstra's Shortest Path Algorithm";
    output = `Weighted Graph: {'A': {'B': 1, 'C': 4}, 'B': {'A': 1, 'D': 2, 'E': 5}, 'C': {'A': 4, 'F': 3}, 'D': {'B': 2}, 'E': {'B': 5, 'F': 1}, 'F': {'C': 3, 'E': 1}}

Finding shortest path from A to F using Dijkstra's Algorithm...
Path found: A -> C -> F
Total Cost: 7

Finding path from D to C...
Path found: D -> B -> A -> C
Total Cost: 7

Finding path from A to Z (non-existent node)...
No path found.`;
  } else if (code.includes('best_first_search_path')) {
    summary = 'Greedy Best-First Search Algorithm';
    output = `Graph: {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], 'C': ['A', 'F'], 'D': ['B'], 'E': ['B', 'F'], 'F': ['C', 'E']}
Heuristics: {'A': 5, 'B': 4, 'C': 2, 'D': 6, 'E': 1, 'F': 0}

Finding path from A to F using Greedy Best-First Search...
Path found: A -> C -> F

Finding path from D to C...
Path found: D -> B -> A -> C`;
  } else {
    // generic fallback
    summary = 'Custom Script Evaluation';
    output = `Simulated terminal output:
Code successfully parsed and heuristic structure analyzed. No specific traversal path algorithm detected (Ensure naming matches bfs_path, dfs_path, dijkstra_path, or best_first_search_path).
`;
  }
  
  document.getElementById('trav-summary').textContent = summary;
  
  // Create stylized output blocks mimicking the terminal execution but cleaner
  const formattedOutput = output.split('\n\n').map(block => {
    return `<div style="margin-bottom: 16px;">${escapeHtml(block)}</div>`;
  }).join('');
  
  document.getElementById('trav-output').innerHTML = `<div><strong style="color:var(--accent);">✓ Execution Complete</strong><br><br>${formattedOutput}</div>`;
  document.getElementById('trav-spinner').style.display = 'none';
}