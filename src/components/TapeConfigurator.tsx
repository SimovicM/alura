import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize2, HelpCircle, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File | null) => void;
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

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const layersRef = useRef<ImageLayer[]>([]);

    // Keep layersRef in sync
    useEffect(() => {
        layersRef.current = layers;
    }, [layers]);

    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    // Load tape image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { setTapeImage(img); setIsLoading(false); };
        img.onerror = () => setIsLoading(false);
        img.src = '/tape.png';
    }, []);

    // Render to canvas
    const renderToCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas || !tapeImage) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw all layers
        const currentLayers = layersRef.current;
        currentLayers.forEach(layer => {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.translate(layer.x, layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.scale(layer.scale, layer.scale);
            ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2);
            ctx.restore();
        });

        // Clip to tape shape
        if (currentLayers.length > 0) {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw selection indicator
        const selected = currentLayers.find(l => l.id === selectedLayerId);
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
    }, [tapeImage, selectedLayerId]);

    // Render on changes
    useEffect(() => {
        renderToCanvas(canvasRef.current);
        renderToCanvas(fullscreenCanvasRef.current);

        if (layers.length > 0 && onDesignReady && canvasRef.current) {
            onDesignReady(canvasRef.current.toDataURL('image/png'), layers[0]?.file || null);
        }
    }, [renderToCanvas, layers, onDesignReady]);

    // Trigger file input
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // File upload handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const newLayer: ImageLayer = {
                    id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

        // Reset input
        e.target.value = '';
    };

    // Layer manipulation functions
    const rotateLeft = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, rotation: l.rotation - 15 } : l));
    };

    const rotateRight = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, rotation: l.rotation + 15 } : l));
    };

    const zoomIn = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, scale: Math.min(2, l.scale + 0.03) } : l));
    };

    const zoomOut = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, scale: Math.max(0.01, l.scale - 0.03) } : l));
    };

    const resetLayer = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 } : l));
    };

    const deleteLayer = () => {
        if (!selectedLayerId) return;
        const remaining = layers.filter(l => l.id !== selectedLayerId);
        setLayers(remaining);
        setSelectedLayerId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    };

    // Canvas coordinate helpers
    const getCanvasCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    const findLayerAtPoint = (x: number, y: number): ImageLayer | null => {
        for (let i = layersRef.current.length - 1; i >= 0; i--) {
            const layer = layersRef.current[i];
            const w = layer.image.width * layer.scale / 2;
            const h = layer.image.height * layer.scale / 2;
            if (Math.abs(x - layer.x) < w && Math.abs(y - layer.y) < h) {
                return layer;
            }
        }
        return null;
    };

    // Unified drag handlers
    const handlePointerDown = (e: React.PointerEvent, canvas: HTMLCanvasElement | null) => {
        e.preventDefault();
        const point = getCanvasCoords(e.clientX, e.clientY, canvas);
        const clicked = findLayerAtPoint(point.x, point.y);

        if (clicked) {
            setSelectedLayerId(clicked.id);
            setIsDragging(true);
            dragStartRef.current = { x: point.x, y: point.y, startX: clicked.x, startY: clicked.y };
            (e.target as Element).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent, canvas: HTMLCanvasElement | null) => {
        if (!isDragging || !selectedLayerId) return;
        const point = getCanvasCoords(e.clientX, e.clientY, canvas);
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;

        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId
                ? { ...l, x: dragStartRef.current.startX + dx, y: dragStartRef.current.startY + dy }
                : l
        ));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);
    };

    // Control buttons component
    const ControlButtons = () => (
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 bg-black/95 backdrop-blur-md rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/20">
            {/* Add Image */}
            <button
                type="button"
                onClick={triggerFileInput}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-primary hover:bg-primary/80 text-white rounded-xl transition-all active:scale-90 shadow-lg"
                title="Add Image"
            >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="w-px h-8 bg-white/20 mx-1" />

            {/* Rotate Left */}
            <button
                type="button"
                onClick={rotateLeft}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                title="Rotate Left"
            >
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 transform -scale-x-100" />
            </button>

            {/* Zoom Out */}
            <button
                type="button"
                onClick={zoomOut}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                title="Zoom Out"
            >
                <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Zoom In */}
            <button
                type="button"
                onClick={zoomIn}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                title="Zoom In"
            >
                <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Rotate Right */}
            <button
                type="button"
                onClick={rotateRight}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                title="Rotate Right"
            >
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="w-px h-8 bg-white/20 mx-1" />

            {/* Reset */}
            <button
                type="button"
                onClick={resetLayer}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                title="Reset Position"
            >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Delete */}
            <button
                type="button"
                onClick={deleteLayer}
                disabled={!selectedLayer}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-400 disabled:opacity-30 disabled:hover:bg-red-500/20 rounded-xl transition-all active:scale-90"
                title="Delete"
            >
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
    );

    // Layer thumbnails
    const LayerThumbnails = () => layers.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto py-2 px-1">
            {layers.map((layer, i) => (
                <button
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden transition-all ${layer.id === selectedLayerId
                            ? 'border-primary ring-2 ring-primary/40'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                >
                    <img src={layer.image.src} alt={`Layer ${i + 1}`} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    ) : null;

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl p-12 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Hidden file input - shared by all buttons */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                            <h3 className="font-bold text-lg">Edit Design</h3>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
                            {/* Layer thumbnails */}
                            <LayerThumbnails />

                            {/* Canvas */}
                            <canvas
                                ref={fullscreenCanvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="max-w-full max-h-[50vh] w-auto h-auto bg-[#0a0a0a] rounded-xl touch-none"
                                style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                onPointerDown={(e) => handlePointerDown(e, fullscreenCanvasRef.current)}
                                onPointerMove={(e) => handlePointerMove(e, fullscreenCanvasRef.current)}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            />

                            {/* Controls */}
                            <ControlButtons />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main UI */}
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Canvas Section */}
                <div className="bg-surface rounded-xl p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold tracking-wide text-sm">TAPE PREVIEW</h3>
                            <button
                                type="button"
                                onClick={() => setShowHelp(!showHelp)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Help */}
                    <AnimatePresence>
                        {showHelp && (
                            <motion.div
                                className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm space-y-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <p className="text-gray-300"><strong>📋 Design repeats across the whole tape</strong></p>
                                <p className="text-gray-400 text-xs"><strong>🎨 Max 3 colors</strong> — simple designs look best</p>
                                <p className="text-gray-400 text-xs"><strong>➕ Add multiple images</strong> — use the + button</p>
                                <p className="text-gray-400 text-xs">Need help? Use <strong className="text-primary">Free Design Consultation</strong> below!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Layer thumbnails */}
                    <LayerThumbnails />

                    {/* Canvas */}
                    <div className="relative rounded-xl overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="w-full h-auto bg-[#0a0a0a] rounded-xl touch-none"
                            style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                            onPointerDown={(e) => handlePointerDown(e, canvasRef.current)}
                            onPointerMove={(e) => handlePointerMove(e, canvasRef.current)}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                        />

                        {/* Floating controls */}
                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2">
                            <ControlButtons />
                        </div>

                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        )}

                        {layers.length > 0 && (
                            <div className="absolute top-3 left-0 right-0 text-center pointer-events-none">
                                <span className="text-xs text-gray-400 bg-black/70 px-3 py-1 rounded-full">
                                    Tap to select • Drag to move
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                    <motion.button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all text-base sm:text-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {layers.length > 0 ? <Plus className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        {layers.length > 0 ? 'Add Another Image' : 'Upload Your Design'}
                    </motion.button>

                    <motion.a
                        href="mailto:info@alura.cz?subject=Free Design Consultation"
                        className="w-full flex items-center justify-center gap-3 border border-primary text-primary hover:bg-primary/10 py-4 rounded-xl font-bold transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Free Design Consultation
                    </motion.a>
                    <p className="text-xs text-gray-500 text-center">
                        Not sure about your design? We'll create the perfect tape for you!
                    </p>
                </div>
            </motion.div>
        </>
    );
}
