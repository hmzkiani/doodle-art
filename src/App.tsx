import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Brush, Check, ChevronRight,
  CircleHelp, Download, Eraser, Heart, Home, Images, Info, Palette, Pencil, Copy, Printer, WifiOff,
  Plus, RotateCcw, RotateCw, Save, Settings as SettingsIcon, Sparkles, Trash2,
  PaintBucket, ZoomIn, ZoomOut, Maximize, Eye, Search, Shuffle, Star, Hand, Shapes, Sticker, GraduationCap, Award, Move,
} from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { PageThumbnail } from './components/PageThumbnail';
import { TracingCanvas, traceActivities, type TraceId } from './components/TracingCanvas';
import { categories, coloringPages, getCategory, getPage } from './data/pages';
import { listArtworks, removeArtwork, saveArtwork, type Artwork } from './lib/artworkDb';
import { palettes } from './data/palette';
import { brushes } from './data/brushes';
import { drawColoringPage } from './data/illustrations';
import { backgroundChoices, shapeChoices, stickers } from './data/drawingObjects';
import { tutorialPreview, tutorials } from './data/learning';
import { badges, getRewardProgress, saveRewardProgress, type RewardProgress } from './lib/rewards';
import type { BackgroundAction, BackgroundId, BrushId, CanvasTool, DrawingAction, FillAction, ShapeAction, ShapeId, ShapeMode } from './types';

type Screen = 'home' | 'library' | 'gallery' | 'settings' | 'about' | 'editor' | 'learn' | 'rewards';
type Notice = { text: string; kind?: 'success' | 'error' } | null;
type LibraryMode = 'all' | 'favorites' | 'recent';
type StartOptions = { tool?: CanvasTool; panel?: 'shapes' | 'stickers' | 'backgrounds'; tutorialId?: string };
const defaultHistory: DrawingAction[][] = [[]];
const favoriteKey = 'doodle-favorite-pages';
const recentColorKey = 'doodle-recent-colors';
const recentPageKey = 'doodle-recent-pages';

function readList(key: string): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  catch { return []; }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `art-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [history, setHistory] = useState<DrawingAction[][]>(defaultHistory);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [color, setColor] = useState(() => localStorage.getItem('doodle-color') || '#ef5b65');
  const [brushSize, setBrushSize] = useState(() => Number(localStorage.getItem('doodle-size')) || 10);
  const [tool, setTool] = useState<CanvasTool>('brush');
  const [layer, setLayer] = useState<'color' | 'drawing'>('color');
  const [shapeType, setShapeType] = useState<ShapeId>('circle');
  const [shapeMode, setShapeMode] = useState<ShapeMode>('outline');
  const [stickerId, setStickerId] = useState('star');
  const [stickerSize, setStickerSize] = useState(150);
  const [stickerRotation, setStickerRotation] = useState(0);
  const [editorPanel, setEditorPanel] = useState<'shapes' | 'stickers' | 'backgrounds' | null>(null);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [traceActivity, setTraceActivity] = useState<TraceId>('circle');
  const [rewardProgress, setRewardProgress] = useState<RewardProgress>(() => getRewardProgress());
  const [brush, setBrush] = useState<BrushId>('marker');
  const [paletteName, setPaletteName] = useState<keyof typeof palettes | 'Recent'>('Basic');
  const [recentColors, setRecentColors] = useState<string[]>(() => readList(recentColorKey));
  const [showBefore, setShowBefore] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [title, setTitle] = useState('My Doodle');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [renameTarget, setRenameTarget] = useState<Artwork | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Artwork | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; confirmText: string; onConfirm: () => void } | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [showTips, setShowTips] = useState(() => localStorage.getItem('doodle-tips') !== 'off');
  const [confirmClear, setConfirmClear] = useState(() => localStorage.getItem('doodle-confirm-clear') !== 'off');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actions = history[historyIndex] ?? [];
  const selectedPage = getPage(pageId);
  const selectedCat = getCategory(selectedCategory);
  const activeTutorial = tutorials.find((item) => item.id === activeTutorialId) ?? null;
  const activeBackground = [...actions].reverse().find((action): action is BackgroundAction => action.kind === 'background')?.background ?? 'paper';
  const hasColoringActions = actions.some((action) => action.kind === 'fill' || ((action.kind === 'stroke' || action.kind === undefined) && (action.layer ?? 'color') === 'color') || (action.kind === 'shape' && action.layer === 'color'));

  useEffect(() => { void listArtworks().then(setArtworks).catch(() => undefined); }, []);
  useEffect(() => {
    const updateConnection = () => setIsOffline(!navigator.onLine);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('online', updateConnection);
    return () => {
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('online', updateConnection);
    };
  }, []);

  const toast = (text: string, kind: 'success' | 'error' = 'success') => {
    setNotice({ text, kind });
    window.setTimeout(() => setNotice(null), 2600);
  };
  const refreshArtworks = async () => {
    try { setArtworks(await listArtworks()); }
    catch { toast('Your art box could not open in this browser.', 'error'); }
  };
  const openGalleryNow = async () => {
    setDirty(false); await refreshArtworks(); setScreen('gallery');
  };
  const goGallery = async () => {
    if (screen === 'editor' && dirty) { setConfirmDialog({ title: 'Leave this picture?', message: 'Your latest marks have not been saved yet.', confirmText: 'Leave picture', onConfirm: () => { setConfirmDialog(null); void openGalleryNow(); } }); return; }
    await openGalleryNow();
  };
  const changeScreen = (next: Screen) => {
    if (screen === 'editor' && dirty) { setConfirmDialog({ title: 'Leave this picture?', message: 'Your latest marks have not been saved yet.', confirmText: 'Leave picture', onConfirm: () => { setConfirmDialog(null); setDirty(false); setScreen(next); } }); return; }
    setDirty(false); setScreen(next);
  };
  const performStartEditor = (nextPageId: string | null, options: StartOptions) => {
    const lessonTitle = options.tutorialId ? tutorials.find((item) => item.id === options.tutorialId)?.title : undefined;
    setPageId(nextPageId); setArtworkId(null); setTitle(lessonTitle ?? (nextPageId ? (getPage(nextPageId)?.title ?? 'My Doodle') : 'My Doodle'));
    setHistory([[]]); setHistoryIndex(0); setTool(options.tool ?? 'brush'); setEditorPanel(options.panel ?? null);
    setShapeType('circle'); setShapeMode('outline'); setStickerId('star'); setStickerSize(150); setStickerRotation(0);
    setActiveTutorialId(options.tutorialId ?? null); setTutorialStep(0); setShowBefore(false); setZoom(1); setPanMode(false); setDirty(false);
    if (nextPageId) { const recent = [nextPageId, ...readList(recentPageKey).filter((id) => id !== nextPageId)].slice(0, 12); localStorage.setItem(recentPageKey, JSON.stringify(recent)); }
    setScreen('editor');
  };
  const startEditor = (nextPageId: string | null = null, options: StartOptions = {}) => {
    if (screen === 'editor' && dirty) { setConfirmDialog({ title: 'Start a new picture?', message: 'Your latest marks have not been saved yet.', confirmText: 'Start new picture', onConfirm: () => { setConfirmDialog(null); setDirty(false); performStartEditor(nextPageId, options); } }); return; }
    performStartEditor(nextPageId, options);
  };
  const openArtwork = (artwork: Artwork) => {
    if (screen === 'editor' && dirty && !window.confirm('Leave this picture? Your changes have not been saved yet.')) return;
    setArtworkId(artwork.id); setPageId(artwork.pageId); setTitle(artwork.title);
    const savedActions = artwork.actions ?? (artwork.strokes ?? []).map((stroke) => ({ ...stroke, kind: 'stroke' as const, layer: 'drawing' as const }));
    setHistory([[...savedActions]]); setHistoryIndex(0); setTool('brush'); setDirty(false); setShowBefore(false); setZoom(1); setPanMode(false); setScreen('editor');
  };
  const commitAction = (action: DrawingAction) => {
    const next = [...actions, action];
    setHistory((old) => [...old.slice(0, historyIndex + 1), next]);
    setHistoryIndex((old) => old + 1); setDirty(true);
  };
  const commitFill = (fill: FillAction) => commitAction(fill);
  const commitShape = (shape: ShapeAction) => commitAction(shape);
  const moveSticker = (id: string, x: number, y: number) => commitAction({ kind: 'sticker-transform', targetId: id, x, y });
  const removeSticker = (id: string) => commitAction({ kind: 'sticker-remove', targetId: id });
  const insertPreset = (preset: string) => {
    const make = (shape: ShapeId, x1: number, y1: number, x2: number, y2: number): ShapeAction => ({
      kind: 'shape', shape, start: { x: x1, y: y1, pressure: 1 }, end: { x: x2, y: y2, pressure: 1 },
      color, fillColor: color, mode: 'outline', width: 10, layer: 'drawing',
    });
    const compositions: Record<string, ShapeAction[]> = {
      house: [make('rectangle', .34, .48, .66, .82), make('triangle', .29, .53, .71, .33), make('rectangle', .46, .67, .54, .82), make('square', .38, .56, .44, .62), make('square', .57, .56, .63, .62)],
      robot: [make('rounded-rectangle', .35, .23, .65, .62), make('circle', .42, .34, .46, .38), make('circle', .54, .34, .58, .38), make('rounded-rectangle', .43, .46, .57, .51), make('rectangle', .39, .64, .61, .82)],
      flower: [make('circle', .45, .43, .55, .53), make('circle', .45, .29, .55, .39), make('circle', .57, .42, .67, .52), make('circle', .45, .55, .55, .65), make('circle', .33, .42, .43, .52), make('curve', .5, .64, .5, .86), make('ellipse', .39, .72, .49, .78), make('ellipse', .51, .77, .61, .83)],
      car: [make('rounded-rectangle', .24, .49, .76, .7), make('rounded-rectangle', .36, .34, .65, .51), make('circle', .32, .65, .44, .77), make('circle', .59, .65, .71, .77)],
      rocket: [make('ellipse', .42, .28, .58, .7), make('triangle', .42, .34, .58, .15), make('right-triangle', .34, .55, .43, .72), make('right-triangle', .57, .55, .66, .72), make('circle', .46, .43, .54, .51)],
    };
    const presetActions = compositions[preset] ?? compositions.house;
    setHistory((old) => [...old.slice(0, historyIndex + 1), [...actions, ...presetActions]]);
    setHistoryIndex((old) => old + 1); setDirty(true);
  };
  const undo = () => setHistoryIndex((index) => Math.max(0, index - 1));
  const redo = () => setHistoryIndex((index) => Math.min(history.length - 1, index + 1));
  const clearNow = () => {
    const background = [...actions].reverse().find((action): action is BackgroundAction => action.kind === 'background');
    setHistory((old) => [...old.slice(0, historyIndex + 1), background ? [background] : []]);
    setHistoryIndex((old) => old + 1); setDirty(true);
  };
  const clearCanvas = () => {
    if (confirmClear) { setConfirmDialog({ title: 'Clear your art?', message: 'Your marks, shapes, and stickers will be removed. The coloring page and paper will stay.', confirmText: 'Clear art', onConfirm: () => { setConfirmDialog(null); clearNow(); } }); return; }
    clearNow();
  };
  const resetColoring = () => {
    const applyReset = () => {
      const next = actions.filter((action) => {
        if (action.kind === 'fill') return false;
        if (action.kind === 'stroke' || action.kind === undefined) return (action.layer ?? 'color') !== 'color';
        return !(action.kind === 'shape' && action.layer === 'color');
      });
      setHistory((old) => [...old.slice(0, historyIndex + 1), next]); setHistoryIndex((old) => old + 1); setDirty(true);
    };
    setConfirmDialog({ title: 'Start coloring again?', message: 'This will remove the page colors. Your drawing-layer marks and original outlines will stay.', confirmText: 'Reset colors', onConfirm: () => { setConfirmDialog(null); applyReset(); } });
  };
  const leaveEditor = () => {
    if (dirty) { const nextScreen = artworkId ? 'gallery' : 'library'; setConfirmDialog({ title: 'Leave this picture?', message: 'Your latest marks have not been saved yet.', confirmText: 'Leave picture', onConfirm: () => { setConfirmDialog(null); setDirty(false); setScreen(nextScreen); } }); return; }
    setDirty(false); setScreen(artworkId ? 'gallery' : 'library');
  };
  useEffect(() => {
    if (screen !== 'editor' || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [screen, dirty]);
  const saveCurrent = async () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast('The canvas is still getting ready. Try again in a moment.', 'error'); return; }
    try {
      const artwork: Artwork = {
        id: artworkId ?? makeId(), title: title.trim() || selectedPage?.title || 'My Doodle',
        pageId, actions: [...actions], thumbnail: canvas.toDataURL('image/png'), updatedAt: Date.now(),
      };
      await saveArtwork(artwork);
      const savedItems = await listArtworks(); setArtworks(savedItems);
      const progress = getRewardProgress();
      const nextProgress = {
        ...progress,
        saved: Math.max(progress.saved, savedItems.length),
        drawings: Math.max(progress.drawings, pageId === null && actions.some((action) => action.kind !== 'background') ? 1 : 0),
        colored: Math.max(progress.colored, pageId !== null && actions.some((action) => action.kind === 'fill' || (action.kind === 'stroke' && (action.layer ?? 'color') === 'color')) ? 1 : 0),
        shapes: Math.max(progress.shapes, actions.some((action) => action.kind === 'shape') ? 1 : 0),
        rainbows: Math.max(progress.rainbows, actions.some((action) => action.kind === 'stroke' && action.brush === 'rainbow') ? 1 : 0),
      };
      saveRewardProgress(nextProgress); setRewardProgress(nextProgress);
      setArtworkId(artwork.id); setTitle(artwork.title); setDirty(false); toast('Saved to My Art!');
      if (screen === 'gallery') await refreshArtworks();
    } catch { toast('Could not save this picture. Please check browser storage.', 'error'); }
  };
  const exportCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast('The canvas is still getting ready.', 'error'); return; }
    const highResolution = document.createElement('canvas'); highResolution.width = 2400; highResolution.height = 1800;
    const context = highResolution.getContext('2d');
    if (!context) { toast('This picture could not be exported.', 'error'); return; }
    context.fillStyle = '#fff'; context.fillRect(0, 0, highResolution.width, highResolution.height);
    context.drawImage(canvas, 0, 0, highResolution.width, highResolution.height);
    downloadCanvas(highResolution, `${safeFilename(title)}.png`, toast);
  };
  const printCurrent = () => { document.body.classList.add('printing-artwork'); window.setTimeout(() => { window.print(); window.setTimeout(() => document.body.classList.remove('printing-artwork'), 500); }, 50); };
  const exportBlankPage = () => {
    if (!selectedPage) { toast('Choose a coloring page first.', 'error'); return; }
    const blankPage = document.createElement('canvas'); blankPage.width = 2400; blankPage.height = 1800;
    const context = blankPage.getContext('2d');
    if (!context) { toast('This page could not be exported.', 'error'); return; }
    context.setTransform(2.4, 0, 0, 2.4, 0, 0); drawColoringPage(context, selectedPage);
    downloadCanvas(blankPage, `${safeFilename(selectedPage.title)}-blank.png`, toast);
  };
  const renameArtwork = async (artwork: Artwork) => {
    setRenameTarget(artwork); setRenameValue(artwork.title);
  };
  const saveRenamedArtwork = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) { toast('Please choose a name with at least one letter.', 'error'); return; }
    if (!renameTarget) return;
    try {
      await saveArtwork({ ...renameTarget, title: trimmed, updatedAt: Date.now() });
      await refreshArtworks(); setRenameTarget(null); toast('Picture renamed!');
    } catch { toast('This picture could not be renamed.', 'error'); }
  };
  const deleteArtwork = async (artwork: Artwork) => {
    setDeleteTarget(artwork);
  };
  const confirmDeleteArtwork = async () => {
    if (!deleteTarget) return;
    try { await removeArtwork(deleteTarget.id); await refreshArtworks(); setDeleteTarget(null); toast('Picture removed from My Art.'); }
    catch { toast('This picture could not be deleted.', 'error'); }
  };
  const exportArtwork = async (artwork: Artwork) => {
    try {
      const response = await fetch(artwork.thumbnail); const blob = await response.blob();
      if (!blob.size || !blob.type.includes('image/png')) throw new Error('No PNG data');
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${safeFilename(artwork.title)}.png`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500); toast('PNG download started.');
    } catch { toast('This picture could not be exported.', 'error'); }
  };

  const duplicateArtwork = async (artwork: Artwork) => {
    try {
      const copy = { ...artwork, id: makeId(), title: `${artwork.title.slice(0, 38)} copy`, updatedAt: Date.now() };
      await saveArtwork(copy); await refreshArtworks(); setArtworks(await listArtworks()); toast('A copy was added to My Art!');
    } catch { toast('This picture could not be copied.', 'error'); }
  };

  const openLearn = () => { setScreen('learn'); };
  const openLibrary = () => { setLibraryMode('all'); setSelectedCategory(null); setScreen('library'); };
  const openFavorites = () => { setLibraryMode('favorites'); setSelectedCategory(null); setScreen('library'); };
  const openRecent = () => { setLibraryMode('recent'); setSelectedCategory(null); setScreen('library'); };
  const startTutorial = (tutorialId: string) => startEditor(null, { tutorialId });
  const finishTutorial = () => {
    const progress = getRewardProgress(); const next = { ...progress, tutorials: 1 };
    saveRewardProgress(next); setRewardProgress(next); setTutorialStep(activeTutorial?.steps.length ?? 0); toast('Lesson complete! Great drawing!');
  };
  const recordTrace = () => {
    if (rewardProgress.traces) return;
    const next = { ...getRewardProgress(), traces: 1 }; saveRewardProgress(next); setRewardProgress(next);
  };
  const openRewards = () => { setRewardProgress(getRewardProgress()); setScreen('rewards'); };
  const chooseColor = (next: string) => {
    setColor(next); localStorage.setItem('doodle-color', next); setTool('brush');
    const updated = [next, ...recentColors.filter((entry) => entry !== next)].slice(0, 12);
    setRecentColors(updated); localStorage.setItem(recentColorKey, JSON.stringify(updated));
  };

  return (
    <div className="app-shell">
      {isOffline && <div className="offline-indicator" role="status"><WifiOff size={15} /><span>Offline mode · Your art stays on this device</span></div>}
      <header className="topbar">
        <button className="brand" onClick={() => changeScreen('home')} aria-label="Doodle Land home">
          <img src="/doodle-land-logo.svg" alt="Doodle Land — Little Artist, Big Ideas by Hmzkiani" />
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={screen === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => changeScreen('home')}><Home size={17} /> Home</button>
          <button className={screen === 'library' ? 'nav-link active' : 'nav-link'} onClick={() => { setSelectedCategory(null); changeScreen('library'); }}><BookOpen size={17} /> Coloring pages</button>
          <button className={screen === 'gallery' ? 'nav-link active' : 'nav-link'} onClick={goGallery}><Images size={17} /> My Art</button>
          <button className={screen === 'learn' ? 'nav-link active' : 'nav-link'} onClick={openLearn}><GraduationCap size={17} /> Learn</button>
        </nav>
        <div className="topbar-right">
          <button className="icon-button help-button" aria-label="About Doodle Land" onClick={() => changeScreen('about')}><CircleHelp size={19} /></button>
          <button className="icon-button" aria-label="Settings" onClick={() => changeScreen('settings')}><SettingsIcon size={19} /></button>
          <button className="top-create" onClick={() => startEditor()}><Plus size={18} /> New picture</button>
        </div>
      </header>

      <main className={screen === 'editor' ? 'main-content editor-main' : 'main-content'}>
        {screen === 'home' && <HomeScreen startEditor={startEditor} openLibrary={openLibrary} goGallery={goGallery} openShapes={() => startEditor(null, { tool: 'shape', panel: 'shapes' })} openStickers={() => startEditor(null, { tool: 'sticker', panel: 'stickers' })} openLearn={openLearn} openFavorites={openFavorites} openRecent={openRecent} openRewards={openRewards} openArtwork={openArtwork} artworks={artworks} />}
        {screen === 'library' && <LibraryScreen key={libraryMode} initialMode={libraryMode} selectedCategory={selectedCategory} onCategory={setSelectedCategory} onOpenPage={startEditor} onBack={() => setSelectedCategory(null)} />}
        {screen === 'gallery' && <GalleryScreen artworks={artworks} refresh={refreshArtworks} openArtwork={openArtwork} renameArtwork={renameArtwork} deleteArtwork={deleteArtwork} exportArtwork={exportArtwork} duplicateArtwork={duplicateArtwork} startEditor={() => startEditor()} />}
        {screen === 'settings' && <SettingsScreen brushSize={brushSize} setBrushSize={(size) => { setBrushSize(size); localStorage.setItem('doodle-size', String(size)); }} color={color} setColor={(next) => { setColor(next); localStorage.setItem('doodle-color', next); }} showTips={showTips} setShowTips={(next) => { setShowTips(next); localStorage.setItem('doodle-tips', next ? 'on' : 'off'); }} confirmClear={confirmClear} setConfirmClear={(next) => { setConfirmClear(next); localStorage.setItem('doodle-confirm-clear', next ? 'on' : 'off'); }} onAbout={() => setScreen('about')} />}
        {screen === 'about' && <AboutScreen onBack={() => setScreen('home')} />}
        {screen === 'learn' && <LearningScreen onBack={() => setScreen('home')} onStartTutorial={startTutorial} selectedTrace={traceActivity} onTraceChange={setTraceActivity} onTraceActivity={recordTrace} />}
        {screen === 'rewards' && <RewardsScreen progress={rewardProgress} onBack={() => setScreen('home')} />}
        {screen === 'editor' && (
          <section className="editor-screen">
            <div className="editor-heading">
              <button className="back-button" onClick={leaveEditor}><ArrowLeft size={18} /> Back</button>
              <div className="editor-title"><span className="eyebrow">{selectedPage ? `${selectedCat?.name ?? 'Coloring page'} · ${selectedPage.title}` : 'Your own canvas'}</span><input aria-label="Picture name" value={title} maxLength={48} onChange={(event) => { setTitle(event.target.value); setDirty(true); }} /></div>
              <div className="editor-actions">
                <button className="tool-button" disabled={!dirty} onClick={saveCurrent}><Save size={17} /><span>Save</span></button>
                <button className="tool-button export-button" onClick={exportCurrent}><Download size={17} /><span>PNG HD</span></button>
                <button className="tool-button" onClick={printCurrent}><Printer size={17} /><span>Print</span></button>
                {selectedPage && <button className="tool-button" onClick={exportBlankPage}><BookOpen size={17} /><span>Blank page</span></button>}
              </div>
            </div>
            <div className="editor-layout">
              <aside className="tool-panel">
                <div className="tool-group color-picker-group">
                  <div className="tool-heading"><Palette size={17} /> <span>Pick a color</span></div>
                  <div className="palette-tabs">{Object.keys(palettes).map((name) => <button key={name} className={paletteName === name ? 'active' : ''} onClick={() => setPaletteName(name as keyof typeof palettes)}>{name}</button>)}<button className={paletteName === 'Recent' ? 'active' : ''} onClick={() => setPaletteName('Recent')}>Recent</button></div>
                  <div className="swatch-grid">
                    {(paletteName === 'Recent' ? recentColors : palettes[paletteName]).filter((swatch, index, list) => list.indexOf(swatch) === index).map((swatch) => <button key={swatch} className={'swatch ' + (color === swatch ? 'selected ' : '') + (swatch === '#ffffff' ? 'white-swatch' : '')} style={{ backgroundColor: swatch }} onClick={() => chooseColor(swatch)} aria-label={'Choose ' + swatch + ' brush'} />)}
                    <label className="custom-color" title="Choose any color"><input aria-label="Choose any color" type="color" value={color} onChange={(event) => chooseColor(event.target.value)} /><span>+</span></label>
                  </div>
                </div>
                <div className="tool-group brush-picker-group">
                  <div className="tool-heading"><Brush size={17} /> <span>Choose a brush <b>{brushes.find((item) => item.id === brush)?.name}</b></span></div>
                  <div className="brush-grid">{brushes.map((item) => <button key={item.id} className={brush === item.id ? 'brush-choice active' : 'brush-choice'} onClick={() => { setBrush(item.id); setTool('brush'); }} title={item.name} aria-label={item.name}><span>{item.icon}</span><small>{item.name}</small></button>)}</div>
                </div>
                <div className="tool-group size-group">
                  <label className="tool-heading" htmlFor="brush-size"><Brush size={17} /><span>Brush size <b>{brushSize}</b></span></label>
                  <input id="brush-size" type="range" min="3" max="45" value={brushSize} onChange={(event) => { const next = Number(event.target.value); setBrushSize(next); localStorage.setItem('doodle-size', String(next)); }} />
                  <div className="size-labels"><span>Little</span><span>Big</span></div>
                </div>
                <div className="tool-group tool-buttons-group">
                  <div className="tool-heading"><Pencil size={17} /> <span>Drawing tools</span></div>
                  <div className="drawing-tools">
                    <button className={'drawing-tool ' + (tool === 'brush' ? 'selected' : '')} onClick={() => setTool('brush')}><Brush size={18} /> Brush</button>
                    <button className={'drawing-tool ' + (tool === 'eraser' ? 'selected' : '')} onClick={() => setTool('eraser')}><Eraser size={18} /> Eraser</button>
                    <button className={'drawing-tool ' + (tool === 'fill' ? 'selected' : '')} onClick={() => { setTool('fill'); setLayer('color'); }}><PaintBucket size={18} /> Fill</button>
                  </div>
                  {selectedPage && <div className="layer-switch"><span>Paint on</span><button className={layer === 'color' ? 'active' : ''} onClick={() => setLayer('color')}>Under lines</button><button className={layer === 'drawing' ? 'active' : ''} onClick={() => setLayer('drawing')}>On top</button></div>}
                </div>
                <div className="studio-shortcuts">
                  <button className={editorPanel === 'shapes' ? 'active' : ''} onClick={() => { setEditorPanel(editorPanel === 'shapes' ? null : 'shapes'); setTool('shape'); }}><Shapes size={16} /> Shapes</button>
                  <button className={editorPanel === 'stickers' ? 'active' : ''} onClick={() => { setEditorPanel(editorPanel === 'stickers' ? null : 'stickers'); setTool('sticker'); }}><Sticker size={16} /> Stickers</button>
                  <button className={editorPanel === 'backgrounds' ? 'active' : ''} onClick={() => setEditorPanel(editorPanel === 'backgrounds' ? null : 'backgrounds')}><Palette size={16} /> Paper</button>
                </div>
                {editorPanel === 'shapes' && <div className="tool-group object-panel">
                  <div className="tool-heading"><Shapes size={17} /><span>Pick a shape <b>{shapeChoices.find((item) => item.id === shapeType)?.name}</b></span></div>
                  <div className="shape-grid">{shapeChoices.map((shape) => <button key={shape.id} className={shapeType === shape.id ? 'active' : ''} title={shape.name} aria-label={shape.name} onClick={() => { setShapeType(shape.id); setTool('shape'); }}><span>{shape.icon}</span><small>{shape.name}</small></button>)}</div>
                  <div className="shape-mode-row" aria-label="Shape fill mode">{(['outline', 'filled', 'both'] as const).map((mode) => <button key={mode} className={shapeMode === mode ? 'active' : ''} onClick={() => setShapeMode(mode)}>{mode === 'both' ? 'Fill + line' : mode}</button>)}</div>
                  <p className="object-tip">Choose a shape, then drag on your paper. The selected brush color is used for its line and fill.</p>
                  <div className="preset-row"><span>Quick pictures</span>{[['house','🏠'],['robot','🤖'],['flower','🌼'],['car','🚗'],['rocket','🚀']].map(([name,icon])=><button key={name} onClick={() => insertPreset(name)} aria-label={`Add ${name} shape preset`} title={`Add ${name}`}>{icon}</button>)}</div>
                </div>}
                {editorPanel === 'stickers' && <div className="tool-group object-panel">
                  <div className="tool-heading"><Sticker size={17} /><span>Little decorations <b>{stickers.find((item) => item.id === stickerId)?.name}</b></span></div>
                  <div className="sticker-grid">{stickers.map((item) => <button key={item.id} className={stickerId === item.id ? 'active' : ''} title={`${item.name} · ${item.group}`} aria-label={`Choose ${item.name} sticker`} onClick={() => { setStickerId(item.id); setTool('sticker'); }}><span dangerouslySetInnerHTML={{ __html: item.svg }} /><small>{item.name}</small></button>)}</div>
                  <label className="object-range">Sticker size <b>{stickerSize}px</b><input type="range" min="70" max="280" value={stickerSize} onChange={(event) => setStickerSize(Number(event.target.value))} /></label>
                  <label className="object-range">Turn sticker <b>{stickerRotation}°</b><input type="range" min="-180" max="180" value={stickerRotation} onChange={(event) => setStickerRotation(Number(event.target.value))} /></label>
                  <button className={tool === 'move-sticker' ? 'move-sticker-button active' : 'move-sticker-button'} onClick={() => setTool(tool === 'move-sticker' ? 'sticker' : 'move-sticker')}><Move size={15} /> Move a sticker</button>
                  <p className="object-tip">Tap to place. Choose Move a sticker and drag to reposition it. The eraser removes a sticker you tap.</p>
                </div>}
                {editorPanel === 'backgrounds' && <div className="tool-group object-panel">
                  <div className="tool-heading"><Palette size={17} /><span>Choose your paper <b>{backgroundChoices.find((item) => item.id === activeBackground)?.title}</b></span></div>
                  <div className="background-grid">{backgroundChoices.map((item) => <button key={item.id} className={activeBackground === item.id ? 'active' : ''} onClick={() => commitAction({ kind: 'background', background: item.id as BackgroundId })} aria-label={`Use ${item.title} background`}><span style={{ backgroundColor: item.color }}>{item.icon}</span><small>{item.title}</small></button>)}</div>
                  <button className="secondary-button reset-paper" onClick={() => commitAction({ kind: 'background', background: 'paper' })}>Reset to white paper</button>
                  <p className="object-tip">Your paper stays behind the coloring, drawing, and line art.</p>
                </div>}
                <div className="canvas-controls tool-group">
                  <div className="view-controls"><button onClick={() => setZoom((value) => Math.max(.75, Math.round((value - .25) * 100) / 100))} aria-label="Zoom out"><ZoomOut size={16} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(2, Math.round((value + .25) * 100) / 100))} aria-label="Zoom in"><ZoomIn size={16} /></button><button onClick={() => { setZoom(1); setPanMode(false); }} aria-label="Fit page"><Maximize size={16} /></button><button className={panMode ? 'active' : ''} onClick={() => setPanMode((value) => !value)} aria-label="Pan canvas" title="Drag to move the zoomed page"><Hand size={16} /></button></div>
                  {selectedPage && <button className="view-toggle" onClick={() => setShowBefore((value) => !value)}><Eye size={15} /> {showBefore ? 'Show my colors' : 'Before / after'}</button>}
                </div>
                <div className="editor-undo-row">
                  <button className="round-tool" disabled={historyIndex === 0} onClick={undo} aria-label="Undo"><RotateCcw size={18} /><span>Undo</span></button>
                  <button className="round-tool" disabled={historyIndex >= history.length - 1} onClick={redo} aria-label="Redo"><RotateCw size={18} /><span>Redo</span></button>
                  <button className="round-tool clear-tool" disabled={!actions.some((action) => action.kind !== 'background')} onClick={clearCanvas} aria-label="Clear drawing"><Trash2 size={18} /><span>Clear art</span></button>
                  {selectedPage && <button className="round-tool clear-tool" disabled={!hasColoringActions} onClick={resetColoring} aria-label="Reset coloring"><RotateCcw size={18} /><span>Reset color</span></button>}
                </div>
                {showTips && <p className="touch-tip">✦ Tap a closed space to fill it. Drag to draw a shape. Your eraser leaves the original outlines safe.</p>}
              </aside>
              <div className="canvas-stage">
                {activeTutorial && <div className="tutorial-coach"><span className="tutorial-coach-icon">{activeTutorial.emoji}</span><div><span className="eyebrow">DRAW TOGETHER · STEP {Math.min(tutorialStep + 1, activeTutorial.steps.length)} OF {activeTutorial.steps.length}</span><b>{activeTutorial.title}</b><p>{tutorialStep < activeTutorial.steps.length ? activeTutorial.steps[tutorialStep] : activeTutorial.finish}</p></div><div className="tutorial-actions"><button className="secondary-button" onClick={() => setConfirmDialog({ title: 'Start this lesson over?', message: 'Your marks in this lesson will be cleared so you can begin again.', confirmText: 'Restart lesson', onConfirm: () => { setConfirmDialog(null); setHistory([[]]); setHistoryIndex(0); setDirty(false); setTutorialStep(0); } })}>Restart</button>{tutorialStep < activeTutorial.steps.length ? <button className="primary-button" onClick={() => tutorialStep + 1 >= activeTutorial.steps.length ? finishTutorial() : setTutorialStep(tutorialStep + 1)}><ChevronRight size={16} /> Next</button> : <button className="primary-button" onClick={() => setActiveTutorialId(null)}>Keep drawing <Sparkles size={15} /></button>}</div></div>}
                <div className="canvas-label"><span><span className="live-dot" /> Your paper</span><span>{actions.length ? actions.length + ' ' + (actions.length === 1 ? 'mark' : 'marks') : 'Ready for color!'}</span></div>
                <DrawingCanvas pageId={pageId} actions={actions} color={color} brushSize={brushSize} brush={brush} tool={tool} layer={layer} shapeType={shapeType} shapeMode={shapeMode} stickerId={stickerId} stickerSize={stickerSize} stickerRotation={stickerRotation} showBefore={showBefore} zoom={zoom} panMode={panMode} onStroke={commitAction} onAction={commitAction} onFill={commitFill} onShape={commitShape} onRemoveSticker={removeSticker} onMoveSticker={moveSticker} canvasRef={canvasRef} />
                <p className="canvas-caption"><Sparkles size={14} /> Every picture is yours to make your own</p>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="footer"><span>Made for little imaginations <Heart size={13} fill="currentColor" /></span><span>Works on this device · No accounts · No ads</span><button className="my-stars-link" onClick={openRewards}><Award size={14} /> My stars</button><button onClick={() => changeScreen('about')}>About</button></footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={screen === 'home' ? 'active' : ''} onClick={() => changeScreen('home')}><Home size={19} /><span>Home</span></button>
        <button className={screen === 'library' ? 'active' : ''} onClick={() => { setSelectedCategory(null); changeScreen('library'); }}><BookOpen size={19} /><span>Pages</span></button>
        <button className={screen === 'gallery' ? 'active' : ''} onClick={goGallery}><Images size={19} /><span>My Art</span></button>
        <button className={screen === 'settings' ? 'active' : ''} onClick={() => changeScreen('settings')}><SettingsIcon size={19} /><span>Settings</span></button>
      </nav>
      {confirmDialog && <div className="modal-backdrop" onClick={() => setConfirmDialog(null)}><div className="rename-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}><span className="eyebrow">A quick check</span><h2 id="confirm-title">{confirmDialog.title}</h2><p className="delete-dialog-copy">{confirmDialog.message}</p><div className="rename-actions"><button type="button" className="secondary-button" onClick={() => setConfirmDialog(null)}>Keep drawing</button><button type="button" className="primary-button" onClick={confirmDialog.onConfirm}>{confirmDialog.confirmText}</button></div></div></div>}
      {renameTarget && <div className="modal-backdrop" onClick={() => setRenameTarget(null)}><form className="rename-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-title" onClick={(event) => event.stopPropagation()} onSubmit={saveRenamedArtwork}><span className="eyebrow">My Art box</span><h2 id="rename-title">Give it a new name</h2><label htmlFor="rename-picture">Picture name</label><input id="rename-picture" autoFocus maxLength={48} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><div className="rename-actions"><button type="button" className="secondary-button" onClick={() => setRenameTarget(null)}>Cancel</button><button type="submit" className="primary-button">Save name</button></div></form></div>}
      {deleteTarget && <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}><div className="rename-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(event) => event.stopPropagation()}><span className="eyebrow">My Art box</span><h2 id="delete-title">Remove this picture?</h2><p className="delete-dialog-copy">“{deleteTarget.title}” will be removed from this device.</p><div className="rename-actions"><button type="button" className="secondary-button" onClick={() => setDeleteTarget(null)}>Keep picture</button><button type="button" className="delete-confirm-button" onClick={() => void confirmDeleteArtwork()}>Remove picture</button></div></div></div>}
      {notice && <div role="status" className={'toast ' + (notice.kind === 'error' ? 'toast-error' : '')}><Check size={17} /> {notice.text}</div>}
    </div>
  );
}

function HomeScreen({ startEditor, openLibrary, goGallery, openShapes, openStickers, openLearn, openFavorites, openRecent, openRewards, openArtwork, artworks }: {
  startEditor: (pageId?: string | null) => void; openLibrary: () => void; goGallery: () => void;
  openShapes: () => void; openStickers: () => void; openLearn: () => void; openFavorites: () => void;
  openRecent: () => void; openRewards: () => void; openArtwork: (artwork: Artwork) => void; artworks: Artwork[];
}) {
  const favorites = readList(favoriteKey);
  const recentPages = readList(recentPageKey).map((id) => getPage(id)).filter((page): page is NonNullable<typeof page> => Boolean(page));
  const favoritePages = coloringPages.filter((page) => favorites.includes(page.id)).slice(0, 4);
  const featured = [coloringPages[0], coloringPages[34], coloringPages[50], coloringPages[75]];
  return (
    <div className="home-screen">
      <section className="hero-card">
        <div className="hero-copy"><img className="home-logo" src="/doodle-land-logo.svg" alt="Doodle Land — Little Artist, Big Ideas by Hmzkiani" /><span className="hero-pill"><Sparkles size={14} /> A happy place to make things</span><h1>Little Artist,<br /><em>Big Ideas.</em></h1><p>Pick a picture, choose your colors, and let your imagination shine!</p><div className="hero-actions"><button className="primary-button" onClick={() => startEditor()}><Pencil size={18} /> Start Creating! <ArrowRight size={17} /></button><button className="secondary-button" onClick={openLibrary}><BookOpen size={17} /> Explore Coloring Pages</button></div><div className="hero-note"><Heart size={15} fill="currentColor" /> No wrong turns in your art adventure</div></div>
        <div className="hero-art" aria-hidden="true"><span className="hero-sun" /><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✧</span><span className="hero-cloud cloud-one" /><span className="hero-cloud cloud-two" /><div className="hero-crayon crayon-red" /><div className="hero-crayon crayon-yellow" /><div className="hero-crayon crayon-blue" /><div className="hero-paper"><span>☺</span><i>~</i><b>✿</b></div><div className="hero-bear">🐻</div><div className="hero-credit">Little Artist, Big Ideas <b>by Hmzkiani</b></div></div>
      </section>
      <section className="quick-start-row"><div><span className="eyebrow">Pick your next adventure</span><h2>Make something lovely</h2></div><button className="text-link" onClick={openRewards}><Award size={16} /> My stars</button></section>
      <div className="studio-feature-grid">
        <button className="studio-feature feature-color" onClick={openLibrary}><span className="feature-art">🖍️</span><b>Coloring Pages</b><small>{coloringPages.length} pictures to explore</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-draw" onClick={() => startEditor()}><span className="feature-art">✏️</span><b>Free Drawing</b><small>Make a picture from scratch</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-shapes" onClick={openShapes}><span className="feature-art">🔷</span><b>Shapes &amp; Stencils</b><small>Build art from simple shapes</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-stickers" onClick={openStickers}><span className="feature-art">🌼</span><b>Stickers &amp; Stamps</b><small>Add a little extra sparkle</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-learn" onClick={openLearn}><span className="feature-art">📖</span><b>Learn to Draw</b><small>Try a step-by-step lesson</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-artbox" onClick={goGallery}><span className="feature-art">🖼️</span><b>My Artwork</b><small>{artworks.length ? `${artworks.length} saved picture${artworks.length===1?'':'s'}` : 'Your art lives here'}</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-recent" onClick={openRecent}><span className="feature-art">🕒</span><b>Recently Opened</b><small>{recentPages.length ? `${recentPages.length} page${recentPages.length===1?'':'s'} to revisit` : 'Your first page is waiting'}</small><ArrowRight size={17} /></button>
        <button className="studio-feature feature-favorites" onClick={openFavorites}><span className="feature-art">⭐</span><b>Favorites</b><small>{favorites.length ? `${favorites.length} favorite page${favorites.length===1?'':'s'}` : 'Save pages you love'}</small><ArrowRight size={17} /></button>
      </div>
      {artworks.length > 0 && <section className="home-shelf"><div className="section-heading"><div><span className="eyebrow">Proudly made by you</span><h2>Recently saved art</h2></div><button className="text-link" onClick={goGallery}>See your art box <ArrowRight size={15} /></button></div><div className="home-art-strip">{artworks.slice(0, 4).map((artwork) => <button key={artwork.id} onClick={() => openArtwork(artwork)}><img src={artwork.thumbnail} alt="" /><b>{artwork.title}</b><small>{new Date(artwork.updatedAt).toLocaleDateString()}</small></button>)}</div></section>}
      {favoritePages.length > 0 && <section className="home-shelf"><div className="section-heading"><div><span className="eyebrow">Pages you picked</span><h2>Your favorites</h2></div><button className="text-link" onClick={openFavorites}>All favorites <ArrowRight size={15} /></button></div><div className="home-page-strip">{favoritePages.map((page) => <button key={page.id} onClick={() => startEditor(page.id)}><PageThumbnail page={page} label={`${page.title} preview`} /><b>{page.title}</b></button>)}</div></section>}
      {recentPages.length > 0 && <section className="home-shelf"><div className="section-heading"><div><span className="eyebrow">Pick up your adventure</span><h2>Recently opened pages</h2></div><button className="text-link" onClick={openRecent}>See recent pages <ArrowRight size={15} /></button></div><div className="home-page-strip">{recentPages.slice(0,4).map((page) => <button key={page.id} onClick={() => startEditor(page.id)}><PageThumbnail page={page} label={`${page.title} preview`} /><b>{page.title}</b></button>)}</div></section>}
      <section className="featured-section"><div className="section-heading"><div><span className="eyebrow">A few happy pages</span><h2>Pick a little adventure</h2></div><button className="text-link" onClick={openLibrary}>Browse all {coloringPages.length} <ArrowRight size={16} /></button></div><div className="featured-grid">{featured.map((page, index) => { const category = getCategory(page.categoryId); return <button className={`featured-card featured-${index}`} key={page.id} onClick={() => startEditor(page.id)}><PageThumbnail page={page} label={`${page.title} coloring preview`} /><span className="featured-category">{category?.name}</span><b>{page.title}</b><span className="color-now">Color this <ArrowRight size={14} /></span></button>; })}</div></section>
      <section className="home-bottom"><div><span>🌈</span><b>Make a little mess.</b><small>Everything stays on this device.</small></div><button onClick={goGallery}>Visit My Art <ArrowRight size={15} /></button></section>
      {favoritePages.length === 0 && recentPages.length === 0 && artworks.length === 0 && <div className="home-empty-note"><Sparkles size={19} /><span><b>Your art adventure starts here.</b><small>Save a drawing, open a page, or add a favorite. Your recent work will appear on this screen.</small></span></div>}
    </div>
  );
}

function LibraryScreen({ selectedCategory, onCategory, onOpenPage, onBack, initialMode }: { selectedCategory: string | null; onCategory: (id: string | null) => void; onOpenPage: (pageId: string) => void; onBack: () => void; initialMode: LibraryMode }) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [favoriteOnly, setFavoriteOnly] = useState(initialMode === 'favorites');
  const [showAll, setShowAll] = useState(initialMode !== 'all');
  const [favorites, setFavorites] = useState<string[]>(() => readList(favoriteKey));
  const [recentPages] = useState<string[]>(() => readList(recentPageKey));
  const category = getCategory(selectedCategory);
  const hasFilters = query.trim().length > 0 || difficulty !== 'All' || favoriteOnly || initialMode === 'recent';
  const visiblePages = useMemo(() => coloringPages.filter((page) => {
    if (selectedCategory && page.categoryId !== selectedCategory) return false;
    if (difficulty !== 'All' && page.difficulty !== difficulty) return false;
    if (favoriteOnly && !favorites.includes(page.id)) return false;
    if (initialMode === 'recent' && !recentPages.includes(page.id)) return false;
    const cat = getCategory(page.categoryId);
    const search = query.trim().toLowerCase();
    return !search || page.title.toLowerCase().includes(search) || (cat?.name.toLowerCase().includes(search) ?? false);
  }).sort((left, right) => initialMode === 'recent' ? recentPages.indexOf(left.id) - recentPages.indexOf(right.id) : 0), [selectedCategory, difficulty, favoriteOnly, favorites, query, initialMode, recentPages]);
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((page) => page !== id) : [...favorites, id];
    setFavorites(next); localStorage.setItem(favoriteKey, JSON.stringify(next));
  };
  const randomPage = () => {
    if (!visiblePages.length) return;
    const pool = visiblePages;
    onOpenPage(pool[Math.floor(Math.random() * pool.length)].id);
  };
  const filters = <div className="library-filters">
    <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and themes" aria-label="Search coloring pages" /></label>
    <select value={selectedCategory ?? ''} onChange={(event) => onCategory(event.target.value || null)} aria-label="Filter by theme"><option value="">All themes</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty"><option>All</option><option>Easy</option><option>Medium</option><option>Advanced</option></select>
    <button className={favoriteOnly ? 'filter-pill active' : 'filter-pill'} onClick={() => setFavoriteOnly((value) => !value)}><Heart size={15} fill={favoriteOnly ? 'currentColor' : 'none'} /> Favorites</button>
    <button className="filter-pill random-pill" disabled={!visiblePages.length} onClick={randomPage}><Shuffle size={15} /> Pick for me</button>
  </div>;
  const pageGrid = <div className="page-grid">{visiblePages.map((page, index) => { const item = getCategory(page.categoryId); return <div className="page-card-wrap" key={page.id}><button className="page-card" onClick={() => onOpenPage(page.id)}><div className={'page-preview page-preview-' + (index % 5)}><PageThumbnail page={page} label={`${page.title} sketch preview`} /><small>{page.difficulty}</small></div><div className="page-card-copy"><b>{page.title}</b><span>Color Me! <ArrowRight size={13} /></span><small>{item?.name}</small></div></button><button className={favorites.includes(page.id) ? 'favorite-page active' : 'favorite-page'} onClick={() => toggleFavorite(page.id)} aria-label={(favorites.includes(page.id) ? 'Remove ' : 'Add ') + page.title + ' ' + (favorites.includes(page.id) ? 'from' : 'to') + ' favorites'}><Star size={16} fill={favorites.includes(page.id) ? 'currentColor' : 'none'} /></button></div>; })}</div>;
  if (category) return <section className="library-screen"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> All themes</button><div className="page-title-row"><PageThumbnail page={coloringPages.find((item) => item.categoryId === category.id)!} label={`${category.name} sample drawing`} className="category-big-art" /><div><span className="eyebrow">{category.titles.length} original coloring pages</span><h1>{category.name}</h1><p>{category.description}</p></div></div>{filters}<div className="catalog-heading"><b>{visiblePages.length} pages</b><button className="text-link" onClick={randomPage}><Shuffle size={15} /> Surprise me</button></div>{visiblePages.length ? pageGrid : <div className="empty-gallery compact-empty"><span>🔎</span><h2>No pages found</h2><p>Try a different search or filter.</p></div>}</section>;
  return <section className="library-screen"><div className="library-heading"><div><span className="eyebrow">Little adventures for every mood</span><h1>Coloring pages</h1><p>Search, pick a theme, or let us choose a surprise.</p></div><span className="page-count"><BookOpen size={17} /> {coloringPages.length} pages · {categories.length} themes</span></div>{filters}
    {(hasFilters || showAll) ? <><div className="catalog-heading"><b>{initialMode === 'favorites' ? 'Favorite pages' : initialMode === 'recent' ? 'Recently opened pages' : `${visiblePages.length} matching pages`}</b><button className="text-link" onClick={() => { setFavoriteOnly(false); setShowAll(true); }}>Browse all {coloringPages.length} <ArrowRight size={15} /></button></div>{visiblePages.length ? pageGrid : <div className="empty-gallery compact-empty"><span>{initialMode === 'favorites' ? '⭐' : '🔎'}</span><h2>{initialMode === 'favorites' ? 'No favorite pages yet' : initialMode === 'recent' ? 'No recent pages yet' : 'No pages found'}</h2><p>{initialMode === 'favorites' ? 'Tap a star on any coloring page to keep it here.' : initialMode === 'recent' ? 'Open a coloring page and it will appear here.' : 'Try another word, theme, or difficulty.'}</p></div>}</> : <><div className="catalog-heading"><b>Choose a theme</b><button className="text-link" onClick={() => setShowAll(true)}>Browse all {coloringPages.length} pages <ArrowRight size={15} /></button></div><div className="category-grid">{categories.map((item, index) => { const sample = coloringPages.find((page) => page.categoryId === item.id)!; return <button key={item.id} className={'category-card category-card-' + index} onClick={() => onCategory(item.id)} style={{ '--cat-color': item.color, '--cat-soft': item.soft } as React.CSSProperties}><PageThumbnail page={sample} label={`${item.name} sample sketch`} className="category-card-art" /><span className="category-copy"><b>{item.name}</b><small>{item.description}</small><em>{item.titles.length} pages <ChevronRight size={14} /></em></span><span className="category-decoration">✦</span></button>; })}</div>{recentPages.length > 0 && <div className="recent-pages"><h2>Pick up where you left off</h2><div>{recentPages.map((id) => { const page = getPage(id); const item = page && getCategory(page.categoryId); return page ? <button key={id} onClick={() => onOpenPage(id)}>{item?.emoji} {page.title} <ArrowRight size={13} /></button> : null; })}</div></div>}</>}
  </section>;
}

function GalleryScreen({ artworks, refresh, openArtwork, renameArtwork, deleteArtwork, exportArtwork, duplicateArtwork, startEditor }: { artworks: Artwork[]; refresh: () => Promise<void>; openArtwork: (artwork: Artwork) => void; renameArtwork: (artwork: Artwork) => void; deleteArtwork: (artwork: Artwork) => void; exportArtwork: (artwork: Artwork) => void; duplicateArtwork: (artwork: Artwork) => void; startEditor: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readList('doodle-favorite-artworks'));
  const shownArtworks = artworks.filter((artwork) => (!favoritesOnly || favoriteIds.includes(artwork.id)) && (!query.trim() || artwork.title.toLowerCase().includes(query.trim().toLowerCase())));
  const toggleFavorite = (id: string) => { const next = favoriteIds.includes(id) ? favoriteIds.filter((item) => item !== id) : [...favoriteIds, id]; setFavoriteIds(next); localStorage.setItem('doodle-favorite-artworks', JSON.stringify(next)); };
  useEffect(() => { void refresh().finally(() => setLoaded(true)); }, []);
  return <section className="gallery-screen"><div className="library-heading"><div><span className="eyebrow">All your little masterpieces</span><h1>My Artwork</h1><p>Your pictures are kept privately on this device.</p></div><button className="primary-button small-primary" onClick={startEditor}><Plus size={17} /> New picture</button></div>
    {!loaded ? <div className="loading-card">Opening your art box…</div> : artworks.length ? <><div className="gallery-filters"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a picture by name" aria-label="Search saved pictures" /></label><button className={favoritesOnly ? 'filter-pill active' : 'filter-pill'} onClick={() => setFavoritesOnly((value) => !value)}><Star size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites</button><span className="gallery-count">{shownArtworks.length} of {artworks.length} pictures</span></div>{shownArtworks.length ? <div className="artwork-grid">{shownArtworks.map((artwork) => <article className="artwork-card" key={artwork.id}><button className="artwork-image" onClick={() => openArtwork(artwork)} aria-label={`Open ${artwork.title}`}><img src={artwork.thumbnail} alt={`${artwork.title} preview`} /><span><Pencil size={14} /> Open picture</span></button><button className={favoriteIds.includes(artwork.id) ? 'artwork-favorite active' : 'artwork-favorite'} onClick={() => toggleFavorite(artwork.id)} aria-label={`${favoriteIds.includes(artwork.id) ? 'Remove from' : 'Add to'} favorites`}><Star size={17} fill={favoriteIds.includes(artwork.id) ? 'currentColor' : 'none'} /></button><div className="artwork-details"><div><b>{artwork.title}</b><small>{new Date(artwork.updatedAt).toLocaleDateString()}</small></div><div className="artwork-actions"><button onClick={() => renameArtwork(artwork)} aria-label={`Rename ${artwork.title}`} title="Rename"><Pencil size={15} /></button><button onClick={() => duplicateArtwork(artwork)} aria-label={`Duplicate ${artwork.title}`} title="Duplicate"><Copy size={15} /></button><button onClick={() => void exportArtwork(artwork)} aria-label={`Export ${artwork.title} as PNG`} title="Export PNG"><Download size={15} /></button><button onClick={() => deleteArtwork(artwork)} aria-label={`Delete ${artwork.title}`} title="Delete"><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="empty-gallery"><span>{favoritesOnly ? '⭐' : '🔎'}</span><h2>{favoritesOnly ? 'No favorite drawings yet' : 'No matching pictures'}</h2><p>{favoritesOnly ? 'Tap a star on a saved picture to keep it close.' : 'Try another name or clear your search.'}</p></div>}</> : <div className="empty-gallery"><span>🖼️</span><h2>Your art box is waiting</h2><p>Save a doodle or color a page and it will show up here.</p><button className="primary-button" onClick={startEditor}><Plus size={17} /> Make your first picture</button></div>}
  </section>;
}

function SettingsScreen({ brushSize, setBrushSize, color, setColor, showTips, setShowTips, confirmClear, setConfirmClear, onAbout }: { brushSize: number; setBrushSize: (size: number) => void; color: string; setColor: (color: string) => void; showTips: boolean; setShowTips: (show: boolean) => void; confirmClear: boolean; setConfirmClear: (show: boolean) => void; onAbout: () => void }) {
  const [resetDone, setResetDone] = useState(false);
  const resetArt = async () => {
    if (!window.confirm('Remove every saved picture from this device? This cannot be undone.')) return;
    const items = await listArtworks();
    await Promise.all(items.map((item) => removeArtwork(item.id)));
    setResetDone(true);
  };
  return <section className="settings-screen"><div className="settings-heading"><span className="eyebrow">Make it feel just right</span><h1>Settings</h1><p>A few little choices for your drawing space.</p></div><div className="settings-panel"><div className="setting-row"><div className="setting-copy"><span className="setting-icon setting-color-icon"><Palette size={19} /></span><div><b>Favorite brush color</b><small>Start each new doodle with this color</small></div></div><input aria-label="Default brush color" className="settings-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></div><div className="setting-row setting-range-row"><div className="setting-copy"><span className="setting-icon"><Brush size={19} /></span><div><b>Favorite brush size</b><small>Your starting brush size: {brushSize}</small></div></div><input aria-label="Default brush size" type="range" min="3" max="30" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /></div><ToggleRow icon={<Info size={19} />} title="Show drawing tips" detail="Little reminders in the drawing editor" checked={showTips} onChange={setShowTips} /><ToggleRow icon={<Trash2 size={19} />} title="Ask before clearing" detail="Check before removing pencil marks" checked={confirmClear} onChange={setConfirmClear} /><button className="setting-row setting-link-row" onClick={onAbout}><span className="setting-copy"><span className="setting-icon"><CircleHelp size={19} /></span><span><b>About Doodle Land</b><small>Privacy, app info and a little hello</small></span></span><ChevronRight size={18} /></button></div><div className="local-note"><span>🔒</span><p><b>Your drawings stay here.</b><br />Pictures are saved in this browser on this device. There are no accounts, ads, or tracking.</p></div><button className="danger-link" onClick={resetArt}><Trash2 size={16} /> Remove all saved pictures</button>{resetDone && <p className="inline-success">All saved pictures have been removed.</p>}</section>;
}

function ToggleRow({ icon, title, detail, checked, onChange }: { icon: React.ReactNode; title: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="setting-row"><div className="setting-copy"><span className="setting-icon">{icon}</span><div><b>{title}</b><small>{detail}</small></div></div><button className={`toggle ${checked ? 'checked' : ''}`} role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)}><span /></button></div>;
}

function AboutScreen({ onBack }: { onBack: () => void }) {
  return <section className="about-screen"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Back home</button><div className="about-card"><img className="about-brand-logo" src="/doodle-land-logo.svg" alt="Doodle Land — Little Artist, Big Ideas by Hmzkiani" /><span className="eyebrow">A little note from us</span><h1>Welcome to Doodle Land</h1><p className="about-lead">A happy little place for curious hands and colorful ideas.</p><div className="about-scribble">🌈 ✨ 🖍️</div><div className="about-facts"><div><Sparkles size={18} /><span><b>{coloringPages.length} original pages</b><small>Ten playful themes, drawn right here in the app. Pick a favorite or choose a surprise.</small></span></div><div><Brush size={18} /><span><b>20 brushes, 20 shapes, and local stickers</b><small>Draw with colorful tools, add real geometry, and decorate your canvas with original art.</small></span></div><div><Heart size={18} /><span><b>Made for little artists</b><small>Draw with a finger, mouse or compatible stylus. There are no wrong turns.</small></span></div><div><LockIcon /><span><b>Private by design</b><small>Pictures stay in this browser. No account, ads, tracking or uploads.</small></span></div></div><p className="about-version">Doodle Land · Version 4.0 · by Hmzkiani</p><button className="primary-button" onClick={onBack}><Home size={17} /> Back to the fun</button></div></section>;
}

function LearningScreen({ onBack, onStartTutorial, selectedTrace, onTraceChange, onTraceActivity }: { onBack: () => void; onStartTutorial: (id: string) => void; selectedTrace: TraceId; onTraceChange: (id: TraceId) => void; onTraceActivity: () => void }) {
  const [tab, setTab] = useState<'lessons' | 'tracing'>('lessons');
  const groups = [...new Set(traceActivities.map((activity) => activity.group))];
  return <section className="learning-screen"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Home</button><div className="learning-heading"><span className="eyebrow">A little practice, lots of imagination</span><h1>Learning Garden</h1><p>Go step by step, trace a path, and enjoy the making.</p></div><div className="learning-tabs"><button className={tab === 'lessons' ? 'active' : ''} onClick={() => setTab('lessons')}><GraduationCap size={17} /> Learn to Draw</button><button className={tab === 'tracing' ? 'active' : ''} onClick={() => setTab('tracing')}><Pencil size={17} /> Trace &amp; Practice</button></div>
    {tab === 'lessons' ? <><div className="lesson-intro"><span>🌱</span><div><b>Choose something fun to draw</b><small>Each lesson gives you one small idea at a time. Draw on the canvas as you follow along.</small></div></div><div className="lesson-grid">{tutorials.map((tutorial, index) => <article className={`lesson-card lesson-${index % 4}`} key={tutorial.id}><span className="lesson-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tutorialPreview(tutorial.id) }} /><div><h2>{tutorial.title}</h2><p>{tutorial.subtitle}</p><small>{tutorial.steps.length} friendly steps</small></div><button className="primary-button" onClick={() => onStartTutorial(tutorial.id)}>Try this lesson <ArrowRight size={15} /></button></article>)}</div></> : <div className="trace-layout"><div className="trace-picker"><div><span className="eyebrow">Pick a dotted guide</span><h2>Practice at your pace</h2><p>Follow the line with your finger or mouse. Repeated tries are part of learning.</p></div>{groups.map((group) => <div className="trace-group" key={group}><b>{group}</b><div>{traceActivities.filter((item) => item.group === group).map((item) => <button key={item.id} className={selectedTrace === item.id ? 'active' : ''} onClick={() => onTraceChange(item.id)}>{item.name}</button>)}</div></div>)}</div><div className="trace-practice"><div><span className="eyebrow">{traceActivities.find((item) => item.id === selectedTrace)?.group}</span><h2>{traceActivities.find((item) => item.id === selectedTrace)?.name}</h2><p>{traceActivities.find((item) => item.id === selectedTrace)?.prompt}</p></div><TracingCanvas activity={selectedTrace} onPractice={onTraceActivity} /></div></div>}
  </section>;
}

function RewardsScreen({ progress, onBack }: { progress: RewardProgress; onBack: () => void }) {
  const earnedCount = badges.filter((badge) => badge.id === 'tutorial' ? progress.tutorials > 0 : badge.id === 'trace' ? progress.traces > 0 : badge.id === 'saved' ? progress.saved >= 5 : progress[badge.id as keyof RewardProgress] > 0).length;
  return <section className="rewards-screen"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Home</button><div className="rewards-hero"><span>✨</span><div><span className="eyebrow">Just for fun, never a race</span><h1>Your creative stars</h1><p>Little badges celebrate things you tried. Your art tools are always open to everyone.</p></div><b>{earnedCount}/{badges.length}</b></div><div className="badge-grid">{badges.map((badge) => { const unlocked = badge.id === 'tutorial' ? progress.tutorials > 0 : badge.id === 'trace' ? progress.traces > 0 : badge.id === 'saved' ? progress.saved >= 5 : progress[badge.id as keyof RewardProgress] > 0; return <article key={badge.id} className={unlocked ? 'badge-card earned' : 'badge-card'}><span>{unlocked ? badge.icon : '☆'}</span><div><b>{badge.title}</b><small>{badge.detail}</small></div><em>{unlocked ? 'Earned' : 'Ready when you are'}</em></article>; })}</div><p className="rewards-footnote">Badges are kept on this device. There are no streaks and nothing is locked.</p></section>;
}
function LockIcon() { return <span className="lock-icon">🔒</span>; }
function safeFilename(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-doodle'; }
function downloadCanvas(canvas: HTMLCanvasElement, filename: string, notify: (text: string, kind?: 'success' | 'error') => void) {
  try {
    canvas.toBlob((blob) => {
      if (!blob || blob.size === 0 || blob.type !== 'image/png') { notify('This picture could not be exported.', 'error'); return; }
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = filename; link.style.display = 'none'; document.body.appendChild(link);
      try { link.click(); notify('PNG download started.'); }
      catch { notify('Your browser could not start the PNG download.', 'error'); }
      finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); }
    }, 'image/png');
  } catch { notify('This picture could not be exported.', 'error'); }
}

export default App;


