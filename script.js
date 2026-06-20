const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soulCounter = document.getElementById('soulCounter');
const clickCounter = document.getElementById('clickCounter');
const resetBtn = document.getElementById('resetBtn');

canvas.width = 600;
canvas.height = 600;

const W = canvas.width;
const H = canvas.height;

let points = [];
let edges = [];
let clicks = 0;
let soulNum = 1;
let exploding = false;
let explodeTimer = 0;
const explodeDuration = 1.8;

let draggedPoint = null;
let currentTheme = null;
let globalTime = 0;
let activePointerId = null;

const themes = [
  {
    flesh: 'rgba(139, 26, 26, ',
    core: 'rgba(123, 63, 160, ',
    glow: 'rgba(138, 180, 248, ',
    fiber: 'rgba(196, 145, 122, '
  },
  {
    flesh: 'rgba(58, 122, 74, ',
    core: 'rgba(127, 255, 0, ',
    glow: 'rgba(93, 223, 109, ',
    fiber: 'rgba(168, 219, 168, '
  },
  {
    flesh: 'rgba(42, 16, 64, ',
    core: 'rgba(123, 63, 160, ',
    glow: 'rgba(255, 51, 68, ',
    fiber: 'rgba(196, 122, 180, '
  },
  {
    flesh: 'rgba(74, 111, 165, ',
    core: 'rgba(138, 180, 248, ',
    glow: 'rgba(255, 215, 0, ',
    fiber: 'rgba(232, 191, 168, '
  }
];

function generateSoul() {
  currentTheme = themes[Math.floor(Math.random() * themes.length)];
  points = [];
  edges = [];
  
  const archetypes = ['humanoid', 'arachnid', 'serpentine', 'amorphous'];
  const type = archetypes[Math.floor(Math.random() * archetypes.length)];

  if (type === 'humanoid') {
    const rawPoints = [
      { x: 0.5, y: 0.15, role: 'head' },
      { x: 0.5, y: 0.28, role: 'neck' },
      { x: 0.5, y: 0.45, role: 'torso' },
      { x: 0.5, y: 0.65, role: 'pelvis' },
      { x: 0.35, y: 0.28, role: 'shoulder' },
      { x: 0.22, y: 0.38, role: 'elbow' },
      { x: 0.12, y: 0.48, role: 'hand' },
      { x: 0.65, y: 0.28, role: 'shoulder' },
      { x: 0.78, y: 0.38, role: 'elbow' },
      { x: 0.88, y: 0.48, role: 'hand' },
      { x: 0.38, y: 0.68, role: 'hip' },
      { x: 0.32, y: 0.82, role: 'knee' },
      { x: 0.25, y: 0.95, role: 'foot' },
      { x: 0.62, y: 0.68, role: 'hip' },
      { x: 0.68, y: 0.82, role: 'knee' },
      { x: 0.75, y: 0.95, role: 'foot' }
    ];
    rawPoints.forEach(p => {
      const rx = p.x + (Math.random() - 0.5) * 0.06;
      const ry = p.y + (Math.random() - 0.5) * 0.06;
      points.push({
        x: rx * W,
        y: ry * H,
        targetX: rx * W,
        targetY: ry * H,
        baseX: rx * W,
        baseY: ry * H,
        vx: 0,
        vy: 0,
        radius: 4 + Math.random() * 4,
        opacity: 1,
        stress: 0,
        role: p.role,
        eyeSeed: Math.random()
      });
    });
    edges = [
      [0, 1], [1, 2], [2, 3],
      [1, 4], [4, 5], [5, 6],
      [1, 7], [7, 8], [8, 9],
      [3, 10], [10, 11], [11, 12],
      [3, 13], [13, 14], [14, 15],
      [4, 10], [7, 13]
    ];
  } else if (type === 'arachnid') {
    points.push({
      x: 0.5 * W, y: 0.45 * H, targetX: 0.5 * W, targetY: 0.45 * H, baseX: 0.5 * W, baseY: 0.45 * H,
      vx: 0, vy: 0, radius: 9, opacity: 1, stress: 0, role: 'head', eyeSeed: Math.random()
    });
    const legsCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < legsCount; i++) {
      const angle = (i / (legsCount - 1)) * Math.PI + Math.PI * 0.1;
      const length1 = 80 + Math.random() * 40;
      const length2 = 70 + Math.random() * 40;
      const x1 = 0.5 * W + Math.cos(angle) * length1;
      const y1 = 0.5 * H + Math.sin(angle) * length1 * 0.6;
      const x2 = x1 + Math.cos(angle + 0.2) * length2;
      const y2 = y1 + Math.sin(angle + 0.2) * length2 + 20;
      
      points.push({
        x: x1, y: y1, targetX: x1, targetY: y1, baseX: x1, baseY: y1,
        vx: 0, vy: 0, radius: 5, opacity: 1, stress: 0, role: 'limb', eyeSeed: Math.random()
      });
      points.push({
        x: x2, y: y2, targetX: x2, targetY: y2, baseX: x2, baseY: y2,
        vx: 0, vy: 0, radius: 3, opacity: 1, stress: 0, role: 'foot', eyeSeed: Math.random()
      });
      const pIdx = points.length - 2;
      edges.push([0, pIdx]);
      edges.push([pIdx, pIdx + 1]);
    }
  } else if (type === 'serpentine') {
    const segments = 9 + Math.floor(Math.random() * 5);
    for (let i = 0; i < segments; i++) {
      const x = 0.5 * W + Math.sin(i * 0.8) * 35;
      const y = (0.15 + (i / segments) * 0.75) * H;
      points.push({
        x: x, y: y, targetX: x, targetY: y, baseX: x, baseY: y,
        vx: 0, vy: 0, radius: i === 0 ? 8 : 5 - (i / segments) * 2.5,
        opacity: 1, stress: 0, role: i === 0 ? 'head' : 'spine', eyeSeed: Math.random()
      });
      if (i > 0) {
        edges.push([i - 1, i]);
      }
      if (i > 0 && i < segments - 1 && i % 2 === 0) {
        const lx = x - 60 - Math.random() * 30;
        const rx = x + 60 + Math.random() * 30;
        const ly = y + 10;
        const ry = y + 10;
        points.push({
          x: lx, y: ly, targetX: lx, targetY: ly, baseX: lx, baseY: ly,
          vx: 0, vy: 0, radius: 3, opacity: 1, stress: 0, role: 'limb', eyeSeed: Math.random()
        });
        points.push({
          x: rx, y: ry, targetX: rx, targetY: ry, baseX: rx, baseY: ry,
          vx: 0, vy: 0, radius: 3, opacity: 1, stress: 0, role: 'limb', eyeSeed: Math.random()
        });
        const rIdx = points.length - 2;
        edges.push([i, rIdx]);
        edges.push([i, rIdx + 1]);
      }
    }
  } else {
    const nodes = 12 + Math.floor(Math.random() * 6);
    const cx = 0.5 * W;
    const cy = 0.5 * H;
    points.push({
      x: cx, y: cy, targetX: cx, targetY: cy, baseX: cx, baseY: cy,
      vx: 0, vy: 0, radius: 10, opacity: 1, stress: 0, role: 'head', eyeSeed: Math.random()
    });
    for (let i = 1; i < nodes; i++) {
      const angle = (i / (nodes - 1)) * Math.PI * 2;
      const r = 120 + Math.random() * 80;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push({
        x: x, y: y, targetX: x, targetY: y, baseX: x, baseY: y,
        vx: 0, vy: 0, radius: 4 + Math.random() * 4, opacity: 1, stress: 0, role: 'limb', eyeSeed: Math.random()
      });
      edges.push([0, i]);
      if (i > 1) {
        edges.push([i - 1, i]);
      }
    }
    edges.push([nodes - 1, 1]);
  }
}

function initPoints() {
  generateSoul();
}

function resetSoul() {
  clicks = 0;
  soulNum++;
  exploding = false;
  generateSoul();
  updateStats();
}

function updateStats() {
  soulCounter.textContent = `Soul #${soulNum}`;
  clickCounter.textContent = `Changes: ${clicks} / 20`;
  if (clicks >= 15) {
    clickCounter.style.color = 'var(--red-bright)';
    clickCounter.style.textShadow = '0 0 8px var(--red-bright)';
  } else {
    clickCounter.style.color = 'var(--text-muted)';
    clickCounter.style.textShadow = '0 0 6px rgba(138, 180, 248, 0.2)';
  }
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function handlePointerDown(e) {
  if (exploding) return;
  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  
  const pos = getPointerPos(e);
  let closestDist = Infinity;
  let closestPt = null;

  for (let p of points) {
    const dx = p.x - pos.x;
    const dy = p.y - pos.y;
    const dist = dx * dx + dy * dy;
    if (dist < closestDist) {
      closestDist = dist;
      closestPt = p;
    }
  }

  if (closestPt && closestDist < 1600) {
    draggedPoint = closestPt;
    clicks++;
    updateStats();
    distortSurroundings(pos.x, pos.y, 110);
  }
}

function handlePointerMove(e) {
  if (exploding || !draggedPoint || e.pointerId !== activePointerId) return;
  const pos = getPointerPos(e);
  draggedPoint.targetX = Math.max(10, Math.min(W - 10, pos.x));
  draggedPoint.targetY = Math.max(10, Math.min(H - 10, pos.y));
  draggedPoint.stress = Math.min(1, draggedPoint.stress + 0.25);
}

function handlePointerUp(e) {
  if (e.pointerId !== activePointerId) return;
  draggedPoint = null;
  activePointerId = null;
  if (clicks >= 20) {
    startExplosion();
  }
}

function distortSurroundings(mx, my, radius) {
  const r2 = radius * radius;
  points.forEach(p => {
    const dx = p.x - mx;
    const dy = p.y - my;
    const dist = dx * dx + dy * dy;
    if (dist < r2) {
      const force = (1 - Math.sqrt(dist) / radius) * 60;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
      p.targetX = Math.max(10, Math.min(W - 10, p.targetX + Math.cos(angle) * force));
      p.targetY = Math.max(10, Math.min(H - 10, p.targetY + Math.sin(angle) * force));
      p.stress = Math.min(1, p.stress + 0.4);
    }
  });
}

function startExplosion() {
  exploding = true;
  explodeTimer = 0;
  for (let p of points) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = 250 + Math.random() * 400;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 120;
    p.radius = 6 + Math.random() * 8;
  }
}

function update(dt) {
  globalTime += dt;
  if (exploding) {
    explodeTimer += dt;
    const progress = explodeTimer / explodeDuration;
    for (let p of points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.opacity = Math.max(0, 1 - progress);
      p.radius *= (1 - dt * 0.4);
    }
    if (progress >= 1) {
      resetSoul();
    }
    return;
  }

  const speed = 0.12;
  for (let p of points) {
    p.x += (p.targetX - p.x) * speed;
    p.y += (p.targetY - p.y) * speed;
    p.stress = Math.max(0, p.stress - dt * 0.18);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  
  ctx.save();
  if (clicks > 0 && !exploding) {
    const intensity = (clicks / 20) * 4;
    const sx = (Math.random() - 0.5) * intensity;
    const sy = (Math.random() - 0.5) * intensity;
    ctx.translate(sx, sy);
  }

  const pulse = 1 + Math.sin(globalTime * 4.2) * 0.012;
  ctx.translate(W / 2, H / 2);
  ctx.scale(pulse, pulse);
  ctx.translate(-W / 2, -H / 2);

  if (points.length > 2 && currentTheme) {
    ctx.beginPath();
    points.forEach((p, index) => {
      if (p.opacity < 0.05) return;
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = currentTheme.flesh + '0.04)';
    ctx.fill();
  }

  for (let edge of edges) {
    const p1 = points[edge[0]];
    const p2 = points[edge[1]];
    if (p1.opacity < 0.05 || p2.opacity < 0.05) continue;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = currentTheme.flesh + '0.45)';
    ctx.lineWidth = 4 + (p1.stress + p2.stress) * 3;
    ctx.stroke();

    ctx.beginPath();
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const nx = -dy / len;
    const ny = dx / len;
    const offset1 = 5 + Math.sin(globalTime * 8) * 4;
    const offset2 = -5 - Math.cos(globalTime * 8) * 4;
    
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mx + nx * offset1, my + ny * offset1, p2.x, p2.y);
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mx + nx * offset2, my + ny * offset2, p2.x, p2.y);
    ctx.strokeStyle = currentTheme.fiber + '0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  for (let p of points) {
    if (p.opacity < 0.05) continue;
    
    ctx.beginPath();
    const radius = p.radius * p.opacity * (1 + p.stress * 0.5);
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    grad.addColorStop(0, currentTheme.core + (0.95 * p.opacity) + ')');
    grad.addColorStop(0.5, currentTheme.glow + (0.75 * p.opacity) + ')');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.shadowColor = currentTheme.core + '0.6)';
    ctx.shadowBlur = 12 + p.stress * 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (p.stress > 0.15 && !exploding) {
      const eyeSize = 10 * p.stress;
      const blink = Math.sin(globalTime * 5 + p.eyeSeed * 10);
      if (blink > -0.85) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeSize, eyeSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        const lookAngle = Math.atan2(H/2 - p.y, W/2 - p.x) + Math.sin(globalTime * 2 + p.eyeSeed) * 0.3;
        const lx = Math.cos(lookAngle) * (eyeSize * 0.25);
        const ly = Math.sin(lookAngle) * (eyeSize * 0.12);
        ctx.arc(lx, ly, eyeSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.glow + '1.0)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(lx, ly, eyeSize * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0f';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  ctx.restore();
}

let lastTime = 0;
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);

resetBtn.addEventListener('click', () => {
  if (!exploding) resetSoul();
});

initPoints();
updateStats();
loop(0);

function createSoulParticles() {
  const container = document.getElementById('soulParticles');
  const colors = [
    'rgba(74, 106, 165, 0.5)',
    'rgba(123, 63, 160, 0.4)',
    'rgba(138, 180, 248, 0.3)',
    'rgba(58, 122, 74, 0.3)',
    'rgba(196, 145, 122, 0.25)',
    'rgba(139, 26, 26, 0.3)',
  ];

  function spawnParticle() {
    const particle = document.createElement('div');
    particle.classList.add('soul-particle');
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const duration = Math.random() * 6 + 6;
    const delay = Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + '%';
    particle.style.background = `radial-gradient(circle, ${color}, transparent)`;
    particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    container.appendChild(particle);
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < 15; i++) {
    spawnParticle();
  }
  setInterval(() => {
    if (container.children.length < 25) {
      spawnParticle();
    }
  }, 1500);
}

function initCursorTrail() {
  const trail = [];
  const trailLength = 12;
  for (let i = 0; i < trailLength; i++) {
    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.width = (4 - i * 0.25) + 'px';
    dot.style.height = (4 - i * 0.25) + 'px';
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '9999';
    dot.style.transition = 'transform 0.1s ease';
    dot.style.opacity = 0;
    const colors = [
      'rgba(123, 63, 160, 0.6)',
      'rgba(74, 106, 165, 0.5)',
      'rgba(138, 180, 248, 0.4)',
      'rgba(196, 145, 122, 0.4)',
      'rgba(58, 122, 74, 0.3)',
    ];
    dot.style.background = colors[i % colors.length];
    dot.style.boxShadow = `0 0 6px ${colors[i % colors.length]}`;
    document.body.appendChild(dot);
    trail.push({ el: dot, x: 0, y: 0 });
  }
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    trail.forEach(t => t.el.style.opacity = '1');
  });
  document.addEventListener('mouseleave', () => {
    trail.forEach(t => t.el.style.opacity = '0');
  });
  function animateTrail() {
    let prevX = mouseX;
    let prevY = mouseY;
    trail.forEach((dot, i) => {
      const speed = 0.35 - i * 0.02;
      dot.x += (prevX - dot.x) * speed;
      dot.y += (prevY - dot.y) * speed;
      dot.el.style.transform = `translate(${dot.x}px, ${dot.y}px)`;
      prevX = dot.x;
      prevY = dot.y;
    });
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}

function initGlitchFlickers() {
  const panel = document.querySelector('.game-panel');
  function randomFlicker() {
    if (!panel) return;
    panel.style.transition = 'filter 0.05s';
    panel.style.filter = `hue-rotate(${Math.random() * 40 - 20}deg) brightness(${0.8 + Math.random() * 0.4})`;
    setTimeout(() => {
      panel.style.filter = 'none';
      panel.style.transition = 'filter 0.5s';
    }, 80);
    const nextDelay = 4000 + Math.random() * 10000;
    setTimeout(randomFlicker, nextDelay);
  }
  setTimeout(randomFlicker, 6000);
}

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('copy', (e) => e.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  createSoulParticles();
  initCursorTrail();
  initGlitchFlickers();
  console.log(
    '%c🜁 Mahito\'s Playground %c— Transform the soul.',
    'color: #7b3fa0; font-size: 18px; font-weight: bold;',
    'color: #7a7080; font-size: 12px; font-style: italic;'
  );
});