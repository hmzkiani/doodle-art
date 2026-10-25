import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';

export type TraceId = 'circle' | 'square' | 'triangle' | 'line' | 'curve' | '1' | '2' | 'A' | 'B' | 'a' | 'b' | 'heart' | 'smiley' | 'fish';
export const traceActivities: { id: TraceId; name: string; group: string; prompt: string }[] = [
  { id: 'line', name: 'Wiggly lines', group: 'Lines', prompt: 'Follow the dotted path from one end to the other.' },
  { id: 'curve', name: 'Curvy lines', group: 'Lines', prompt: 'Take your pencil for a slow, wavy ride.' },
  { id: 'circle', name: 'Circle', group: 'Shapes', prompt: 'Can you loop all the way around?' },
  { id: 'square', name: 'Square', group: 'Shapes', prompt: 'Follow the four friendly corners.' },
  { id: 'triangle', name: 'Triangle', group: 'Shapes', prompt: 'Trace up, across, and back home.' },
  { id: '1', name: 'Number 1', group: 'Numbers', prompt: 'Follow the big dotted number.' },
  { id: '2', name: 'Number 2', group: 'Numbers', prompt: 'Trace the number two at your own pace.' },
  { id: 'A', name: 'Letter A', group: 'Letters', prompt: 'Trace the tall letter A.' },
  { id: 'B', name: 'Letter B', group: 'Letters', prompt: 'Trace the bouncy letter B.' },
  { id: 'a', name: 'Little letter a', group: 'Letters', prompt: 'Follow the round dotted lowercase a.' },
  { id: 'b', name: 'Little letter b', group: 'Letters', prompt: 'Trace the tall stem and round bump of lowercase b.' },
  { id: 'heart', name: 'Heart', group: 'Pictures', prompt: 'Give the heart a careful outline.' },
  { id: 'smiley', name: 'Smiley face', group: 'Pictures', prompt: 'Trace a happy face and add a smile.' },
  { id: 'fish', name: 'Little fish', group: 'Pictures', prompt: 'Follow the fishy outline around its tail.' },
];

type Segment = { points: { x: number; y: number }[]; color: string; width: number };
export function TracingCanvas({ activity, onPractice }: { activity: TraceId; onPractice: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Segment[]>([]);
  const activeRef = useRef<Segment | null>(null);
  const [hasPractice, setHasPractice] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(width / 800, 0, 0, height / 600, 0, 0);
    ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, 800, 600);
    ctx.save(); ctx.strokeStyle = '#a9a1bc'; ctx.fillStyle = '#f3edff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([2, 20]);
    ctx.beginPath();
    if (activity === 'circle' || activity === 'smiley') {
      ctx.arc(400, 300, activity === 'circle' ? 175 : 150, 0, Math.PI * 2); ctx.stroke();
      if (activity === 'smiley') { ctx.setLineDash([]); ctx.fillStyle='#3f4252'; ctx.beginPath();ctx.arc(350,280,10,0,Math.PI*2);ctx.arc(450,280,10,0,Math.PI*2);ctx.fill();ctx.setLineDash([2,20]);ctx.beginPath();ctx.arc(400,300,62,.15,Math.PI-.15);ctx.stroke(); }
    } else if (activity === 'square') { ctx.roundRect(230,130,340,340,8);ctx.stroke(); }
    else if (activity === 'triangle') { ctx.moveTo(400,115);ctx.lineTo(590,455);ctx.lineTo(210,455);ctx.closePath();ctx.stroke(); }
    else if (activity === 'line') { ctx.moveTo(120,340);ctx.bezierCurveTo(220,210,310,475,410,330);ctx.bezierCurveTo(510,185,600,440,690,265);ctx.stroke(); }
    else if (activity === 'curve') { ctx.moveTo(130,380);ctx.bezierCurveTo(250,90,490,520,680,205);ctx.stroke(); }
    else if (activity === '1' || activity === '2' || activity === 'A' || activity === 'B' || activity === 'a' || activity === 'b') { ctx.setLineDash([3, 16]); ctx.font='700 430px Trebuchet MS,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(activity,400,315); }
    else if (activity === 'heart') { ctx.moveTo(400,465);ctx.bezierCurveTo(240,350,180,260,255,190);ctx.bezierCurveTo(310,135,375,177,400,222);ctx.bezierCurveTo(435,165,510,140,557,193);ctx.bezierCurveTo(630,274,560,370,400,465);ctx.stroke(); }
    else if (activity === 'fish') { ctx.ellipse(375,300,180,120,0,0,Math.PI*2);ctx.moveTo(550,300);ctx.lineTo(675,205);ctx.lineTo(675,395);ctx.closePath();ctx.stroke(); }
    ctx.restore();
    const paint = (segment: Segment) => { if (!segment.points.length) return; ctx.beginPath();ctx.strokeStyle=segment.color;ctx.lineWidth=segment.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.moveTo(segment.points[0].x*800,segment.points[0].y*600);for(const p of segment.points.slice(1))ctx.lineTo(p.x*800,p.y*600);if(segment.points.length===1)ctx.lineTo(segment.points[0].x*800+.1,segment.points[0].y*600+.1);ctx.stroke(); };
    strokesRef.current.forEach(paint); if(activeRef.current)paint(activeRef.current);
  }, [activity]);

  useEffect(() => { draw(); const observer=new ResizeObserver(draw); if(canvasRef.current)observer.observe(canvasRef.current);return()=>observer.disconnect(); }, [draw]);
  useEffect(() => { strokesRef.current=[];activeRef.current=null;setHasPractice(false);draw(); }, [activity,draw]);
  const point=(event:PointerEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))}};
  const down=(event:PointerEvent<HTMLCanvasElement>)=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);activeRef.current={points:[point(event)],color:'#e86f67',width:9};draw()};
  const move=(event:PointerEvent<HTMLCanvasElement>)=>{if(!activeRef.current)return;event.preventDefault();activeRef.current.points.push(point(event));draw()};
  const up=(event:PointerEvent<HTMLCanvasElement>)=>{if(!activeRef.current)return;event.preventDefault();strokesRef.current.push(activeRef.current);activeRef.current=null;setHasPractice(true);onPractice();draw()};
  const clear=()=>{strokesRef.current=[];activeRef.current=null;setHasPractice(false);draw()};
  return <div className="tracing-board"><canvas ref={canvasRef} aria-label="Tracing practice canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/><div className="trace-status" aria-live="polite">{hasPractice?'Lovely practice! Try again or choose a new guide.':'Follow the dotted path. There is no wrong way to practice.'}</div><button className="secondary-button" onClick={clear}>Start over</button></div>;
}
