export type StrokePoint = { x: number; y: number; pressure: number };

export type BrushId =
  | 'pencil' | 'colored-pencil' | 'soft-pencil' | 'fine-liner' | 'marker' | 'chisel-marker'
  | 'brush-pen' | 'watercolor' | 'crayon' | 'chalk' | 'pastel' | 'glitter'
  | 'spray' | 'stamp' | 'calligraphy' | 'rainbow' | 'dotted' | 'dashed' | 'zigzag' | 'neon';

export type Stroke = {
  kind?: 'stroke';
  layer?: 'color' | 'drawing';
  color: string;
  width: number;
  erase: boolean;
  brush?: BrushId;
  regionId?: number | null;
  points: StrokePoint[];
};

export type FillAction = {
  kind: 'fill';
  layer: 'color';
  color: string;
  regionId: number;
  x: number;
  y: number;
};

export type ShapeId =
  | 'circle' | 'ellipse' | 'rectangle' | 'rounded-rectangle' | 'square' | 'triangle'
  | 'right-triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'star' | 'heart'
  | 'line' | 'dashed-line' | 'arrow' | 'curve' | 'arc' | 'cloud' | 'speech-bubble' | 'free-curve';
export type ShapeMode = 'outline' | 'filled' | 'both';
export type CanvasTool = 'brush' | 'eraser' | 'fill' | 'shape' | 'sticker' | 'move-sticker';
export type BackgroundId = 'paper' | 'cream' | 'sky' | 'grass' | 'ocean' | 'space' | 'rainbow' | 'lavender' | 'peach' | 'mint';

export type ShapeAction = {
  kind: 'shape';
  shape: ShapeId;
  start: StrokePoint;
  end: StrokePoint;
  color: string;
  fillColor: string;
  mode: ShapeMode;
  width: number;
  layer: 'color' | 'drawing';
};

export type StickerAction = {
  kind: 'sticker';
  id: string;
  stickerId: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export type StickerTransformAction = { kind: 'sticker-transform'; targetId: string; x: number; y: number };
export type StickerRemoveAction = { kind: 'sticker-remove'; targetId: string };
export type BackgroundAction = { kind: 'background'; background: BackgroundId };

export type DrawingAction =
  | Stroke
  | FillAction
  | ShapeAction
  | StickerAction
  | StickerTransformAction
  | StickerRemoveAction
  | BackgroundAction;
