const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soulCounter = document.getElementById('soulCounter');
const clickCounter = document.getElementById('clickCounter');
const resetBtn = document.getElementById('resetBtn');

const simplex = new SimplexNoise();

canvas.width = 600;
canvas.height = 600;

const W = canvas.width;
const H = canvas.height;

let points = [];
let springs = [];
let clicks = 0;
let soulNum = 1;
let exploding = false;
let explodeTimer = 0;
const explodeDuration = 2.0;

let draggedPoint = null;
let currentTheme = null;
let globalTime = 0;
let activePointerId = null;

const themes = [
  {
    flesh: 'rgba(165, 42, 42, ',
    core: 'rgba(147, 112, 219, ',
    glow: 'rgba(0, 206, 209, ',
    fiber: 'rgba(240, 128, 128, '
  },
  {
    flesh: 'rgba(46, 139, 87, ',
    core: 'rgba(50, 205, 50, ',
    glow: 'rgba(173, 255, 47, ',
    fiber: 'rgba(143, 188, 143, '
  },
  {
    flesh: 'rgba(75, 0, 130, ',
    core: 'rgba(138, 43, 226, ',
    glow: 'rgba(255, 20, 147, ',
    fiber: 'rgba(218, 112, 214, '
  },
  {
    flesh: 'rgba(70, 130, 180, ',
    core: 'rgba(30, 144, 255, ',
    glow: 'rgba(255, 215, 0, ',
    fiber: 'rgba(255, 160, 122, '
  }
];

function generateSoul() {
  currentTheme = themes[Math.floor(Math.random() * themes.length)];
  points = [];
  springs = [];
  
  const archetypes = ['humanoid', 'chimera', 'cluster', 'serpent'];
  const type = archetypes[Math.floor(Math.random() * archetypes.length)];

  if (type === 'humanoid') {
    const raw = [
      { x: 0.5, y: 0.15, r: 24, name: 'head' },
      { x: 0.5, y: 0.30, r: 18, name: 'neck' },
      { x: 0.5, y: 0.48, r: 35, name: 'torso' },
      { x: 0.32, y: 0.32, r: 14, name: 'lshoulder' },
      { x: 0.20, y: 0.44, r: 12, name: 'lelbow' },
      { x: 0.10, y: 0.56, r: 10, name: 'lhand' },
      { x: 0.68, y: 0.32, r: 14, name: 'rshoulder' },
      { x: 0.80, y: 0.44, r: 12, name: 'relbow' },
      { x: 0.90, y: 0.56, r: 10, name: 'rhand' },
      { x: 0.5, y: 0.68, r: 28, name: 'pelvis' },
      { x: 0.38, y: 0.80, r: 15, name: 'lknee' },
      { x: 0.32, y: 0.94, r: 12, name: 'lfoot' },
      { x: 0.62, y: 0.80, r: 15, name: 'rknee' },
      { x: 0.68, y: 0.94, r: 12, name: 'rfoot' }
    ];

    raw.forEach((p, idx) => {
      const rx = (p.x + (Math.random() - 0.5) * 0.04) * W;
      const ry = (p.y + (Math.random() - 0.5) * 0.04) * H;
      points.push({
        id: idx,
        x: rx,
        y: ry,
        px: rx,
        py: ry,
        ox: rx,
        oy: ry,
        vx: 0,
        vy: 0,
        baseRadius: p.r,
        radius: p.r,
        opacity: 1,
        noiseSeed: Math.random() * 1000,
        mass: p.r * 0.8
      });
    });

    const connections = [
      [0, 1], [1, 2], [2, 9],
      [1, 3], [3, 4], [4, 5],
      [1, 6], [6, 7], [7, 8],
      [9, 10], [10, 11],
      [9, 12], [12, 13],
      [3, 6], [3, 9], [6, 9]
    ];

    connections.forEach(([a, b]) => {
      const dx = points[a].x - points[b].x;
      const dy = points[a].y - points[b].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      springs.push({ a, b, length: len, stiffness: 0.35 });
    });

  } else if (type === 'chimera') {
    const centerPointsCount = 5;
    for (let i = 0; i < centerPointsCount; i++) {
      const angle = (i / centerPointsCount) * Math.PI * 2;
      const rx = W / 2 + Math.cos(angle) * 45;
      const ry = H / 2 + Math.sin(angle) * 45;
      points.push({
        id: i,
        x: rx,
        y: ry,
        px: rx,
        py: ry,
        ox: rx,
        oy: ry,
        vx: 0,
        vy: 0,
        baseRadius: 22 + Math.random() * 10,
        radius: 22,
        opacity: 1,
        noiseSeed: Math.random() * 1000,
        mass: 30
      });
    }

    for (let i = 0; i < centerPointsCount; i++) {
      for (let j = i + 1; j < centerPointsCount; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        springs.push({ a: i, b: j, length: Math.sqrt(dx * dx + dy * dy), stiffness: 0.4 });
      }
    }

    const limbsCount = 6 + Math.floor(Math.random() * 5);
    let pId = centerPointsCount;
    for (let i = 0; i < limbsCount; i++) {
      const rootIdx = Math.floor(Math.random() * centerPointsCount);
      const angle = (i / limbsCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const segs = 2 + Math.floor(Math.random() * 3);
      let prevIdx = rootIdx;
      
      for (let s = 0; s < segs; s++) {
        const length = 50 + Math.random() * 35;
        const rx = points[prevIdx].x + Math.cos(angle) * length;
        const ry = points[prevIdx].y + Math.sin(angle) * length;
        points.push({
          id: pId,
          x: rx,
          y: ry,
          px: rx,
          py: ry,
          ox: rx,
          oy: ry,
          vx: 0,
          vy: 0,
          baseRadius: 18 - s * 4,
          radius: 18 - s * 4,
          opacity: 1,
          noiseSeed: Math.random() * 1000,
          mass: 15 - s * 2
        });
        springs.push({ a: prevIdx, b: pId, length: length, stiffness: 0.25 });
        prevIdx = pId;
        pId++;
      }
    }

  } else if (type === 'cluster') {
    const numCircles = 9 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numCircles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 110;
      const rx = W / 2 + Math.cos(angle) * dist;
      const ry = H / 2 + Math.sin(angle) * dist;
      const size = 18 + Math.random() * 22;
      points.push({
        id: i,
        x: rx,
        y: ry,
        px: rx,
        py: ry,
        ox: rx,
        oy: ry,
        vx: 0,
        vy: 0,
        baseRadius: size,
        radius: size,
        opacity: 1,
        noiseSeed: Math.random() * 1000,
        mass: size * 0.9
      });
    }

    for (let i = 0; i < numCircles; i++) {
      let nearest = [];
      for (let j = 0; j < numCircles; j++) {
        if (i === j) continue;
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        nearest.push({ id: j, dist });
      }
      nearest.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < Math.min(3, nearest.length); k++) {
        const target = nearest[k].id;
        if (!springs.some(s => (s.a === i && s.b === target) || (s.a === target && s.b === i))) {
          springs.push({ a: i, b: target, length: nearest[k].dist, stiffness: 0.3 });
        }
      }
    }
  } else {
    const segs = 12 + Math.floor(Math.random() * 7);
    let prevIdx = -1;
    for (let i = 0; i < segs; i++) {
      const rx = W / 2 + Math.sin(i * 0.5) * 40;
      const ry = (0.15 + (i / segs) * 0.7) * H;
      const size = 26 - (i / segs) * 16;
      points.push({
        id: i,
        x: rx,
        y: ry,
        px: rx,
        py: ry,
        ox: rx,
        oy: ry,
        vx: 0,
        vy: 0,
        baseRadius: size,
        radius: size,
        opacity: 1,
        noiseSeed: Math.random() * 1000,
        mass: size * 1.1
      });
      if (prevIdx !== -1) {
        const dx = points[i].x - points[prevIdx].x;
        const dy = points[i].y - points[prevIdx].y;
        springs.push({ a: prevIdx, b: i, length: Math.sqrt(dx * dx + dy * dy), stiffness: 0.45 });
      }
      prevIdx = i;
    }

    for (let i = 2; i < segs - 2; i += 2) {
      if (Math.random() > 0.3) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const len = 65 + Math.random() * 40;
        const rx = points[i].x + side * len;
        const ry = points[i].y + 15;
        const pId = points.length;
        points.push({
          id: pId,
          x: rx,
          y: ry,
          px: rx,
          py: ry,
          ox: rx,
          oy: ry,
          vx: 0,
          vy: 0,
          baseRadius: 8,
          radius: 8,
          opacity: 1,
          noiseSeed: Math.random() * 1000,
          mass: 8
        });
        springs.push({ a: i, b: pId, length: len, stiffness: 0.2 });
      }
    }
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

  if (closestPt && closestDist < 2500) {
    draggedPoint = closestPt;
    clicks++;
    updateStats();
    distortSurroundings(pos.x, pos.y, 140);
  }
}

function handlePointerMove(e) {
  if (exploding || !draggedPoint || e.pointerId !== activePointerId) return;
  const pos = getPointerPos(e);
  draggedPoint.x = Math.max(10, Math.min(W - 10, pos.x));
  draggedPoint.y = Math.max(10, Math.min(H - 10, pos.y));
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
  const inst = clicks / 20;
  points.forEach(p => {
    if (p === draggedPoint) return;
    const dx = p.x - mx;
    const dy = p.y - my;
    const dist = dx * dx + dy * dy;
    if (dist < r2) {
      const force = (1 - Math.sqrt(dist) / radius) * (70 + inst * 120);
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * (1.2 + inst * 2);
      p.x = Math.max(10, Math.min(W - 10, p.x + Math.cos(angle) * force));
      p.y = Math.max(10, Math.min(H - 10, p.y + Math.sin(angle) * force));
    }
  });
}

function startExplosion() {
  exploding = true;
  explodeTimer = 0;
  for (let p of points) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = 200 + Math.random() * 500;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 150;
  }
}

function update(dt) {
  globalTime += dt;
  const inst = clicks / 20;

  if (exploding) {
    explodeTimer += dt;
    const progress = explodeTimer / explodeDuration;
    for (let p of points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.opacity = Math.max(0, 1 - progress);
    }
    if (progress >= 1) {
      resetSoul();
    }
    return;
  }

  for (let step = 0; step < 6; step++) {
    for (let s of springs) {
      const p1 = points[s.a];
      const p2 = points[s.b];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      const diff = s.length - dist;
      const percent = (diff / dist) * s.stiffness * 0.5;
      const ox = dx * percent;
      const oy = dy * percent;

      if (p1 !== draggedPoint) {
        p1.x -= ox;
        p1.y -= oy;
      }
      if (p2 !== draggedPoint) {
        p2.x += ox;
        p2.y += oy;
      }
    }
  }

  const noiseFreq = 0.8 + inst * 3.5;
  const noiseAmp = inst * 45;
  
  points.forEach((p) => {
    if (p === draggedPoint) return;
    const nx = simplex.noise2D(p.noiseSeed, globalTime * noiseFreq) * noiseAmp;
    const ny = simplex.noise2D(p.noiseSeed + 500, globalTime * noiseFreq) * noiseAmp;
    p.x += nx * dt * 4;
    p.y += ny * dt * 4;

    const pullX = (p.ox - p.x) * 0.15;
    const pullY = (p.oy - p.y) * 0.15;
    p.x += pullX * dt * (1 - inst * 0.85);
    p.y += pullY * dt * (1 - inst * 0.85);

    p.x = Math.max(10, Math.min(W - 10, p.x));
    p.y = Math.max(10, Math.min(H - 10, p.y));

    p.radius = p.baseRadius * (1 + simplex.noise2D(p.noiseSeed + 1000, globalTime * (2 + inst * 4)) * (0.1 + inst * 0.5));
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  
  ctx.save();
  const inst = clicks / 20;

  if (clicks > 0 && !exploding) {
    const intensity = inst * 14;
    const sx = (Math.random() - 0.5) * intensity;
    const sy = (Math.random() - 0.5) * intensity;
    ctx.translate(sx, sy);
  }

  const pulse = 1 + Math.sin(globalTime * (3 + inst * 6)) * (0.01 + inst * 0.04);
  ctx.translate(W / 2, H / 2);
  ctx.scale(pulse, pulse);
  ctx.translate(-W / 2, -H / 2);

  if (points.length > 0 && currentTheme) {
    ctx.beginPath();
    points.forEach((p, index) => {
      if (p.opacity < 0.05) return;
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    
    const fleshBaseAlpha = 0.08 + inst * 0.12;
    const finalFleshColor = inst > 0.7 
      ? `rgba(${139 + (inst - 0.7) * 350}, 26, 26, ${fleshBaseAlpha})`
      : currentTheme.flesh + fleshBaseAlpha + ')';
      
    ctx.fillStyle = finalFleshColor;
    ctx.fill();
  }

  for (let s of springs) {
    const p1 = points[s.a];
    const p2 = points[s.b];
    if (p1.opacity < 0.05 || p2.opacity < 0.05) continue;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    
    const baseW = (p1.radius + p2.radius) * 0.35;
    ctx.lineWidth = baseW * (1 + inst * 0.5);
    
    const finalFleshColor = inst > 0.75
      ? `rgba(180, 20, 20, ${0.45 + inst * 0.3})`
      : currentTheme.flesh + '0.45)';
    ctx.strokeStyle = finalFleshColor;
    ctx.stroke();

    ctx.beginPath();
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const nx = -dy / len;
    const ny = dx / len;
    const offset1 = (10 + Math.sin(globalTime * 12) * 8) * (1 + inst * 2);
    const offset2 = (-10 - Math.cos(globalTime * 12) * 8) * (1 + inst * 2);
    
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mx + nx * offset1, my + ny * offset1, p2.x, p2.y);
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mx + nx * offset2, my + ny * offset2, p2.x, p2.y);
    
    const finalFiberColor = inst > 0.8
      ? `rgba(255, 50, 50, ${0.25 + inst * 0.3})`
      : currentTheme.fiber + '0.25)';
    ctx.strokeStyle = finalFiberColor;
    ctx.lineWidth = 1.5 + inst * 2;
    ctx.stroke();
  }

  for (let p of points) {
    if (p.opacity < 0.05) continue;
    
    ctx.beginPath();
    const radius = Math.max(2, p.radius * p.opacity);
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    
    const glowColor = inst > 0.8 
      ? `rgba(255, 0, 50, `
      : currentTheme.glow;

    const coreColor = inst > 0.8
      ? `rgba(100, 0, 20, `
      : currentTheme.core;

    grad.addColorStop(0, coreColor + (0.95 * p.opacity) + ')');
    grad.addColorStop(0.5, glowColor + (0.75 * p.opacity) + ')');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    
    ctx.shadowColor = glowColor + '0.65)';
    ctx.shadowBlur = (12 + inst * 30) * p.opacity;
    ctx.fill();
    ctx.shadowBlur = 0;
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