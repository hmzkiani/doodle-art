import type { ColoringPage } from './pages';

const W = 1000;
const H = 750;
const INK = '#343846';
const PAPER = '#fffef9';
const TAU = Math.PI * 2;

type Ctx = CanvasRenderingContext2D;

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, width = 7) {
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function circle(ctx: Ctx, x: number, y: number, r: number, fill = PAPER, width = 7) {
  ctx.lineWidth = width; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill = PAPER, width = 7) {
  ctx.lineWidth = width; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill = PAPER, width = 7) {
  ctx.lineWidth = width; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function polygon(ctx: Ctx, points: [number, number][], fill = PAPER, width = 7) {
  ctx.lineWidth = width; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function star(ctx: Ctx, x: number, y: number, r: number, fill = PAPER, width = 5) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const radius = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius]); }
  polygon(ctx, pts, fill, width);
}
function heart(ctx: Ctx, x: number, y: number, s: number, fill = PAPER, width = 6) {
  ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, y + s * .35); ctx.bezierCurveTo(x - s * 1.4, y - s * .45, x - s * .5, y - s * 1.2, x, y - s * .55); ctx.bezierCurveTo(x + s * .5, y - s * 1.2, x + s * 1.4, y - s * .45, x, y + s * .35); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
}
function face(ctx: Ctx, x: number, y: number, scale = 1, style: 'smile' | 'beak' | 'sleep' = 'smile') {
  const eyeY = y - 2 * scale;
  if (style === 'sleep') {
    ctx.lineWidth = 6 * scale; ctx.beginPath(); ctx.arc(x - 24 * scale, eyeY, 9 * scale, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 24 * scale, eyeY, 9 * scale, Math.PI, 0); ctx.stroke();
  } else {
    circle(ctx, x - 24 * scale, eyeY, 7 * scale, INK, 1); circle(ctx, x + 24 * scale, eyeY, 7 * scale, INK, 1);
  }
  if (style === 'beak') polygon(ctx, [[x - 11 * scale, y + 18 * scale], [x + 11 * scale, y + 18 * scale], [x, y + 32 * scale]], '#f6ad45', 4 * scale);
  else { ctx.lineWidth = 5 * scale; ctx.beginPath(); ctx.arc(x, y + 9 * scale, 18 * scale, 0.2, Math.PI - 0.2); ctx.stroke(); }
}
function sparkle(ctx: Ctx, x: number, y: number, s = 22) { star(ctx, x, y, s, PAPER, 4); }

function drawAnimal(ctx: Ctx, v: number) {
  const headX = 500, headY = 290;
  const earSets: [number, number, number, number][] = [[-180, -140, 180, -140], [-160, -150, 160, -150], [-150, -130, 150, -130], [-175, -115, 175, -115], [-145, -135, 145, -135], [-155, -140, 155, -140], [-160, -130, 160, -130], [-150, -130, 150, -130], [-170, -135, 170, -135], [-145, -120, 145, -120]];
  const [lx, ly, rx, ry] = earSets[v];
  if (v === 1 || v === 9) { ellipse(ctx, headX + lx, headY + ly, 45, 100, PAPER); ellipse(ctx, headX + rx, headY + ry, 45, 100, PAPER); }
  else if (v === 3) { circle(ctx, headX - 110, headY - 130, 47); circle(ctx, headX + 110, headY - 130, 47); }
  else if (v === 4 || v === 6) { polygon(ctx, [[headX - 170, headY - 145], [headX - 95, headY - 238], [headX - 45, headY - 140]]); polygon(ctx, [[headX + 170, headY - 145], [headX + 95, headY - 238], [headX + 45, headY - 140]]); }
  else if (v === 2) { polygon(ctx, [[headX - 165, headY - 105], [headX - 115, headY - 225], [headX - 60, headY - 135]]); polygon(ctx, [[headX + 165, headY - 105], [headX + 115, headY - 225], [headX + 60, headY - 135]]); }
  else { circle(ctx, headX + lx * .68, headY + ly * .7, 57); circle(ctx, headX + rx * .68, headY + ry * .7, 57); }
  if (v === 0 || v === 7) ellipse(ctx, 500, 470, 210, 155);
  else ellipse(ctx, 500, 460, 200, 135);
  circle(ctx, headX, headY, 180);
  if (v === 5) { ellipse(ctx, 500, 345, 120, 66); }
  if (v === 6) for (let i = 0; i < 5; i++) line(ctx, 365 + i * 68, 250, 390 + i * 68, 276, 10);
  if (v === 7) { ellipse(ctx, 500, 470, 90, 80); }
  if (v === 8) { circle(ctx, 350, 466, 40); circle(ctx, 650, 466, 40); }
  face(ctx, 500, 315, 1, v === 0 ? 'sleep' : 'smile');
  ellipse(ctx, 500, 363, 55, 36);
  if (v === 3) for (let i = 0; i < 5; i++) line(ctx, 425 + i * 38, 415, 406 + i * 38, 452, 6);
  if (v === 9) { line(ctx, 560, 235, 590, 210, 7); line(ctx, 590, 210, 620, 235, 7); }
  line(ctx, 400, 570, 380, 625, 12); line(ctx, 600, 570, 620, 625, 12);
  sparkle(ctx, 230, 285, 18); sparkle(ctx, 770, 285, 18);
}

function drawBird(ctx: Ctx, v: number) {
  if (v === 1) { ellipse(ctx, 500, 390, 150, 205); polygon(ctx, [[385, 545], [500, 680], [615, 545]]); ellipse(ctx, 500, 265, 113, 105); face(ctx, 500, 285, .8, 'beak'); line(ctx, 455, 600, 545, 600, 8); }
  else {
    const bodyW = [175, 150, 190, 155, 168, 150, 170, 124, 185, 168][v];
    ellipse(ctx, 500, 425, bodyW, 125);
    circle(ctx, v === 8 ? 390 : 390, 320, 92);
    if (v === 2) for (let i = 0; i < 7; i++) { const a = Math.PI * .9 + i * .2; ellipse(ctx, 655 + Math.cos(a) * 55, 410 + Math.sin(a) * 75, 48, 22); }
    else polygon(ctx, [[625, 425], [750, 368], [700, 468]]);
    ellipse(ctx, 500, 430, 80, 55);
    polygon(ctx, [[335, 320], [365, 210], [405, 300]]);
    face(ctx, 410, 320, .8, 'beak');
    if (v === 4) { line(ctx, 330, 435, 275, 395, 10); line(ctx, 330, 465, 265, 470, 10); }
    line(ctx, 470, 545, 455, 630, 8); line(ctx, 535, 545, 550, 630, 8);
    line(ctx, 420, 630, 490, 630, 8); line(ctx, 520, 630, 585, 630, 8);
    if (v === 0) line(ctx, 560, 220, 560, 140, 8);
  }
  for (let i = 0; i < 3; i++) { line(ctx, 470 + i * 30, 160, 460 + i * 30, 210, 5); }
  sparkle(ctx, 730, 250, 20);
}

function drawFlower(ctx: Ctx, v: number) {
  const centers = [[500, 300], [500, 295], [500, 310], [500, 285], [500, 300], [470, 300], [525, 295], [500, 290], [500, 305], [500, 285]];
  const [cx, cy] = centers[v]; const petals = 5 + v % 4; const radius = v === 0 ? 75 : 62;
  line(ctx, 500, cy + 65, 500, 635, 11);
  ellipse(ctx, 435, 500, 72, 31); ellipse(ctx, 570, 555, 72, 31);
  for (let i = 0; i < petals; i++) { const a = i * TAU / petals; ellipse(ctx, cx + Math.cos(a) * 97, cy + Math.sin(a) * 97, radius, 43, PAPER, 7); }
  circle(ctx, cx, cy, 56, PAPER, 8);
  if (v === 5) { ellipse(ctx, 385, 395, 50, 26); ellipse(ctx, 620, 390, 50, 26); }
  if (v === 6) { ellipse(ctx, 500, 500, 120, 70); circle(ctx, 450, 500, 24); circle(ctx, 550, 500, 24); }
  if (v === 8) { ctx.beginPath(); ctx.moveTo(500, 565); ctx.bezierCurveTo(380, 470, 600, 435, 500, 350); ctx.stroke(); circle(ctx, 415, 435, 28); circle(ctx, 580, 478, 25); }
  if (v === 9) { for (let i = 0; i < 7; i++) { const x = 275 + i * 75; circle(ctx, x, 625 - (i % 2) * 28, 20); } }
  sparkle(ctx, 275, 280, 16); sparkle(ctx, 720, 300, 16);
}

function drawVehicle(ctx: Ctx, v: number) {
  if (v === 0 || v === 6 || v === 7 || v === 8) {
    roundRect(ctx, 260, 370, 480, 170, 42); roundRect(ctx, 350, 285, 270, 120, 30);
    if (v === 6) { roundRect(ctx, 220, 300, 115, 180, 25); circle(ctx, 735, 440, 38, '#ffd35a'); }
    if (v === 7) { roundRect(ctx, 220, 360, 560, 160, 34); roundRect(ctx, 390, 285, 200, 100, 20); }
    if (v === 8) { circle(ctx, 500, 330, 40); line(ctx, 500, 370, 500, 505, 9); }
    circle(ctx, 365, 550, 60); circle(ctx, 640, 550, 60); circle(ctx, 365, 550, 22); circle(ctx, 640, 550, 22);
    if (v === 0) { circle(ctx, 470, 460, 8, INK, 1); circle(ctx, 530, 460, 8, INK, 1); line(ctx, 470, 495, 530, 495, 5); }
  } else if (v === 1 || v === 2) {
    if (v === 1) { roundRect(ctx, 220, 260, 560, 290, 54); for (let i = 0; i < 5; i++) roundRect(ctx, 270 + i * 98, 310, 76, 100, 14); line(ctx, 240, 440, 760, 440, 7); circle(ctx, 330, 555, 53); circle(ctx, 670, 555, 53); }
    else { roundRect(ctx, 165, 380, 670, 165, 42); for (let i = 0; i < 5; i++) roundRect(ctx, 230 + i * 106, 280, 86, 112, 12); circle(ctx, 305, 555, 52); circle(ctx, 700, 555, 52); line(ctx, 250, 605, 760, 605, 9); }
  } else if (v === 3) {
    polygon(ctx, [[250, 430], [360, 340], [650, 340], [760, 430], [800, 525], [220, 525]]); roundRect(ctx, 400, 365, 210, 74, 25); line(ctx, 250, 525, 750, 525, 10); circle(ctx, 315, 545, 43); circle(ctx, 690, 545, 43); wave(ctx, 150, 610, 700, 25);
  } else if (v === 4 || v === 5 || v === 9) {
    if (v === 4) { roundRect(ctx, 420, 270, 160, 270, 75); polygon(ctx, [[420, 280], [500, 145], [580, 280]]); polygon(ctx, [[420, 490], [320, 600], [420, 575]]); polygon(ctx, [[580, 490], [680, 600], [580, 575]]); circle(ctx, 500, 420, 35); }
    if (v === 5) { ellipse(ctx, 500, 400, 200, 80); polygon(ctx, [[650, 375], [760, 215], [770, 405]]); ellipse(ctx, 440, 400, 90, 42); }
    if (v === 9) { ellipse(ctx, 500, 350, 140, 180); line(ctx, 500, 530, 500, 650, 8); line(ctx, 430, 650, 570, 650, 8); }
  } else if (v === 10) {
    circle(ctx, 340, 540, 82); circle(ctx, 660, 540, 82);
    line(ctx, 340, 540, 500, 350, 10); line(ctx, 500, 350, 660, 540, 10); line(ctx, 340, 540, 500, 540, 10); line(ctx, 500, 350, 500, 540, 10);
    circle(ctx, 500, 350, 35); circle(ctx, 340, 540, 30); circle(ctx, 660, 540, 30);
    circle(ctx, 500, 255, 52); line(ctx, 495, 305, 460, 370, 9); line(ctx, 505, 305, 540, 370, 9); line(ctx, 470, 385, 530, 385, 8);
  } else if (v === 11) {
    roundRect(ctx, 215, 330, 375, 205, 28); roundRect(ctx, 590, 385, 195, 150, 28);
    roundRect(ctx, 260, 360, 270, 140, 16); line(ctx, 395, 360, 395, 500, 7);
    roundRect(ctx, 620, 410, 90, 68, 13); circle(ctx, 330, 550, 48); circle(ctx, 680, 550, 48);
    for (let i = 0; i < 5; i++) circle(ctx, 285 + i * 52, 390 + (i % 2) * 52, 8, '#343846', 1);
    line(ctx, 205, 590, 800, 590, 7);
  } else if (v === 12) {
    roundRect(ctx, 205, 350, 590, 205, 48); roundRect(ctx, 300, 265, 300, 135, 50);
    roundRect(ctx, 340, 292, 92, 75, 20); roundRect(ctx, 458, 292, 92, 75, 20); roundRect(ctx, 625, 400, 95, 85, 20);
    circle(ctx, 345, 565, 54); circle(ctx, 665, 565, 54); circle(ctx, 345, 565, 20); circle(ctx, 665, 565, 20);
    roundRect(ctx, 395, 430, 120, 105, 18); line(ctx, 455, 430, 455, 535, 6);
  } else if (v === 13) {
    roundRect(ctx, 250, 260, 500, 335, 48); roundRect(ctx, 315, 300, 105, 105, 20); roundRect(ctx, 447, 300, 105, 105, 20); roundRect(ctx, 580, 300, 105, 105, 20);
    roundRect(ctx, 430, 445, 140, 120, 25); circle(ctx, 350, 610, 29); circle(ctx, 650, 610, 29);
    line(ctx, 190, 650, 810, 650, 8); line(ctx, 245, 675, 755, 675, 6); line(ctx, 315, 596, 315, 635, 7); line(ctx, 685, 596, 685, 635, 7);
  } else {
    ellipse(ctx, 460, 400, 165, 87); ellipse(ctx, 545, 383, 87, 55); roundRect(ctx, 320, 485, 280, 34, 16);
    polygon(ctx, [[600, 390], [760, 335], [770, 360], [635, 425]]); line(ctx, 345, 325, 625, 325, 10); line(ctx, 485, 325, 465, 390, 8); line(ctx, 485, 325, 520, 390, 8);
    circle(ctx, 760, 348, 14); line(ctx, 420, 490, 400, 575, 8); line(ctx, 540, 490, 560, 575, 8); line(ctx, 360, 575, 600, 575, 8);
  }
  face(ctx, v === 5 ? 490 : 500, v === 4 ? 385 : 450, .75, v === 4 ? 'smile' : 'smile');
  sparkle(ctx, 210, 250, 22); sparkle(ctx, 780, 270, 18);
}
function wave(ctx: Ctx, x: number, y: number, width: number, height: number) {
  ctx.beginPath(); ctx.moveTo(x, y); for (let i = 0; i < width; i += 12) ctx.lineTo(x + i, y + Math.sin(i / 45) * height); ctx.stroke();
}

function drawDino(ctx: Ctx, v: number) {
  if (v === 8) { ellipse(ctx, 500, 500, 210, 90); circle(ctx, 500, 380, 80); for (let i = 0; i < 5; i++) line(ctx, 410 + i * 44, 580, 400 + i * 48, 620, 7); }
  else if (v === 9) { triangleMountain(ctx, 500, 320, 390, 310); ellipse(ctx, 500, 585, 240, 36); }
  else {
    ellipse(ctx, 470, 470, v === 0 ? 260 : 215, 128);
    if (v === 0 || v === 2) { line(ctx, 605, 450, 765, 300, 100); circle(ctx, 720, 260, 95); }
    else { line(ctx, 345, 470, 215, 410, 85); circle(ctx, 640, 350, 98); }
    if (v === 2) polygon(ctx, [[565, 385], [610, 300], [650, 385]]);
    if (v === 3 || v === 6) for (let i = 0; i < 6; i++) polygon(ctx, [[330 + i * 60, 372], [360 + i * 60, 300 - (i % 2) * 20], [390 + i * 60, 380]]);
    if (v === 4) { ellipse(ctx, 500, 330, 135, 45); line(ctx, 460, 310, 420, 230, 8); line(ctx, 540, 310, 580, 230, 8); }
    if (v === 5) { circle(ctx, 520, 325, 88); ellipse(ctx, 520, 420, 65, 80); }
    if (v === 7) { circle(ctx, 330, 400, 85); circle(ctx, 650, 390, 90); circle(ctx, 480, 360, 75); }
    circle(ctx, 650, 320, 7, INK, 1); face(ctx, 660, 350, .6);
    line(ctx, 420, 570, 400, 635, 15); line(ctx, 580, 570, 600, 635, 15);
    for (let i = 0; i < 4; i++) line(ctx, 430 + i * 34, 445, 430 + i * 34, 485, 4);
  }
  sparkle(ctx, 250, 260, 20);
}
function triangleMountain(ctx: Ctx, x: number, y: number, w: number, h: number) { polygon(ctx, [[x - w / 2, y + h], [x, y - h], [x + w / 2, y + h]]); polygon(ctx, [[x - 85, y - h + 145], [x, y - h], [x + 85, y - h + 145]], PAPER, 5); }

function drawSpace(ctx: Ctx, v: number) {
  if (v === 0) { circle(ctx, 485, 390, 145); ctx.lineWidth = 13; ctx.beginPath(); ctx.ellipse(500, 400, 240, 78, -.25, 0, TAU); ctx.stroke(); }
  else if (v === 1) { circle(ctx, 500, 425, 150); crater(ctx, 450, 385, 36); crater(ctx, 565, 470, 27); }
  else if (v === 2 || v === 8) { circle(ctx, 500, 375, 135); circle(ctx, 455, 350, 8, INK, 1); circle(ctx, 545, 350, 8, INK, 1); ctx.beginPath(); ctx.arc(500, 365, 57, .2, Math.PI - .2); ctx.stroke(); if (v === 8) { polygon(ctx, [[390, 270], [470, 155], [470, 290]]); polygon(ctx, [[600, 270], [530, 155], [530, 290]]); } }
  else if (v === 3) { roundRect(ctx, 430, 275, 140, 260, 65); polygon(ctx, [[430, 280], [500, 140], [570, 280]]); polygon(ctx, [[430, 490], [335, 600], [430, 565]]); polygon(ctx, [[570, 490], [665, 600], [570, 565]]); circle(ctx, 500, 405, 38); }
  else if (v === 4) { circle(ctx, 500, 375, 120); roundRect(ctx, 410, 470, 180, 170, 45); circle(ctx, 500, 390, 55); line(ctx, 425, 520, 345, 590, 12); line(ctx, 575, 520, 655, 590, 12); }
  else if (v === 5) { ctx.beginPath(); ctx.moveTo(350, 510); ctx.quadraticCurveTo(520, 450, 690, 225); ctx.quadraticCurveTo(620, 490, 350, 510); ctx.stroke(); circle(ctx, 355, 510, 44); }
  else if (v === 6) { roundRect(ctx, 245, 330, 510, 210, 52); roundRect(ctx, 380, 265, 240, 85, 25); for (let i = 0; i < 3; i++) circle(ctx, 380 + i * 120, 425, 42); line(ctx, 250, 545, 200, 620, 10); line(ctx, 750, 545, 800, 620, 10); }
  else if (v === 7) { circle(ctx, 500, 390, 170); ellipse(ctx, 500, 390, 170, 70); line(ctx, 500, 220, 500, 560, 5); line(ctx, 350, 390, 650, 390, 5); }
  else { star(ctx, 500, 390, 155); circle(ctx, 500, 390, 65); }
  for (const [x, y, r] of [[240, 235, 24], [755, 265, 18], [725, 535, 22], [280, 545, 16]] as const) sparkle(ctx, x, y, r);
}
function crater(ctx: Ctx, x: number, y: number, r: number) { circle(ctx, x, y, r, PAPER, 5); }

function drawFruit(ctx: Ctx, v: number) {
  if (v === 0 || v === 5) { circle(ctx, 450, 420, 150); circle(ctx, 550, 420, 150); for (const [x, y] of [[390, 360], [480, 330], [560, 420], [440, 500], [545, 510]] as const) { line(ctx, x, y, x - 4, y + 9, 5); } }
  else if (v === 1 || v === 8) { ctx.beginPath(); ctx.moveTo(500, 320); ctx.bezierCurveTo(300, 210, 280, 535, 465, 590); ctx.bezierCurveTo(555, 650, 715, 500, 640, 350); ctx.bezierCurveTo(580, 300, 540, 310, 500, 320); ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke(); line(ctx, 500, 330, 520, 250, 10); ellipse(ctx, 560, 260, 65, 30); }
  else if (v === 2) { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(390 + i * 75, 320); ctx.quadraticCurveTo(330 + i * 75, 470, 460 + i * 75, 590); ctx.quadraticCurveTo(535 + i * 75, 460, 465 + i * 75, 320); ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke(); } }
  else if (v === 3) { polygon(ctx, [[500, 250], [650, 300], [685, 510], [500, 600], [315, 510], [350, 300]]); for (let i = 0; i < 5; i++) line(ctx, 370 + i * 62, 290, 450 + i * 25, 200, 7); }
  else if (v === 4) { polygon(ctx, [[350, 300], [650, 300], [590, 570], [500, 625], [410, 570]]); wave(ctx, 385, 400, 230, 23); wave(ctx, 400, 485, 200, 23); }
  else if (v === 6) { circle(ctx, 500, 420, 170); circle(ctx, 500, 420, 140); for (let i = 0; i < 8; i++) line(ctx, 500 + Math.cos(i * TAU / 8) * 55, 420 + Math.sin(i * TAU / 8) * 55, 500 + Math.cos(i * TAU / 8) * 112, 420 + Math.sin(i * TAU / 8) * 112, 7); }
  else if (v === 7) { line(ctx, 500, 285, 500, 570, 9); for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, y = 330 + i * 45; circle(ctx, 500 + side * 53, y, 51); } ellipse(ctx, 500, 280, 88, 45); }
  else { roundRect(ctx, 270, 390, 460, 200, 28); line(ctx, 300, 455, 700, 455, 6); line(ctx, 300, 520, 700, 520, 6); circle(ctx, 390, 375, 67); circle(ctx, 515, 340, 65); circle(ctx, 630, 375, 66); }
  if (v !== 3 && v !== 4 && v !== 6) { line(ctx, 500, 300, 500, 230, 10); ellipse(ctx, 560, 240, 60, 28); }
  face(ctx, 500, 425, .7);
  sparkle(ctx, 265, 260, 18); sparkle(ctx, 735, 295, 18);
}

function drawSea(ctx: Ctx, v: number) {
  if (v === 1) { ellipse(ctx, 500, 430, 125, 160); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; line(ctx, 500 + Math.cos(a) * 90, 390 + Math.sin(a) * 100, 500 + Math.cos(a) * 210, 390 + Math.sin(a) * 210, 24); circle(ctx, 500 + Math.cos(a) * 210, 390 + Math.sin(a) * 210, 14); } circle(ctx, 460, 400, 7, INK, 1); }
  else if (v === 2) { ellipse(ctx, 500, 420, 220, 135); circle(ctx, 700, 380, 70); circle(ctx, 720, 360, 7, INK, 1); circle(ctx, 430, 330, 52); for (let i = 0; i < 6; i++) roundRect(ctx, 360 + i * 52, 375, 40, 63, 15); line(ctx, 395, 515, 350, 600, 14); line(ctx, 580, 515, 630, 600, 14); }
  else if (v === 3 || v === 7) { ellipse(ctx, 500, 420, 245, 130); polygon(ctx, [[700, 420], [835, 300], [820, 535]]); circle(ctx, 355, 390, 8, INK, 1); ctx.beginPath(); ctx.arc(420, 430, 34, .2, Math.PI - .2); ctx.stroke(); if (v === 7) { line(ctx, 450, 300, 400, 220, 9); line(ctx, 460, 300, 480, 205, 9); } }
  else if (v === 4) { ellipse(ctx, 500, 400, 90, 160); circle(ctx, 500, 280, 70); line(ctx, 450, 530, 400, 610, 8); line(ctx, 550, 530, 600, 610, 8); line(ctx, 450, 335, 385, 280, 8); line(ctx, 550, 335, 615, 280, 8); face(ctx, 500, 280, .55); }
  else if (v === 5) { ellipse(ctx, 500, 325, 105, 125); for (let i = 0; i < 6; i++) line(ctx, 420 + i * 32, 420, 370 + i * 52, 610, 8); circle(ctx, 465, 300, 7, INK, 1); circle(ctx, 535, 300, 7, INK, 1); }
  else if (v === 6) { ellipse(ctx, 500, 465, 170, 110); circle(ctx, 670, 440, 65); circle(ctx, 690, 425, 7, INK, 1); line(ctx, 400, 510, 340, 560, 12); line(ctx, 600, 520, 660, 560, 12); }
  else if (v === 8) { star(ctx, 500, 430, 160); circle(ctx, 455, 405, 7, INK, 1); circle(ctx, 535, 405, 7, INK, 1); ctx.beginPath(); ctx.arc(495, 420, 28, .2, Math.PI - .2); ctx.stroke(); }
  else { roundRect(ctx, 315, 350, 370, 250, 20); for (let i = 0; i < 3; i++) { polygon(ctx, [[340 + i * 115, 350], [390 + i * 115, 250], [440 + i * 115, 350]]); roundRect(ctx, 365 + i * 108, 420, 65, 88, 20); } }
  wave(ctx, 160, 630, 680, 22); sparkle(ctx, 250, 245, 18); sparkle(ctx, 770, 270, 18);
}

function drawFantasy(ctx: Ctx, v: number) {
  if (v === 0) { ellipse(ctx, 500, 465, 175, 130); circle(ctx, 500, 325, 112); polygon(ctx, [[410, 270], [450, 70], [500, 260]]); polygon(ctx, [[500, 260], [560, 70], [590, 300]]); line(ctx, 550, 480, 680, 600, 13); face(ctx, 500, 325, .8); }
  else if (v === 1) { ellipse(ctx, 500, 465, 230, 135); circle(ctx, 660, 350, 105); polygon(ctx, [[600, 265], [650, 170], [680, 275]]); polygon(ctx, [[700, 270], [780, 200], [745, 320]]); for (let i = 0; i < 5; i++) polygon(ctx, [[330 + i * 75, 365], [350 + i * 75, 300], [375 + i * 75, 370]]); line(ctx, 390, 565, 370, 640, 14); line(ctx, 580, 565, 600, 640, 14); heart(ctx, 520, 430, 30); }
  else if (v === 2 || v === 7) { roundRect(ctx, 300, 335, 400, 280, 25); for (let i = 0; i < 3; i++) { roundRect(ctx, 340 + i * 115, 400, 75, 95, 38); circle(ctx, 380 + i * 115, 370, 37); } polygon(ctx, [[270, 345], [500, 140], [730, 345]]); line(ctx, 500, 140, 500, 70, 8); if (v === 7) { ellipse(ctx, 500, 170, 200, 45); circle(ctx, 335, 170, 25); circle(ctx, 660, 170, 25); } }
  else if (v === 3 || v === 6) { circle(ctx, 500, 380, 130); polygon(ctx, [[435, 300], [500, 200], [565, 300]]); line(ctx, 440, 485, 350, 590, 10); line(ctx, 560, 485, 650, 590, 10); ellipse(ctx, 500, 475, 125, 76); face(ctx, 500, 390, .7); if (v === 6) { ellipse(ctx, 500, 565, 180, 32); } }
  else if (v === 4) { roundRect(ctx, 360, 360, 280, 220, 35); circle(ctx, 360, 405, 50); circle(ctx, 640, 405, 50); roundRect(ctx, 420, 265, 160, 105, 30); }
  else if (v === 5) { polygon(ctx, [[300, 420], [500, 290], [700, 420], [500, 540]]); line(ctx, 500, 540, 500, 635, 9); line(ctx, 435, 635, 565, 635, 9); star(ctx, 500, 405, 45); }
  else if (v === 8) { polygon(ctx, [[340, 300], [660, 300], [620, 500], [380, 500]]); line(ctx, 390, 300, 420, 225, 8); line(ctx, 610, 300, 580, 225, 8); circle(ctx, 420, 500, 33); circle(ctx, 580, 500, 33); }
  else { circle(ctx, 500, 420, 145); roundRect(ctx, 395, 330, 210, 155, 18); for (let i = 0; i < 3; i++) star(ctx, 450 + i * 50, 385, 18); }
  sparkle(ctx, 255, 240, 20); sparkle(ctx, 745, 245, 22);
}

function drawShapes(ctx: Ctx, v: number) {
  if (v === 0) { for (let i = 0; i < 6; i++) { const x = 250 + i * 100; ctx.beginPath(); ctx.arc(x, 410, 90, Math.PI, TAU); ctx.stroke(); } ellipse(ctx, 300, 600, 90, 45); ellipse(ctx, 700, 600, 90, 45); }
  else if (v === 1) { polygon(ctx, [[270, 405], [500, 220], [730, 405]]); roundRect(ctx, 330, 405, 340, 230, 20); roundRect(ctx, 450, 485, 100, 150, 14); }
  else if (v === 2) { roundRect(ctx, 340, 240, 320, 375, 45); circle(ctx, 420, 350, 40); circle(ctx, 580, 350, 40); roundRect(ctx, 420, 440, 160, 55, 18); line(ctx, 390, 615, 350, 670, 12); line(ctx, 610, 615, 650, 670, 12); line(ctx, 340, 430, 245, 390, 12); line(ctx, 660, 430, 755, 390, 12); }
  else if (v === 3 || v === 4) { line(ctx, 500, 275, 500, 620, 8); if (v === 3) polygon(ctx, [[500, 290], [685, 380], [500, 490]]); else { circle(ctx, 420, 335, 95); circle(ctx, 580, 335, 95); circle(ctx, 500, 465, 95); } }
  else if (v === 5) { roundRect(ctx, 425, 260, 150, 280, 72); polygon(ctx, [[425, 275], [500, 130], [575, 275]]); polygon(ctx, [[425, 500], [340, 605], [425, 580]]); polygon(ctx, [[575, 500], [660, 605], [575, 580]]); circle(ctx, 500, 405, 38); }
  else if (v === 6) { polygon(ctx, [[280, 540], [280, 410], [365, 410], [365, 330], [455, 330], [455, 250], [545, 250], [545, 350], [635, 350], [635, 435], [720, 435], [720, 540]]); roundRect(ctx, 470, 435, 65, 105, 12); }
  else if (v === 7) { circle(ctx, 500, 380, 155); line(ctx, 500, 535, 500, 650, 10); polygon(ctx, [[500, 650], [350, 680], [650, 680]]); face(ctx, 500, 380, .65); }
  else if (v === 8) { for (let i = 0; i < 5; i++) { const x = 280 + i * 110; if (i % 2) circle(ctx, x, 400, 60); else star(ctx, x, 400, 65); } line(ctx, 240, 500, 760, 500, 5); }
  else { for (let i = 0; i < 4; i++) { roundRect(ctx, 220 + i * 145, 360 - (i % 2) * 70, 115, 280 + (i % 2) * 70, 15); for (let j = 0; j < 2; j++) roundRect(ctx, 240 + i * 145 + j * 46, 400 + (j % 2) * 90 - (i % 2) * 70, 25, 40, 8); } }
  sparkle(ctx, 245, 220, 18); sparkle(ctx, 755, 230, 18);
}

const renderers: Record<string, (ctx: Ctx, variant: number) => void> = {
  animals: drawAnimal, birds: drawBird, flowers: drawFlower, vehicles: drawVehicle,
  dinosaurs: drawDino, space: drawSpace, fruits: drawFruit, underwater: drawSea,
  fantasy: drawFantasy, shapes: drawShapes,
};

function drawPageDetails(ctx: Ctx, page: ColoringPage) {
  let seed = 0;
  for (const character of page.id) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  const spots: [number, number][] = [[112, 112], [888, 112], [112, 655], [888, 655]];
  spots.forEach(([x, y], index) => {
    const motif = (seed >>> (index * 5)) % 4;
    const size = 17 + ((seed >>> (index * 3)) % 9);
    if (motif === 0) star(ctx, x, y, size, PAPER, 4);
    else if (motif === 1) heart(ctx, x, y, size * .72, PAPER, 4);
    else if (motif === 2) {
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal * TAU / 5;
        circle(ctx, x + Math.cos(angle) * size * .6, y + Math.sin(angle) * size * .6, size * .34, PAPER, 3);
      }
      circle(ctx, x, y, size * .3, PAPER, 3);
    } else polygon(ctx, [[x, y - size], [x + size * .68, y], [x, y + size], [x - size * .68, y]], PAPER, 4);
  });
}

export function drawColoringPage(ctx: Ctx, page: ColoringPage) {
  ctx.save();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.lineWidth = 3; ctx.strokeStyle = '#f2ede2'; ctx.beginPath(); ctx.roundRect(28, 28, W - 56, H - 56, 24); ctx.stroke();
  ctx.strokeStyle = INK;
  (renderers[page.categoryId] ?? drawShapes)(ctx, page.variant);
  drawPageDetails(ctx, page);
  ctx.restore();
}

