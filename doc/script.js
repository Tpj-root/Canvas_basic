// ═══════════════════════════════════════════════════════════
// STEP 1 — Grab DOM elements
// ═══════════════════════════════════════════════════════════
const canvas     = document.getElementById('canvas');
const ctx        = canvas.getContext('2d');
const status     = document.getElementById('status');
const valueInput = document.getElementById('valueInput');
const colorInput = document.getElementById('colorInput');

// Store every created node here
const nodes = [];

// ═══════════════════════════════════════════════════════════
// STEP 2 — Create a node with ALL arguments
// ═══════════════════════════════════════════════════════════
function node_createfunction({
  x = 100,
  y = 100,
  w = 160,
  h = 70,

  title = 'New Node',

  bodyColor = '#0f172a',
  borderColor = '#1e293b',
  headerColor = '#00ffff',
  titleColor = '#0b0f17',

  inputPorts = 1,
  outputPorts = 1,

  inputPortColor = '#00ffff',
  outputPortColor = '#ff00ff',

  portRadius = 6,
  cornerRadius = 8,

  titleFont = 'bold 11px monospace',
  value = '',

  valueColor = '#f8fafc',
  valueFont = 'bold 24px monospace',

  headerHeight = 22,
  shadowColor = 'rgba(0,0,0,0.5)',
  shadowBlur = 12,

  portOffset = 0,

  draggable = true
} = {}) {

  // Create the node object
  const n = {
    x, y, w, h,
    title,
    bodyColor,
    borderColor,
    headerColor,
    titleColor,
    inputPorts,
    outputPorts,
    inputPortColor,
    outputPortColor,
    portRadius,
    cornerRadius,
    titleFont,
    value,
    valueColor,
    valueFont,
    headerHeight,
    shadowColor,
    shadowBlur,
    portOffset,
    draggable
  };

  // Add node to the collection
  nodes.push(n);

  // Return the created node so it can be changed later
  draw();

  return n;
}

// ═══════════════════════════════════════════════════════════
// STEP 3 — Draw all nodes
// ═══════════════════════════════════════════════════════════
function draw() {

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = '#111a2b';
  ctx.lineWidth = 1;

  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw every node in the array
  for (const n of nodes) {
    drawNode(n);
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 4 — Draw one node
// ═══════════════════════════════════════════════════════════
function drawNode(n) {

  const r = n.cornerRadius;

  // Shadow
  ctx.shadowColor = n.shadowColor;
  ctx.shadowBlur = n.shadowBlur;
  ctx.shadowOffsetY = 3;

  // Node body
  ctx.fillStyle = n.bodyColor;
  ctx.beginPath();
  ctx.roundRect(n.x, n.y, n.w, n.h, r);
  ctx.fill();

  // Reset shadow before drawing other elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = n.borderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(n.x, n.y, n.w, n.h, r);
  ctx.stroke();

  // Header strip
  ctx.fillStyle = n.headerColor;
  ctx.beginPath();
  ctx.roundRect(
    n.x,
    n.y,
    n.w,
    n.headerHeight,
    [r, r, 0, 0]
  );
  ctx.fill();

  // Node title
  ctx.fillStyle = n.titleColor;
  ctx.font = n.titleFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.fillText(
    n.title.toUpperCase(),
    n.x + 10,
    n.y + n.headerHeight / 2
  );

  // Node value
  ctx.fillStyle = n.valueColor;
  ctx.font = n.valueFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(
    n.value,
    n.x + n.w / 2,
    n.y + n.headerHeight + (n.h - n.headerHeight) / 2
  );

  // Draw input ports on the LEFT
  drawPort(
    n,
    'left',
    n.inputPorts,
    n.inputPortColor
  );

  // Draw output ports on the RIGHT
  drawPort(
    n,
    'right',
    n.outputPorts,
    n.outputPortColor
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 5 — Draw any number of ports
// ═══════════════════════════════════════════════════════════
function drawPort(n, side, count, color) {

  // No ports requested
  if (count <= 0) return;

  // Left side = x; right side = x + width
  const x = side === 'left'
    ? n.x
    : n.x + n.w;

  // Distribute ports evenly over the node height
  for (let i = 0; i < count; i++) {

    const y = n.y + n.h * (i + 1) / (count + 1);

    ctx.beginPath();
    ctx.arc(x, y + n.portOffset, n.portRadius, 0, Math.PI * 2);

    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = '#0b0f17';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 6 — Retina-aware canvas resize
// ═══════════════════════════════════════════════════════════
function resizeCanvas() {

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  draw();
}

window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════════════════════
// STEP 7 — Drag any node
// ═══════════════════════════════════════════════════════════
let draggingNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

canvas.addEventListener('mousedown', (e) => {

  const { x, y } = getMousePos(e);

  // Check from the topmost node backwards
  for (let i = nodes.length - 1; i >= 0; i--) {

    const n = nodes[i];

    if (
      n.draggable &&
      x >= n.x && x <= n.x + n.w &&
      y >= n.y && y <= n.y + n.h
    ) {

      draggingNode = n;

      dragOffsetX = x - n.x;
      dragOffsetY = y - n.y;

      status.textContent = `Dragging ${n.title}`;
      break;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {

  if (!draggingNode) return;

  const { x, y } = getMousePos(e);

  draggingNode.x = x - dragOffsetX;
  draggingNode.y = y - dragOffsetY;

  draw();
});

function stopDragging() {

  if (draggingNode) {
    status.textContent = 'Drag any node to move it.';
  }

  draggingNode = null;
}

canvas.addEventListener('mouseup', stopDragging);
canvas.addEventListener('mouseleave', stopDragging);

// Mouse coordinates relative to the canvas
function getMousePos(e) {

  const rect = canvas.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// ═══════════════════════════════════════════════════════════
// STEP 8 — Create nodes by passing arguments
// ═══════════════════════════════════════════════════════════

// NODE A
const nodeA = node_createfunction({
  x: 200,
  y: 150,
  w: 180,
  h: 90,

  title: 'Node A',
  value: '100',

  bodyColor: '#0f172a',
  borderColor: '#334155',
  headerColor: '#00ffff',

  inputPorts: 2,
  outputPorts: 3,

  inputPortColor: '#00ff00',
  outputPortColor: '#ff00ff',

  portRadius: 6
});

// NODE B
const nodeB = node_createfunction({
  x: 500,
  y: 150,

  title: 'Node B',
  value: '200',

  headerColor: '#facc15',

  inputPorts: 3,
  outputPorts: 1,

  inputPortColor: '#60a5fa',
  outputPortColor: '#fb7185'
});

// NODE C
const nodeC = node_createfunction({
  x: 350,
  y: 350,
  w: 200,
  h: 100,

  title: 'Node C',
  value: '300',

  bodyColor: '#172554',
  borderColor: '#3b82f6',
  headerColor: '#3b82f6',

  inputPorts: 0,
  outputPorts: 4,

  inputPortColor: '#22c55e',
  outputPortColor: '#f97316',

  portRadius: 8,
  draggable: true
});

// ═══════════════════════════════════════════════════════════
// STEP 9 — Input controls
// ═══════════════════════════════════════════════════════════
valueInput.addEventListener('input', () => {
  nodeA.value = valueInput.value;
  draw();
});

colorInput.addEventListener('input', () => {
  nodeA.headerColor = colorInput.value;
  draw();
});

// Start the canvas
resizeCanvas();