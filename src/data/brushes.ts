import type { BrushId, Stroke, StrokePoint } from '../types';

export const brushes: { id: BrushId; name: string; icon: string }[] = [
  { id: 'pencil', name: 'Pencil', icon: '✎' }, { id: 'colored-pencil', name: 'Color pencil', icon: '✐' },
  { id: 'soft-pencil', name: 'Soft pencil', icon: '✏' }, { id: 'fine-liner', name: 'Fine liner', icon: '╱' },
  { id: 'marker', name: 'Marker', icon: '▰' }, { id: 'chisel-marker', name: 'Chisel marker', icon: '◩' },
  { id: 'brush-pen', name: 'Brush pen', icon: '🖌' }, { id: 'watercolor', name: 'Watercolor', icon: '◉' },
  { id: 'crayon', name: 'Crayon', icon: '▧' }, { id: 'chalk', name: 'Chalk', icon: '▤' },
  { id: 'pastel', name: 'Pastel', icon: '◌' }, { id: 'glitter', name: 'Glitter', icon: '✦' },
  { id: 'spray', name: 'Spray', icon: '⁙' }, { id: 'stamp', name: 'Bubble stamp', icon: '○' },
  { id: 'calligraphy', name: 'Calligraphy', icon: '⌁' }, { id: 'rainbow', name: 'Rainbow', icon: '🌈' },
  { id: 'dotted', name: 'Dotted', icon: '⋯' }, { id: 'dashed', name: 'Dashed', icon: '┄' },
  { id: 'zigzag', name: 'Zigzag', icon: '⌇' }, { id: 'neon', name: 'Neon glow', icon: '✧' },
];

const seeded = (value: number) => {
  const n = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return n - Math.floor(n);
};

export function strokePath(ctx: CanvasRenderingContext2D, points: StrokePoint[]) {
  ctx.beginPath();
  if (points.length === 1) {
    ctx.moveTo(points[0].x * 1000, points[0].y * 750);
    ctx.lineTo(points[0].x * 1000 + 0.01, points[0].y * 750 + 0.01);
    return;
  }
  ctx.moveTo(points[0].x * 1000, points[0].y * 750);
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    ctx.quadraticCurveTo(a.x * 1000, a.y * 750, (a.x + b.x) * 500, (a.y + b.y) * 375);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x * 1000, last.y * 750);
}

function drawCalligraphy(ctx: CanvasRenderingContext2D, points: StrokePoint[], width: number, color: string) {
  if (points.length === 1) {
    ctx.beginPath(); ctx.arc(points[0].x * 1000, points[0].y * 750, width * .35, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    return;
  }
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i];
    const dx = (to.x - from.x) * 1000, dy = (to.y - from.y) * 750;
    ctx.beginPath(); ctx.moveTo(from.x * 1000, from.y * 750); ctx.lineTo(to.x * 1000, to.y * 750);
    ctx.lineWidth = width * (.24 + Math.abs(Math.cos(Math.atan2(dy, dx))) * .92);
    ctx.strokeStyle = color; ctx.stroke();
  }
}

function drawBubbleStamps(ctx: CanvasRenderingContext2D, points: StrokePoint[], width: number, color: string) {
  const spacing = Math.max(8, width * 1.35);
  let distanceToNext = 0;
  const stamp = (x: number, y: number) => {
    ctx.beginPath(); ctx.arc(x, y, Math.max(2, width * .34), 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha *= .52; ctx.fill(); ctx.globalAlpha /= .52;
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, width * .11); ctx.stroke();
  };
  if (points.length === 1) { stamp(points[0].x * 1000, points[0].y * 750); return; }
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i];
    const x1 = from.x * 1000, y1 = from.y * 750, dx = (to.x - from.x) * 1000, dy = (to.y - from.y) * 750;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    let position = distanceToNext;
    while (position <= length) {
      const t = position / length; stamp(x1 + dx * t, y1 + dy * t); position += spacing;
    }
    distanceToNext = position - length;
  }
}

function drawZigzag(ctx: CanvasRenderingContext2D, points: StrokePoint[], width: number) {
  if (points.length === 1) { ctx.beginPath(); ctx.arc(points[0].x * 1000, points[0].y * 750, width * .3, 0, Math.PI * 2); ctx.fill(); return; }
  ctx.beginPath();
  let hasPoint = false;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i];
    const x1 = from.x * 1000, y1 = from.y * 750, dx = (to.x - from.x) * 1000, dy = (to.y - from.y) * 750;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const count = Math.max(1, Math.ceil(length / Math.max(5, width * .7)));
    for (let step = 0; step <= count; step++) {
      const t = step / count, offset = (step % 2 ? 1 : -1) * width * .28;
      const x = x1 + dx * t - dy / length * offset, y = y1 + dy * t + dx / length * offset;
      if (!hasPoint) { ctx.moveTo(x, y); hasPoint = true; } else ctx.lineTo(x, y);
    }
  }
  if (hasPoint) ctx.stroke();
}

function drawPressureBrush(ctx: CanvasRenderingContext2D, points: StrokePoint[], width: number, color: string) {
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (points.length === 1) {
    ctx.beginPath(); ctx.arc(points[0].x * 1000, points[0].y * 750, width * points[0].pressure * .55, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); return;
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    ctx.beginPath(); ctx.moveTo(a.x * 1000, a.y * 750); ctx.lineTo(b.x * 1000, b.y * 750);
    ctx.lineWidth = width * (.35 + ((a.pressure + b.pressure) / 2) * 1.3); ctx.stroke();
  }
}

export function drawBrush(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const points = stroke.points;
  if (!points.length) return;
  const id = stroke.brush ?? 'marker';
  const color = stroke.erase ? '#000' : stroke.color;
  const pressure = points.reduce((total, p) => total + p.pressure, 0) / points.length;
  const width = Math.max(2, stroke.width * Math.max(.35, pressure));
  const originalAlpha = ctx.globalAlpha;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.lineWidth = width; strokePath(ctx, points);
  if (points.length === 1) ctx.lineTo(points[0].x * 1000 + .01, points[0].y * 750 + .01);

  if (id === 'rainbow' && !stroke.erase) {
    const hues = ['#ff4f67','#ff9d38','#ffdc46','#55bc69','#42b9bb','#558de8','#a16cdb'];
    for (let i = 1; i < points.length; i++) {
      ctx.beginPath(); ctx.moveTo(points[i - 1].x * 1000, points[i - 1].y * 750); ctx.lineTo(points[i].x * 1000, points[i].y * 750);
      ctx.strokeStyle = hues[i % hues.length]; ctx.lineWidth = width; ctx.stroke();
    }
  } else {
    switch (id) {
      case 'pencil': ctx.globalAlpha = .68; ctx.lineWidth = Math.max(1.4, width * .42); ctx.stroke(); break;
      case 'colored-pencil': ctx.globalAlpha = .78; ctx.lineWidth = width * .72; ctx.stroke(); ctx.globalAlpha = .24; ctx.lineWidth = width * .34; ctx.strokeStyle = '#fff'; ctx.stroke(); break;
      case 'soft-pencil': ctx.globalAlpha = .38; ctx.shadowColor = color; ctx.shadowBlur = width * .5; ctx.stroke(); break;
      case 'fine-liner': ctx.lineWidth = Math.max(1.5, width * .26); ctx.stroke(); break;
      case 'marker': ctx.globalAlpha = .68; ctx.stroke(); break;
      case 'chisel-marker': ctx.lineWidth = width * 1.3; ctx.lineCap = 'butt'; ctx.globalAlpha = .6; ctx.stroke(); break;
      case 'brush-pen': drawPressureBrush(ctx, points, width, color); break;
      case 'watercolor': ctx.globalAlpha = .18; ctx.lineWidth = width * 1.9; ctx.stroke(); ctx.globalAlpha = .12; ctx.lineWidth = width * 1.25; ctx.stroke(); break;
      case 'crayon': ctx.globalAlpha = .86; ctx.stroke(); ctx.globalAlpha = .28; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1,width * .16); ctx.setLineDash([2, 5]); ctx.stroke(); break;
      case 'chalk': ctx.globalAlpha = .65; ctx.setLineDash([width * .42, width * .16]); ctx.stroke(); break;
      case 'pastel': ctx.globalAlpha = .32; ctx.shadowColor = color; ctx.shadowBlur = width * .4; ctx.lineWidth = width * 1.4; ctx.stroke(); break;
      case 'glitter': ctx.globalAlpha = .6; ctx.stroke(); ctx.globalAlpha = 1; scatter(ctx, points, width * 1.1, color, 'sparkle'); break;
      case 'spray': ctx.globalAlpha = .13; ctx.lineWidth = width * 2; ctx.stroke(); scatter(ctx, points, width * 2.8, color, 'spray'); break;
      case 'stamp': ctx.globalAlpha = .85; drawBubbleStamps(ctx, points, width, color); break;
      case 'calligraphy': ctx.globalAlpha = .9; drawCalligraphy(ctx, points, width, color); break;
      case 'dotted': ctx.globalAlpha = .9; ctx.lineWidth = width * .45; ctx.setLineDash([.1, width * 1.1]); ctx.stroke(); break;
      case 'dashed': ctx.globalAlpha = .9; ctx.setLineDash([width * 1.5, width * .65]); ctx.stroke(); break;
      case 'zigzag': ctx.globalAlpha = .85; drawZigzag(ctx, points, width); break;
      case 'neon': ctx.globalAlpha = .96; ctx.shadowColor = color; ctx.shadowBlur = width * 1.8; ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.globalAlpha = .55; ctx.lineWidth = Math.max(1,width * .22); ctx.stroke(); break;
    }
    ctx.setLineDash([]);
    if (id === 'crayon' && !stroke.erase) scatter(ctx, points, width * .42, '#fff', 'grain');
  }
  ctx.restore(); ctx.globalAlpha = originalAlpha;
}

function scatter(ctx: CanvasRenderingContext2D, points: StrokePoint[], radius: number, color: string, kind: 'sparkle'|'spray'|'grain') {
  const stride = kind === 'spray' ? 2 : 1;
  for (let i = 0; i < points.length; i += stride) {
    const p = points[i], x = p.x * 1000, y = p.y * 750;
    const count = kind === 'spray' ? 10 : kind === 'sparkle' ? 2 : 4;
    for (let j = 0; j < count; j++) {
      const seed = (i + 1) * (j + 13) + x * .7 + y * 1.1;
      const angle = seeded(seed) * Math.PI * 2;
      const distance = seeded(seed + 9) * radius;
      const size = kind === 'sparkle' ? 1.8 + seeded(seed + 2) * 2.8 : kind === 'spray' ? 1 + seeded(seed + 2) * 2.4 : 1 + seeded(seed + 2) * 1.4;
      ctx.beginPath(); ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, size, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    }
  }
}
