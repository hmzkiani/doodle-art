import type { BackgroundId, ShapeAction, StickerAction } from '../types';

const TAU = Math.PI * 2;
const shapes: { id: ShapeAction['shape']; name: string; icon: string }[] = [
  { id: 'circle', name: 'Circle', icon: '◯' }, { id: 'ellipse', name: 'Oval', icon: '⬭' },
  { id: 'rectangle', name: 'Rectangle', icon: '▭' }, { id: 'rounded-rectangle', name: 'Rounded box', icon: '▢' },
  { id: 'square', name: 'Square', icon: '□' }, { id: 'triangle', name: 'Triangle', icon: '△' },
  { id: 'right-triangle', name: 'Right triangle', icon: '◿' }, { id: 'diamond', name: 'Diamond', icon: '◇' },
  { id: 'pentagon', name: 'Pentagon', icon: '⬠' }, { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
  { id: 'star', name: 'Star', icon: '☆' }, { id: 'heart', name: 'Heart', icon: '♡' },
  { id: 'line', name: 'Straight line', icon: '／' }, { id: 'dashed-line', name: 'Dashed line', icon: '┄' },
  { id: 'arrow', name: 'Arrow', icon: '➜' }, { id: 'curve', name: 'Curved line', icon: '⌒' },
  { id: 'arc', name: 'Arc', icon: '⌢' }, { id: 'cloud', name: 'Cloud', icon: '☁' },
  { id: 'speech-bubble', name: 'Speech bubble', icon: '▱' }, { id: 'free-curve', name: 'Free curve', icon: '〰' },
];
export const shapeChoices = shapes;

export function drawShape(ctx: CanvasRenderingContext2D, action: ShapeAction, preview = false) {
  const px = action.start.x * 1000, py = action.start.y * 750;
  const qx = action.end.x * 1000, qy = action.end.y * 750;
  let x = Math.min(px, qx), y = Math.min(py, qy), w = Math.max(1, Math.abs(qx - px)), h = Math.max(1, Math.abs(qy - py));
  if (action.shape === 'circle' || action.shape === 'square') {
    const side = Math.max(w, h); x = qx >= px ? px : px - side; y = qy >= py ? py : py - side; w = h = side;
  }
  const cx = x + w / 2, cy = y + h / 2;
  const closed = !['line', 'dashed-line', 'arrow', 'curve', 'arc', 'free-curve'].includes(action.shape);
  const path = new Path2D();
  const poly = (points: Array<[number, number]>) => { path.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([a, b]) => path.lineTo(a, b)); path.closePath(); };
  const regular = (count: number, rotation = -Math.PI / 2, inner = 1) => {
    const points: Array<[number, number]> = [];
    for (let i = 0; i < count * (inner < 1 ? 2 : 1); i++) {
      const a = rotation + i * Math.PI * 2 / (count * (inner < 1 ? 2 : 1)); const r = (i % 2 && inner < 1 ? inner : 1);
      points.push([cx + Math.cos(a) * w * .48 * r, cy + Math.sin(a) * h * .48 * r]);
    }
    poly(points);
  };
  switch (action.shape) {
    case 'circle': case 'ellipse': path.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); break;
    case 'rectangle': case 'square': path.rect(x, y, w, h); break;
    case 'rounded-rectangle': path.roundRect(x, y, w, h, Math.min(30, w / 6, h / 6)); break;
    case 'triangle': poly([[cx, y], [x + w, y + h], [x, y + h]]); break;
    case 'right-triangle': poly([[x, y], [x, y + h], [x + w, y + h]]); break;
    case 'diamond': poly([[cx, y], [x + w, cy], [cx, y + h], [x, cy]]); break;
    case 'pentagon': regular(5); break;
    case 'hexagon': regular(6, 0); break;
    case 'star': regular(5, -Math.PI / 2, .46); break;
    case 'heart': path.moveTo(cx, y + h * .88); path.bezierCurveTo(x - w * .08, y + h * .52, x - w * .06, y + h * .12, x + w * .27, y + h * .12); path.bezierCurveTo(cx, y + h * .12, cx, y + h * .38, cx, y + h * .38); path.bezierCurveTo(cx, y + h * .38, cx, y + h * .12, x + w * .73, y + h * .12); path.bezierCurveTo(x + w * 1.06, y + h * .12, x + w * 1.08, y + h * .52, cx, y + h * .88); path.closePath(); break;
    case 'line': case 'dashed-line': path.moveTo(px, py); path.lineTo(qx, qy); break;
    case 'arrow': {
      const angle = Math.atan2(qy - py, qx - px), head = Math.min(35, Math.max(14, w * .12));
      path.moveTo(px, py); path.lineTo(qx, qy); path.moveTo(qx - head * Math.cos(angle - .55), qy - head * Math.sin(angle - .55)); path.lineTo(qx, qy); path.lineTo(qx - head * Math.cos(angle + .55), qy - head * Math.sin(angle + .55)); break;
    }
    case 'curve': path.moveTo(px, py); path.quadraticCurveTo(cx + (py < qy ? -w : w) * .18, cy - h * .65, qx, qy); break;
    case 'free-curve': path.moveTo(px, py); path.bezierCurveTo(cx - w * .65, cy - h * .8, cx + w * .65, cy + h * .8, qx, qy); break;
    case 'arc': path.moveTo(x, cy + h * .1); path.bezierCurveTo(x, y - h * .12, x + w, y - h * .12, x + w, cy + h * .1); break;
    case 'cloud': path.moveTo(x + w * .16, y + h * .76); path.bezierCurveTo(x - w * .08, y + h * .7, x + w * .02, y + h * .42, x + w * .24, y + h * .42); path.bezierCurveTo(x + w * .25, y + h * .08, x + w * .59, y + h * .05, x + w * .67, y + h * .35); path.bezierCurveTo(x + w * .97, y + h * .25, x + w * 1.05, y + h * .7, x + w * .82, y + h * .76); path.closePath(); break;
    case 'speech-bubble': path.roundRect(x, y, w, h * .78, Math.min(28, w / 7, h / 7)); path.moveTo(x + w * .28, y + h * .78); path.lineTo(x + w * .18, y + h); path.lineTo(x + w * .48, y + h * .78); break;
  }
  ctx.save(); ctx.beginPath(); ctx.strokeStyle = action.color; ctx.fillStyle = action.fillColor; ctx.lineWidth = Math.max(2, action.width); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash(action.shape === 'dashed-line' ? [action.width * 2.2, action.width * 1.4] : []);
  if (closed && action.mode !== 'outline') { ctx.fill(path); }
  if (action.mode !== 'filled' || !closed) ctx.stroke(path);
  if (preview) { ctx.globalAlpha = .55; ctx.setLineDash([9, 7]); ctx.lineWidth = Math.max(2, action.width * .7); ctx.stroke(path); }
  ctx.restore();
}

export const backgroundChoices: { id: BackgroundId; title: string; color: string; icon: string }[] = [
  { id: 'paper', title: 'White paper', color: '#fffef9', icon: '□' }, { id: 'cream', title: 'Cream', color: '#fff0cb', icon: '◻' },
  { id: 'sky', title: 'Sky', color: '#dff5ff', icon: '☁' }, { id: 'grass', title: 'Grass', color: '#e8f8d6', icon: '✿' },
  { id: 'ocean', title: 'Ocean', color: '#dcf7fa', icon: '≈' }, { id: 'space', title: 'Space', color: '#292d56', icon: '✦' },
  { id: 'rainbow', title: 'Rainbow', color: '#fff3e7', icon: '🌈' }, { id: 'lavender', title: 'Lavender', color: '#f2eafa', icon: '✧' },
  { id: 'peach', title: 'Peach', color: '#fff0e7', icon: '●' }, { id: 'mint', title: 'Mint', color: '#e5f7ed', icon: '❀' },
];

export function drawBackground(ctx: CanvasRenderingContext2D, id: BackgroundId) {
  const colors: Record<BackgroundId, string> = { paper: '#fffef9', cream: '#fff0cb', sky: '#dff5ff', grass: '#e8f8d6', ocean: '#dcf7fa', space: '#292d56', rainbow: '#fff3e7', lavender: '#f2eafa', peach: '#fff0e7', mint: '#e5f7ed' };
  ctx.fillStyle = colors[id]; ctx.fillRect(0, 0, 1000, 750);
  ctx.save(); ctx.lineCap = 'round';
  if (id === 'sky') {
    ctx.fillStyle = '#fff'; [[145, 120, 65], [810, 190, 54], [570, 88, 37]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x,y,r*.36,0,TAU);ctx.arc(x+r*.33,y-r*.16,r*.48,0,TAU);ctx.arc(x+r*.75,y,r*.32,0,TAU);ctx.fill(); });
  } else if (id === 'grass') {
    ctx.fillStyle = '#b8df91'; ctx.fillRect(0, 655, 1000, 95);
    for (let x = 25; x < 1000; x += 33) { ctx.strokeStyle = '#8bc675'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 750); ctx.quadraticCurveTo(x - 6, 700, x + 7, 680 + (x % 27)); ctx.stroke(); }
  } else if (id === 'ocean') {
    ctx.fillStyle = '#b4e8f0'; ctx.fillRect(0, 630, 1000, 120);
    ctx.strokeStyle = '#8bd3df'; ctx.lineWidth = 7;
    for(let y=665;y<740;y+=34){ctx.beginPath();for(let x=0;x<=1000;x+=25){const yy=y+Math.sin((x+y)*.018)*8;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy)}ctx.stroke()}
  } else if (id === 'space') {
    ctx.fillStyle = '#fff2a8'; for(let i=0;i<34;i++){const x=(i*197+61)%970+15,y=(i*113+42)%700+20,r=i%4===0?5:2.5;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
  } else if (id === 'rainbow') {
    const cols=['#ef7069','#f7b846','#f4d75d','#69be91','#61add3','#917fd1'];
    cols.forEach((color,i)=>{ctx.beginPath();ctx.lineWidth=18;ctx.strokeStyle=color;ctx.arc(500,780,310+i*19,Math.PI,TAU);ctx.stroke()});
  }
  ctx.restore();
}

type StickerGroup = 'Sparkles' | 'Happy faces' | 'Nature' | 'Sky' | 'Animals' | 'Things that go' | 'Space' | 'Party';
export type StickerInfo = { id: string; name: string; group: StickerGroup; svg: string };
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
export const stickers: StickerInfo[] = [
  { id: 'star', name: 'Star pal', group: 'Sparkles', svg: svg('<path d="m50 5 12 29 31 2-24 20 8 31-27-17-27 17 8-31L7 36l31-2z" fill="#ffd24d" stroke="#5b5361" stroke-width="4" stroke-linejoin="round"/><circle cx="41" cy="48" r="3"/><circle cx="59" cy="48" r="3"/><path d="M43 58q7 8 14 0" fill="none" stroke="#e76d65" stroke-width="3" stroke-linecap="round"/>') },
  { id: 'sparkle', name: 'Twinkle', group: 'Sparkles', svg: svg('<path d="M50 4 59 39 95 50 59 60 50 96 40 60 5 50 40 39z" fill="#9e86e8" stroke="#5b5361" stroke-width="4" stroke-linejoin="round"/><circle cx="70" cy="25" r="5" fill="#ffd24d"/>') },
  { id: 'heart', name: 'Happy heart', group: 'Happy faces', svg: svg('<path d="M50 89 15 56C-4 34 26 8 50 31 74 8 104 34 85 56Z" fill="#fa8294" stroke="#5b5361" stroke-width="4"/><circle cx="39" cy="49" r="3"/><circle cx="61" cy="49" r="3"/><path d="M42 58q8 8 16 0" fill="none" stroke="#5b5361" stroke-width="3" stroke-linecap="round"/>') },
  { id: 'smiley', name: 'Smiley', group: 'Happy faces', svg: svg('<circle cx="50" cy="50" r="42" fill="#ffe175" stroke="#5b5361" stroke-width="4"/><circle cx="36" cy="43" r="4"/><circle cx="64" cy="43" r="4"/><path d="M32 57q18 25 36 0" fill="none" stroke="#5b5361" stroke-width="4" stroke-linecap="round"/>') },
  { id: 'flower', name: 'Daisy', group: 'Nature', svg: svg('<g fill="#ff94b0" stroke="#5b5361" stroke-width="3"><ellipse cx="50" cy="22" rx="12" ry="18"/><ellipse cx="50" cy="78" rx="12" ry="18"/><ellipse cx="22" cy="50" rx="18" ry="12"/><ellipse cx="78" cy="50" rx="18" ry="12"/><ellipse cx="30" cy="30" rx="12" ry="18" transform="rotate(-45 30 30)"/><ellipse cx="70" cy="30" rx="12" ry="18" transform="rotate(45 70 30)"/><ellipse cx="30" cy="70" rx="12" ry="18" transform="rotate(45 30 70)"/><ellipse cx="70" cy="70" rx="12" ry="18" transform="rotate(-45 70 70)"/></g><circle cx="50" cy="50" r="15" fill="#ffd55d" stroke="#5b5361" stroke-width="3"/>') },
  { id: 'leaf', name: 'Leaf', group: 'Nature', svg: svg('<path d="M14 82Q14 22 87 15 81 83 23 87Z" fill="#8ed18c" stroke="#5b5361" stroke-width="4"/><path d="M20 81 77 25M39 63 37 42m20 1 1 22" fill="none" stroke="#5b5361" stroke-width="3" stroke-linecap="round"/>') },
  { id: 'butterfly', name: 'Butterfly', group: 'Nature', svg: svg('<path d="M48 46C23 5 4 27 18 54c-26 30 2 48 30 16m4-24C77 5 96 27 82 54c26 30-2 48-30 16" fill="#c2a0ef" stroke="#5b5361" stroke-width="4"/><ellipse cx="50" cy="54" rx="6" ry="23" fill="#ffd15c" stroke="#5b5361" stroke-width="3"/><path d="m47 33-9-12m15 12 9-12" fill="none" stroke="#5b5361" stroke-width="3" stroke-linecap="round"/>') },
  { id: 'cloud', name: 'Cloud', group: 'Sky', svg: svg('<path d="M22 73c-20-2-21-29-2-35 5-24 35-28 47-8 22-6 37 9 31 27-3 10-12 16-23 16Z" fill="#fff" stroke="#5b5361" stroke-width="4"/><circle cx="43" cy="54" r="3"/><circle cx="62" cy="54" r="3"/><path d="M46 63q7 7 14 0" fill="none" stroke="#ed7b76" stroke-width="3" stroke-linecap="round"/>') },
  { id: 'rainbow', name: 'Rainbow', group: 'Sky', svg: svg('<path d="M13 78a37 37 0 0 1 74 0" fill="none" stroke="#ed6b68" stroke-width="12"/><path d="M25 78a25 25 0 0 1 50 0" fill="none" stroke="#ffd05b" stroke-width="11"/><path d="M37 78a13 13 0 0 1 26 0" fill="none" stroke="#71c58e" stroke-width="11"/>') },
  { id: 'balloon', name: 'Balloon', group: 'Party', svg: svg('<path d="M50 10C12 10 15 62 47 72l3 7 7-7c29-10 32-62-7-62Z" fill="#fa8294" stroke="#5b5361" stroke-width="4"/><path d="m49 79-7 9 8-2 6 5" fill="none" stroke="#5b5361" stroke-width="3" stroke-linecap="round"/><path d="M33 29q-8 11-2 21" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>') },
  { id: 'cat', name: 'Kitty', group: 'Animals', svg: svg('<path d="m18 42 3-26 24 16q6-2 11 0l24-16 3 26q14 25-4 43-27 25-57 0Q8 65 18 42Z" fill="#ffcc9d" stroke="#5b5361" stroke-width="4"/><circle cx="38" cy="54" r="4"/><circle cx="63" cy="54" r="4"/><path d="m46 64 5 4 5-4m-5 4v6m-20-6-15-3m15 9-15 2m39-8 15-3m-15 9 15 2" fill="none" stroke="#5b5361" stroke-width="3" stroke-linecap="round"/><path d="m45 62 6 5 6-5" fill="#ed7881"/>') },
  { id: 'fish', name: 'Fish', group: 'Animals', svg: svg('<ellipse cx="46" cy="51" rx="32" ry="24" fill="#72cadd" stroke="#5b5361" stroke-width="4"/><path d="m72 51 21-18v36Z" fill="#ffb45d" stroke="#5b5361" stroke-width="4"/><circle cx="34" cy="47" r="4"/><path d="M22 57q10 8 19 0m4-21q10 15 0 30" fill="none" stroke="#5b5361" stroke-width="3"/>') },
  { id: 'car', name: 'Happy car', group: 'Things that go', svg: svg('<path d="M12 57h76l-6-21q-2-8-11-8H36q-8 0-13 8Z" fill="#70b6f5" stroke="#5b5361" stroke-width="4" stroke-linejoin="round"/><path d="M13 56h75v19H13Z" fill="#ffce59" stroke="#5b5361" stroke-width="4"/><circle cx="29" cy="76" r="9" fill="#5b5361"/><circle cx="72" cy="76" r="9" fill="#5b5361"/><circle cx="45" cy="48" r="3"/><circle cx="61" cy="48" r="3"/>') },
  { id: 'rocket', name: 'Rocket', group: 'Space', svg: svg('<path d="M50 8c24 19 25 48 0 72C25 56 26 27 50 8Z" fill="#ed7978" stroke="#5b5361" stroke-width="4"/><circle cx="50" cy="43" r="9" fill="#8be0e3" stroke="#5b5361" stroke-width="3"/><path d="m28 62-15 14 21-4m38-10 15 14-21-4" fill="#ffd05b" stroke="#5b5361" stroke-width="4"/><path d="m42 77 8 16 8-16" fill="#ffb45d" stroke="#5b5361" stroke-width="3"/>') },
  { id: 'planet', name: 'Ring planet', group: 'Space', svg: svg('<ellipse cx="50" cy="52" rx="24" ry="24" fill="#b59be9" stroke="#5b5361" stroke-width="4"/><ellipse cx="50" cy="53" rx="44" ry="13" fill="none" stroke="#f4bb4b" stroke-width="7" transform="rotate(-20 50 53)"/><circle cx="43" cy="48" r="3"/><circle cx="57" cy="48" r="3"/><path d="M45 58q5 5 10 0" fill="none" stroke="#5b5361" stroke-width="2.5"/>') },
  { id: 'cake', name: 'Party cake', group: 'Party', svg: svg('<path d="M17 44h66v39H17Z" fill="#ffb0c0" stroke="#5b5361" stroke-width="4"/><path d="M17 44q10-15 20 0 10-15 20 0 10-15 20 0 5-8 6 0" fill="#fff6e4" stroke="#5b5361" stroke-width="3"/><path d="M31 43V24m19 19V20m19 23V24" stroke="#71c58e" stroke-width="6" stroke-linecap="round"/><path d="M31 18q-8-10 0-16 8 7 0 16m19-3q-8-10 0-16 8 7 0 16m19 5q-8-10 0-16 8 7 0 16" fill="#ffd65a"/>') },
];

const stickerImages = new Map<string, HTMLImageElement>();
export function stickerImage(id: string) {
  const info = stickers.find((item) => item.id === id);
  if (!info) return undefined;
  let image = stickerImages.get(id);
  if (!image) {
    image = new Image(); image.decoding = 'async';
    image.onload = () => window.dispatchEvent(new Event('doodle-sticker-ready'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(info.svg)}`;
    stickerImages.set(id, image);
  }
  return image;
}

export function drawSticker(ctx: CanvasRenderingContext2D, action: StickerAction, x = action.x, y = action.y) {
  const image = stickerImage(action.stickerId);
  if (!image?.complete || !image.naturalWidth) return;
  const size = Math.max(20, action.size * 1000);
  ctx.save(); ctx.translate(x * 1000, y * 750); ctx.rotate(action.rotation * Math.PI / 180);
  ctx.drawImage(image, -size / 2, -size / 2, size, size); ctx.restore();
}
