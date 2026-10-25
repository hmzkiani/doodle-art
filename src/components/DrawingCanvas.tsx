import { useCallback, useEffect, useRef } from 'react';
import { getPage } from '../data/pages';
import { drawColoringPage } from '../data/illustrations';
import { drawBrush } from '../data/brushes';
import { drawBackground, drawShape, drawSticker } from '../data/drawingObjects';
import type { BackgroundAction, CanvasTool, DrawingAction, FillAction, ShapeAction, ShapeId, ShapeMode, StickerAction, Stroke, StrokePoint } from '../types';

const WIDTH = 1000;
const HEIGHT = 750;
const EMPTY_PAGE = 'blank';
const regionCache = new Map<string, { labels: Uint32Array; sizes: number[]; edges: boolean[]; lineArt: HTMLCanvasElement }>();
const maskCache = new Map<string, Map<number, ImageData>>();

type Props = {
  pageId: string | null;
  actions: DrawingAction[];
  color: string;
  brushSize: number;
  brush: Stroke['brush'];
  tool: CanvasTool;
  layer: 'color' | 'drawing';
  shapeType: ShapeId;
  shapeMode: ShapeMode;
  stickerId: string;
  stickerSize: number;
  stickerRotation: number;
  showBefore: boolean;
  zoom: number;
  panMode: boolean;
  onStroke: (stroke: Stroke) => void;
  onAction: (action: DrawingAction) => void;
  onFill: (fill: FillAction) => void;
  onShape: (shape: ShapeAction) => void;
  onRemoveSticker: (id: string) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

function makePageCanvas(pageId: string | null) {
  const id = pageId ?? EMPTY_PAGE;
  const cached = regionCache.get(id);
  if (cached) return cached;

  const source = document.createElement('canvas');
  source.width = WIDTH; source.height = HEIGHT;
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  if (!sourceCtx) throw new Error('Canvas is not available.');
  const page = getPage(pageId);
  if (page) drawColoringPage(sourceCtx, page);
  else { sourceCtx.fillStyle = '#fffef9'; sourceCtx.fillRect(0, 0, WIDTH, HEIGHT); }

  const pixels = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const lineArt = document.createElement('canvas');
  lineArt.width = WIDTH; lineArt.height = HEIGHT;
  const lineCtx = lineArt.getContext('2d');
  const transparentPage = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < transparentPage.data.length; i += 4) {
    if (transparentPage.data[i] > 246 && transparentPage.data[i + 1] > 246 && transparentPage.data[i + 2] > 246) transparentPage.data[i + 3] = 0;
  }
  lineCtx?.putImageData(transparentPage, 0, 0);
  const labels = new Uint32Array(WIDTH * HEIGHT);
  const queue = new Int32Array(WIDTH * HEIGHT);
  const sizes: number[] = [0];
  const edges: boolean[] = [false];
  let nextId = 0;
  for (let start = 0; start < labels.length; start++) {
    const p = start * 4;
    if (labels[start] !== 0 || pixels[p] < 245 || pixels[p + 1] < 245 || pixels[p + 2] < 240) continue;
    nextId++;
    let head = 0, tail = 0;
    queue[tail++] = start; labels[start] = nextId;
    let touchesEdge = false;
    while (head < tail) {
      const point = queue[head++];
      const x = point % WIDTH;
      if (x === 0 || x === WIDTH - 1 || point < WIDTH || point >= WIDTH * (HEIGHT - 1)) touchesEdge = true;
      const candidates = [point - WIDTH, point + WIDTH, x > 0 ? point - 1 : -1, x < WIDTH - 1 ? point + 1 : -1];
      for (const neighbor of candidates) {
        if (neighbor < 0 || neighbor >= labels.length || labels[neighbor] !== 0) continue;
        const np = neighbor * 4;
        if (pixels[np] < 245 || pixels[np + 1] < 245 || pixels[np + 2] < 240) continue;
        labels[neighbor] = nextId; queue[tail++] = neighbor;
      }
    }
    sizes[nextId] = tail;
    edges[nextId] = touchesEdge;
  }
  const result = { labels, sizes, edges, lineArt };
  regionCache.set(id, result);
  if (regionCache.size > 2) {
    const oldest = regionCache.keys().next().value as string;
    regionCache.delete(oldest); maskCache.delete(oldest);
  }
  return result;
}

function getRegionAt(pageId: string | null, x: number, y: number) {
  const { labels, sizes, edges } = makePageCanvas(pageId);
  const px = Math.max(0, Math.min(WIDTH - 1, Math.round(x * WIDTH)));
  const py = Math.max(0, Math.min(HEIGHT - 1, Math.round(y * HEIGHT)));
  let region = labels[py * WIDTH + px];
  if (!region) {
    for (let radius = 1; radius <= 14 && !region; radius++) {
      for (let dx = -radius; dx <= radius && !region; dx++) {
        for (const dy of [-radius, radius]) {
          const xx = px + dx, yy = py + dy;
          if (xx >= 0 && xx < WIDTH && yy >= 0 && yy < HEIGHT) region = labels[yy * WIDTH + xx];
        }
      }
      for (let dy = -radius + 1; dy < radius && !region; dy++) {
        for (const dx of [-radius, radius]) {
          const xx = px + dx, yy = py + dy;
          if (xx >= 0 && xx < WIDTH && yy >= 0 && yy < HEIGHT) region = labels[yy * WIDTH + xx];
        }
      }
    }
  }
  if (!region || edges[region] || sizes[region] > WIDTH * HEIGHT * 0.34) return null;
  return region;
}

function makeRegionMask(pageId: string | null, regionId: number) {
  const key = pageId ?? EMPTY_PAGE;
  let byRegion = maskCache.get(key);
  if (!byRegion) { byRegion = new Map(); maskCache.set(key, byRegion); }
  let mask = byRegion.get(regionId);
  if (!mask) {
    const { labels } = makePageCanvas(pageId);
    mask = new ImageData(WIDTH, HEIGHT);
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === regionId) {
        const pixel = i * 4;
        mask.data[pixel] = 255; mask.data[pixel + 1] = 255; mask.data[pixel + 2] = 255; mask.data[pixel + 3] = 255;
      }
    }
    byRegion.set(regionId, mask);
    if (byRegion.size > 6) byRegion.delete(byRegion.keys().next().value as number);
  }
  return mask;
}

function getLayerCanvas(ref: React.MutableRefObject<HTMLCanvasElement | null>) {
  if (!ref.current) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH; canvas.height = HEIGHT;
    ref.current = canvas;
  }
  return ref.current;
}

function applyMask(layer: HTMLCanvasElement, maskImage: ImageData, maskCanvas: HTMLCanvasElement) {
  const maskCtx = maskCanvas.getContext('2d');
  const layerCtx = layer.getContext('2d');
  if (!maskCtx || !layerCtx) return;
  maskCtx.clearRect(0, 0, WIDTH, HEIGHT);
  maskCtx.putImageData(maskImage, 0, 0);
  layerCtx.globalCompositeOperation = 'destination-in';
  layerCtx.drawImage(maskCanvas, 0, 0);
  layerCtx.globalCompositeOperation = 'source-over';
}

export function DrawingCanvas({ pageId, actions, color, brushSize, brush, tool, layer, shapeType, shapeMode, stickerId, stickerSize, stickerRotation, showBefore, zoom, panMode, onStroke, onAction, onFill, onShape, onRemoveSticker, onMoveSticker, canvasRef }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const colorLayerRef = useRef<HTMLCanvasElement | null>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const activeShapeRef = useRef<ShapeAction | null>(null);
  const cursorPointRef = useRef<StrokePoint | null>(null);
  const stickerDragRef = useRef<{ id: string; x: number; y: number; dx: number; dy: number } | null>(null);
  const stickerPreviewRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const panPointRef = useRef<{ x: number; y: number } | null>(null);
  const propsRef = useRef({ pageId, actions, showBefore, tool, shapeType, shapeMode, color, brushSize, layer, stickerId, stickerSize, stickerRotation });
  propsRef.current = { pageId, actions, showBefore, tool, shapeType, shapeMode, color, brushSize, layer, stickerId, stickerSize, stickerRotation };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const cssWidth = rect.width * zoom;
    const cssHeight = cssWidth * HEIGHT / WIDTH;
    if (cssWidth < 1 || cssHeight < 1) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const pixelWidth = Math.round(cssWidth * dpr);
    const pixelHeight = Math.round(cssHeight * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth; canvas.height = pixelHeight;
    }

    const colorLayer = getLayerCanvas(colorLayerRef);
    const drawingLayer = getLayerCanvas(drawingLayerRef);
    const scratch = getLayerCanvas(scratchRef);
    const maskCanvas = getLayerCanvas(maskRef);
    const colorCtx = colorLayer.getContext('2d');
    const drawingCtx = drawingLayer.getContext('2d');
    const scratchCtx = scratch.getContext('2d');
    const output = canvas.getContext('2d');
    if (!colorCtx || !drawingCtx || !scratchCtx || !output) return;
    colorCtx.clearRect(0, 0, WIDTH, HEIGHT);
    drawingCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const current = propsRef.current;
    const pageInfo = getPage(current.pageId);
    const pageLayers = makePageCanvas(current.pageId);

    for (const action of current.actions) {
      if (current.showBefore) break;
      if (action.kind === 'fill') {
        const mask = makeRegionMask(current.pageId, action.regionId);
        scratchCtx.clearRect(0, 0, WIDTH, HEIGHT);
        scratchCtx.fillStyle = action.color;
        scratchCtx.fillRect(0, 0, WIDTH, HEIGHT);
        applyMask(scratch, mask, maskCanvas);
        colorCtx.drawImage(scratch, 0, 0);
      } else if (action.kind === 'shape') {
        drawShape(action.layer === 'color' ? colorCtx : drawingCtx, action);
      } else if (action.kind === 'background' || action.kind === 'sticker' || action.kind === 'sticker-transform' || action.kind === 'sticker-remove') {
        continue;
      } else if ((action.layer ?? 'color') === 'color') {
        scratchCtx.clearRect(0, 0, WIDTH, HEIGHT);
        const mask = action.regionId ? makeRegionMask(current.pageId, action.regionId) : undefined;
        const drawing = action.erase ? { ...action, erase: false } : action;
        drawBrush(scratchCtx, drawing);
        if (mask) applyMask(scratch, mask, maskCanvas);
        colorCtx.globalCompositeOperation = action.erase ? 'destination-out' : 'source-over';
        colorCtx.drawImage(scratch, 0, 0);
        colorCtx.globalCompositeOperation = 'source-over';
      } else {
        drawBrush(drawingCtx, action);
      }
    }

    if (!current.showBefore && activeStrokeRef.current) {
      const active = activeStrokeRef.current;
      const activeLayer = active.layer === 'drawing' ? drawingCtx : colorCtx;
      if (active.erase) {
        scratchCtx.clearRect(0, 0, WIDTH, HEIGHT);
        drawBrush(scratchCtx, { ...active, erase: false });
        const mask = active.layer === 'color' && active.regionId ? makeRegionMask(current.pageId, active.regionId) : undefined;
        if (mask) applyMask(scratch, mask, maskCanvas);
        activeLayer.globalCompositeOperation = 'destination-out'; activeLayer.drawImage(scratch, 0, 0); activeLayer.globalCompositeOperation = 'source-over';
      } else {
        const mask = active.layer === 'color' && active.regionId ? makeRegionMask(current.pageId, active.regionId) : undefined;
        if (mask) {
          scratchCtx.clearRect(0, 0, WIDTH, HEIGHT); drawBrush(scratchCtx, active); applyMask(scratch, mask, maskCanvas); activeLayer.drawImage(scratch, 0, 0);
        } else drawBrush(activeLayer, active);
      }
    }

    const stickerActions = new Map<string, StickerAction>();
    const stickerMoves = new Map<string, { x: number; y: number }>();
    const removedStickers = new Set<string>();
    let background = 'paper' as BackgroundAction['background'];
    for (const action of current.actions) {
      if (action.kind === 'background') background = action.background;
      else if (action.kind === 'sticker') { stickerActions.set(action.id, action); removedStickers.delete(action.id); }
      else if (action.kind === 'sticker-transform') stickerMoves.set(action.targetId, { x: action.x, y: action.y });
      else if (action.kind === 'sticker-remove') removedStickers.add(action.targetId);
    }
    output.save(); output.setTransform(1, 0, 0, 1, 0, 0); output.clearRect(0, 0, pixelWidth, pixelHeight);
    output.setTransform(pixelWidth / WIDTH, 0, 0, pixelHeight / HEIGHT, 0, 0);
    drawBackground(output, background);
    output.drawImage(colorLayer, 0, 0);
    if (pageInfo) output.drawImage(pageLayers.lineArt, 0, 0);
    output.drawImage(drawingLayer, 0, 0);
    if (!current.showBefore) {
      if (activeShapeRef.current) drawShape(output, activeShapeRef.current, true);
      for (const [id, sticker] of stickerActions) {
        if (removedStickers.has(id)) continue;
        const moved = stickerPreviewRef.current?.id === id ? stickerPreviewRef.current : stickerMoves.get(id);
        drawSticker(output, sticker, moved?.x ?? sticker.x, moved?.y ?? sticker.y);
      }
      const cursor = cursorPointRef.current;
      if (current.tool === 'sticker' && current.stickerId && cursor) {
        drawSticker(output, { kind: 'sticker', id: 'preview', stickerId: current.stickerId, x: cursor.x, y: cursor.y, size: current.stickerSize / WIDTH, rotation: current.stickerRotation });
      }
    }
    output.restore();
  }, [canvasRef, zoom, tool, stickerId, shapeType, shapeMode, stickerSize, stickerRotation]);

  useEffect(() => {
    render();
    const observer = new ResizeObserver(render);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', render);
    return () => { observer.disconnect(); window.removeEventListener('resize', render); if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [render, pageId, actions, showBefore]);

  useEffect(() => {
    const update = () => render();
    window.addEventListener('doodle-sticker-ready', update);
    return () => window.removeEventListener('doodle-sticker-ready', update);
  }, [render]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      pressure: event.pointerType === 'mouse' ? 0.75 : Math.max(0.28, event.pressure || 0.55),
    };
  };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (panMode) {
      event.currentTarget.setPointerCapture(event.pointerId);
      panPointRef.current = { x: event.clientX, y: event.clientY };
      return;
    }
    if (propsRef.current.showBefore) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const current = propsRef.current;
    const stickerMap = new Map<string, StickerAction>(); const stickerMoves = new Map<string, { x: number; y: number }>(); const removed = new Set<string>();
    for (const action of current.actions) { if (action.kind === 'sticker') { stickerMap.set(action.id, action); removed.delete(action.id); } else if (action.kind === 'sticker-transform') stickerMoves.set(action.targetId, { x: action.x, y: action.y }); else if (action.kind === 'sticker-remove') removed.add(action.targetId); }
    const hitSticker = [...stickerMap.values()].reverse().find((sticker) => {
      if (removed.has(sticker.id)) return false;
      const moved = stickerMoves.get(sticker.id) ?? sticker;
      const radius = sticker.size * .6 + .025;
      return Math.abs(point.x - moved.x) <= radius && Math.abs(point.y - moved.y) <= radius;
    });
    if (current.tool === 'move-sticker') {
      if (hitSticker) { const moved = stickerMoves.get(hitSticker.id) ?? hitSticker; stickerDragRef.current = { id: hitSticker.id, x: moved.x, y: moved.y, dx: point.x - moved.x, dy: point.y - moved.y }; stickerPreviewRef.current = { id: hitSticker.id, x: moved.x, y: moved.y }; }
      return;
    }
    if (current.tool === 'sticker') {
      if (current.stickerId) onAction({ kind: 'sticker', id: `sticker-${Date.now()}-${Math.random().toString(16).slice(2)}`, stickerId: current.stickerId, x: point.x, y: point.y, size: current.stickerSize / WIDTH, rotation: current.stickerRotation });
      return;
    }
    if (current.tool === 'eraser' && hitSticker) { onRemoveSticker(hitSticker.id); return; }
    if (tool === 'fill') {
      const regionId = getRegionAt(pageId, point.x, point.y);
      if (regionId) onFill({ kind: 'fill', layer: 'color', color, regionId, x: point.x, y: point.y });
      return;
    }
    if (current.tool === 'shape') {
      const activeLayer = 'drawing';
      activeShapeRef.current = { kind: 'shape', shape: current.shapeType, start: point, end: point, color: current.color, fillColor: current.color, mode: current.shapeMode, width: current.brushSize * WIDTH / Math.max(1, event.currentTarget.clientWidth), layer: activeLayer };
      render(); return;
    }
    const regionId = layer === 'color' && pageId ? getRegionAt(pageId, point.x, point.y) : null;
    const activeLayer = pageId ? layer : 'drawing';
    activeStrokeRef.current = {
      kind: 'stroke', layer: activeLayer, color, width: brushSize * WIDTH / Math.max(1, event.currentTarget.clientWidth),
      erase: tool === 'eraser', brush, regionId, points: [point],
    };
    render();
  };
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (panPointRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      const previous = panPointRef.current;
      const parent = wrapperRef.current;
      if (parent) { parent.scrollLeft -= event.clientX - previous.x; parent.scrollTop -= event.clientY - previous.y; }
      panPointRef.current = { x: event.clientX, y: event.clientY };
      return;
    }
    if (stickerDragRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      const point = pointFromEvent(event), drag = stickerDragRef.current;
      stickerPreviewRef.current = { id: drag.id, x: Math.max(0, Math.min(1, point.x - drag.dx)), y: Math.max(0, Math.min(1, point.y - drag.dy)) };
      if (frameRef.current) cancelAnimationFrame(frameRef.current); frameRef.current = requestAnimationFrame(render); return;
    }
    if (activeShapeRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.preventDefault(); activeShapeRef.current.end = pointFromEvent(event);
      if (frameRef.current) cancelAnimationFrame(frameRef.current); frameRef.current = requestAnimationFrame(render); return;
    }
    if (!activeStrokeRef.current && tool === 'sticker') {
      cursorPointRef.current = pointFromEvent(event);
      if (frameRef.current) cancelAnimationFrame(frameRef.current); frameRef.current = requestAnimationFrame(render); return;
    }
    if (!activeStrokeRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    activeStrokeRef.current.points.push(pointFromEvent(event));
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(render);
  };
  const finish = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (panPointRef.current) {
      panPointRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (stickerDragRef.current) {
      const drag = stickerDragRef.current, preview = stickerPreviewRef.current;
      stickerDragRef.current = null; stickerPreviewRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (preview && (Math.abs(preview.x - drag.x) > .004 || Math.abs(preview.y - drag.y) > .004)) onMoveSticker(drag.id, preview.x, preview.y);
      render(); return;
    }
    if (activeShapeRef.current) {
      const shape = activeShapeRef.current; activeShapeRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      onShape(shape); render(); return;
    }
    if (!activeStrokeRef.current) return;
    event.preventDefault();
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    render(); onStroke(stroke);
  };

  return (
    <div className="canvas-wrap" ref={wrapperRef}>
      <canvas
        aria-label="Drawing canvas"
        className="drawing-canvas"
        style={{ width: (zoom * 100) + '%', height: 'auto' }}
        ref={canvasRef}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </div>
  );
}
