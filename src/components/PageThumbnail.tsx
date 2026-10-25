import { useEffect, useRef } from 'react';
import { drawColoringPage } from '../data/illustrations';
import type { ColoringPage } from '../data/pages';

type Props = { page: ColoringPage; label: string; className?: string };

/** A small render of the same local vector source used by the full-size editor. */
export function PageThumbnail({ page, label, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.width = 280; canvas.height = 210;
    context.setTransform(canvas.width / 1000, 0, 0, canvas.height / 750, 0, 0);
    drawColoringPage(context, page);
  }, [page]);
  return <span className={`page-art-preview ${className}`} role="img" aria-label={label}><canvas ref={ref} /></span>;
}
