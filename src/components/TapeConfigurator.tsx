import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize2, HelpCircle, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, files: File[]) => void;
}

interface ImageLayer {
    id: string;
    image: HTMLImageElement;
    file: File;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 300;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [layers, setLayers] = useState<ImageLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

    // Load tape
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { setTapeImage(img); setIsLoading(false); };
        img.onerror = () => setIsLoading(false);
        img.src = '/tape.png';
    }, []);

    // Render canvases
    useEffect(() => {
        const render = () => {
            [canvasRef.current, fullscreenCanvasRef.current].forEach(canvas => {
                if (!canvas || !tapeImage) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                layers.forEach(layer => {
                    ctx.save();
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.translate(layer.x, layer.y);
                    ctx.rotate((layer.rotation * Math.PI) / 180);
                    ctx.scale(layer.scale, layer.scale);
                    ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2);
                    ctx.restore();
                });

                if (layers.length > 0) {
                    ctx.globalCompositeOperation = 'destination-in';
                    ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    ctx.globalCompositeOperation = 'source-over';
                }

                const selected = layers.find(l => l.id === selectedLayerId);
                if (selected) {
                    ctx.save();
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([8, 4]);
                    ctx.translate(selected.x, selected.y);
                    ctx.rotate((selected.rotation * Math.PI) / 180);
                    const w = selected.image.width * selected.scale;
                    const h = selected.image.height * selected.scale;
                    ctx.strokeRect(-w / 2, -h / 2, w, h);
                    ctx.restore();
                }
            });
        };

        render();

        if (layers.length > 0 && onDesignReady && canvasRef.current) {
            onDesignReady(canvasRef.current.toDataURL('image/png'), layers.map(l => l.file));
        }
    }, [tapeImage, layers, selectedLayerId, onDesignReady]);

    // File
    const openFilePicker = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const newLayer: ImageLayer = {
                    id: `${Date.now()}`,
                    image: img,
                    file,
                    x: CANVAS_WIDTH / 2,
                    y: CANVAS_HEIGHT / 2,
                    scale: 0.15,
                    rotation: 0
                };
                setLayers(prev => [...prev, newLayer]);
                setSelectedLayerId(newLayer.id);
                setIsProcessing(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Actions - direct state updates
    const doRotateLeft = () => {
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, rotation: l.rotation - 15 } : l));
    };
    const doRotateRight = () => {
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, rotation: l.rotation + 15 } : l));
    };
    const doZoomIn = () => {
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, scale: Math.min(2, l.scale + 0.03) } : l));
    };
    const doZoomOut = () => {
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, scale: Math.max(0.01, l.scale - 0.03) } : l));
    };
    const doReset = () => {
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 } : l));
    };
    const doDelete = () => {
        setLayers(prev => {
            const remaining = prev.filter(l => l.id !== selectedLayerId);
            setTimeout(() => setSelectedLayerId(remaining.length > 0 ? remaining[remaining.length - 1].id : null), 0);
            return remaining;
        });
    };

    // Canvas coords
    const getCoords = (e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    const findLayer = (x: number, y: number) => {
        for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            const w = l.image.width * l.scale / 2;
            const h = l.image.height * l.scale / 2;
            if (Math.abs(x - l.x) < w && Math.abs(y - l.y) < h) return l;
        }
        return null;
    };

    // Mouse handlers for canvas
    const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pt = getCoords(e, e.currentTarget);
        const clicked = findLayer(pt.x, pt.y);
        if (clicked) {
            setSelectedLayerId(clicked.id);
            isDraggingRef.current = true;
            dragStartRef.current = { x: pt.x, y: pt.y, startX: clicked.x, startY: clicked.y };
        }
    };

    const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current || !selectedLayerId) return;
        const pt = getCoords(e, e.currentTarget);
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId
                ? { ...l, x: dragStartRef.current.startX + pt.x - dragStartRef.current.x, y: dragStartRef.current.startY + pt.y - dragStartRef.current.y }
                : l
        ));
    };

    const onCanvasMouseUp = () => { isDraggingRef.current = false; };

    // Touch handlers
    const onCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!e.touches[0]) return;
        const pt = getCoords(e.touches[0], e.currentTarget);
        const clicked = findLayer(pt.x, pt.y);
        if (clicked) {
            setSelectedLayerId(clicked.id);
            isDraggingRef.current = true;
            dragStartRef.current = { x: pt.x, y: pt.y, startX: clicked.x, startY: clicked.y };
        }
    };

    const onCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current || !selectedLayerId || !e.touches[0]) return;
        e.preventDefault();
        const pt = getCoords(e.touches[0], e.currentTarget);
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId
                ? { ...l, x: dragStartRef.current.startX + pt.x - dragStartRef.current.x, y: dragStartRef.current.startY + pt.y - dragStartRef.current.y }
                : l
        ));
    };

    const onCanvasTouchEnd = () => { isDraggingRef.current = false; };

    const hasSelection = selectedLayerId !== null;

    // Toolbar component
    const Toolbar = () => (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/80 text-white transition-colors"
                onClick={openFilePicker}
            >
                <Plus className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-white/20" />

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'}`}
                onClick={doRotateLeft}
                disabled={!hasSelection}
            >
                <RotateCw className="w-5 h-5 -scale-x-100" />
            </button>

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'}`}
                onClick={doZoomOut}
                disabled={!hasSelection}
            >
                <ZoomOut className="w-5 h-5" />
            </button>

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'}`}
                onClick={doZoomIn}
                disabled={!hasSelection}
            >
                <ZoomIn className="w-5 h-5" />
            </button>

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'}`}
                onClick={doRotateRight}
                disabled={!hasSelection}
            >
                <RotateCw className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-white/20" />

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40'}`}
                onClick={doReset}
                disabled={!hasSelection}
            >
                <RefreshCw className="w-5 h-5" />
            </button>

            <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${hasSelection ? 'bg-red-500/30 hover:bg-red-500/50 text-red-400' : 'bg-white/5 opacity-40'}`}
                onClick={doDelete}
                disabled={!hasSelection}
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    );

    // Layer thumbnails
    const Thumbs = () => layers.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto py-2">
            {layers.map((l, i) => (
                <button
                    key={l.id}
                    onClick={() => setSelectedLayerId(l.id)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden ${l.id === selectedLayerId ? 'border-primary' : 'border-white/20'}`}
                >
                    <img src={l.image.src} alt={`${i + 1}`} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    ) : null;

    if (isLoading) {
        return <div className="bg-surface rounded-xl p-12 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {/* Fullscreen */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div className="fixed inset-0 z-[100] bg-black flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                            <h3 className="font-bold">Edit Design</h3>
                            <button onClick={() => setIsFullscreen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
                            <Thumbs />

                            <canvas
                                ref={fullscreenCanvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="max-w-full max-h-[40vh] bg-[#0a0a0a] rounded-xl touch-none"
                                style={{ cursor: layers.length > 0 ? 'grab' : 'default' }}
                                onMouseDown={onCanvasMouseDown}
                                onMouseMove={onCanvasMouseMove}
                                onMouseUp={onCanvasMouseUp}
                                onMouseLeave={onCanvasMouseUp}
                                onTouchStart={onCanvasTouchStart}
                                onTouchMove={onCanvasTouchMove}
                                onTouchEnd={onCanvasTouchEnd}
                            />

                            <div className="bg-surface/80 backdrop-blur rounded-2xl p-4">
                                <Toolbar />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="space-y-4">
                <div className="bg-surface rounded-xl p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">TAPE PREVIEW</h3>
                            <button onClick={() => setShowHelp(!showHelp)} className="p-1 hover:bg-white/10 rounded-full"><HelpCircle className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <button onClick={() => setIsFullscreen(true)} className="p-2 hover:bg-white/10 rounded-lg"><Maximize2 className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <AnimatePresence>
                        {showHelp && (
                            <motion.div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p><strong>📋 Design repeats across the tape</strong></p>
                                <p className="text-gray-400 text-xs">🎨 Max 3 colors • Simple designs work best</p>
                                <p className="text-gray-400 text-xs">➕ Use + button to add multiple images</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Thumbs />

                    {/* Canvas only - no controls overlay */}
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="w-full h-auto bg-[#0a0a0a] rounded-xl touch-none"
                        style={{ cursor: layers.length > 0 ? 'grab' : 'default' }}
                        onMouseDown={onCanvasMouseDown}
                        onMouseMove={onCanvasMouseMove}
                        onMouseUp={onCanvasMouseUp}
                        onMouseLeave={onCanvasMouseUp}
                        onTouchStart={onCanvasTouchStart}
                        onTouchMove={onCanvasTouchMove}
                        onTouchEnd={onCanvasTouchEnd}
                    />

                    {layers.length > 0 && (
                        <p className="text-center text-xs text-gray-500 mt-2">Click image to select • Drag to move</p>
                    )}

                    {/* Toolbar OUTSIDE canvas, below it */}
                    <div className="mt-4 bg-black/50 rounded-2xl p-3">
                        <Toolbar />
                    </div>
                </div>

                <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                    <button
                        onClick={openFilePicker}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg"
                    >
                        {layers.length > 0 ? <Plus className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        {layers.length > 0 ? 'Add Another Image' : 'Upload Your Design'}
                    </button>

                    <a
                        href="mailto:info@alura.cz?subject=Free Design Consultation"
                        className="w-full flex items-center justify-center gap-3 border border-primary text-primary hover:bg-primary/10 py-4 rounded-xl font-bold"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Free Design Consultation
                    </a>
                    <p className="text-xs text-gray-500 text-center">Not sure? We'll help!</p>
                </div>
            </div>
        </>
    );
}
