import { useState, useRef, useEffect, useCallback } from 'react';
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

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

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
    const renderCanvas = useCallback(() => {
        const renderTo = (canvas: HTMLCanvasElement | null) => {
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

            // Selection indicator
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
        };

        renderTo(canvasRef.current);
        renderTo(fullscreenCanvasRef.current);
    }, [tapeImage, layers, selectedLayerId]);

    useEffect(() => {
        renderCanvas();

        if (layers.length > 0 && onDesignReady && canvasRef.current) {
            const files = layers.map(l => l.file);
            onDesignReady(canvasRef.current.toDataURL('image/png'), files);
        }
    }, [renderCanvas, layers, onDesignReady]);

    // File handling
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
                    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

    // Simple button handlers - no event parameter needed
    const handleRotateLeft = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, rotation: l.rotation - 15 } : l
        ));
    };

    const handleRotateRight = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, rotation: l.rotation + 15 } : l
        ));
    };

    const handleZoomIn = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, scale: Math.min(2, l.scale + 0.03) } : l
        ));
    };

    const handleZoomOut = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, scale: Math.max(0.01, l.scale - 0.03) } : l
        ));
    };

    const handleReset = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId ? { ...l, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 } : l
        ));
    };

    const handleDelete = () => {
        if (!selectedLayerId) return;
        const remaining = layers.filter(l => l.id !== selectedLayerId);
        setLayers(remaining);
        setSelectedLayerId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    };

    // Canvas interaction
    const getCanvasCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    const findLayerAt = (x: number, y: number): ImageLayer | null => {
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const w = layer.image.width * layer.scale / 2;
            const h = layer.image.height * layer.scale / 2;
            if (Math.abs(x - layer.x) < w && Math.abs(y - layer.y) < h) {
                return layer;
            }
        }
        return null;
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const point = getCanvasCoords(e.clientX, e.clientY, canvas);
        const clicked = findLayerAt(point.x, point.y);

        if (clicked) {
            setSelectedLayerId(clicked.id);
            setIsDragging(true);
            dragStartRef.current = { x: point.x, y: point.y, startX: clicked.x, startY: clicked.y };
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !selectedLayerId) return;
        const canvas = e.currentTarget;
        const point = getCanvasCoords(e.clientX, e.clientY, canvas);
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;

        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId
                ? { ...l, x: dragStartRef.current.startX + dx, y: dragStartRef.current.startY + dy }
                : l
        ));
    };

    const handleCanvasMouseUp = () => setIsDragging(false);

    const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!e.touches[0]) return;
        const canvas = e.currentTarget;
        const point = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY, canvas);
        const clicked = findLayerAt(point.x, point.y);

        if (clicked) {
            setSelectedLayerId(clicked.id);
            setIsDragging(true);
            dragStartRef.current = { x: point.x, y: point.y, startX: clicked.x, startY: clicked.y };
        }
    };

    const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDragging || !selectedLayerId || !e.touches[0]) return;
        const canvas = e.currentTarget;
        const point = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY, canvas);
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;

        setLayers(prev => prev.map(l =>
            l.id === selectedLayerId
                ? { ...l, x: dragStartRef.current.startX + dx, y: dragStartRef.current.startY + dy }
                : l
        ));
    };

    const handleCanvasTouchEnd = () => setIsDragging(false);

    // Control button component
    const ControlButton = ({ onClick, disabled, className, children, title }: {
        onClick: () => void;
        disabled?: boolean;
        className?: string;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            disabled={disabled}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-all ${className} ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
            title={title}
        >
            {children}
        </button>
    );

    // Control buttons group
    const Controls = () => (
        <div className="flex flex-wrap justify-center items-center gap-1.5 bg-black/95 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl border border-white/20">
            <ControlButton onClick={openFilePicker} className="bg-primary hover:bg-primary/80 text-white" title="Add Image">
                <Plus className="w-5 h-5" />
            </ControlButton>

            <div className="w-px h-8 bg-white/20 mx-0.5" />

            <ControlButton onClick={handleRotateLeft} disabled={!selectedLayer} className="bg-white/10 hover:bg-white/20" title="Rotate Left">
                <RotateCw className="w-5 h-5 transform -scale-x-100" />
            </ControlButton>

            <ControlButton onClick={handleZoomOut} disabled={!selectedLayer} className="bg-white/10 hover:bg-white/20" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
            </ControlButton>

            <ControlButton onClick={handleZoomIn} disabled={!selectedLayer} className="bg-white/10 hover:bg-white/20" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
            </ControlButton>

            <ControlButton onClick={handleRotateRight} disabled={!selectedLayer} className="bg-white/10 hover:bg-white/20" title="Rotate Right">
                <RotateCw className="w-5 h-5" />
            </ControlButton>

            <div className="w-px h-8 bg-white/20 mx-0.5" />

            <ControlButton onClick={handleReset} disabled={!selectedLayer} className="bg-white/10 hover:bg-white/20" title="Reset">
                <RefreshCw className="w-5 h-5" />
            </ControlButton>

            <ControlButton onClick={handleDelete} disabled={!selectedLayer} className="bg-red-500/20 hover:bg-red-500/40 text-red-400" title="Delete">
                <Trash2 className="w-5 h-5" />
            </ControlButton>
        </div>
    );

    // Layer thumbnails
    const LayerThumbs = () => layers.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto py-2">
            {layers.map((layer, i) => (
                <button
                    key={layer.id}
                    type="button"
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl border-2 overflow-hidden transition-all ${layer.id === selectedLayerId ? 'border-primary ring-2 ring-primary/40' : 'border-white/20 hover:border-white/40'
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {/* Fullscreen */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                            <h3 className="font-bold text-lg">Edit Design</h3>
                            <button type="button" onClick={() => setIsFullscreen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
                            <LayerThumbs />

                            <canvas
                                ref={fullscreenCanvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="max-w-full max-h-[50vh] w-auto h-auto bg-[#0a0a0a] rounded-xl touch-none"
                                style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                onTouchStart={handleCanvasTouchStart}
                                onTouchMove={handleCanvasTouchMove}
                                onTouchEnd={handleCanvasTouchEnd}
                            />

                            <Controls />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main UI */}
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-surface rounded-xl p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold tracking-wide text-sm">TAPE PREVIEW</h3>
                            <button type="button" onClick={() => setShowHelp(!showHelp)} className="p-1 hover:bg-white/10 rounded-full">
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <button type="button" onClick={() => setIsFullscreen(true)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>

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

                    <LayerThumbs />

                    <div className="relative rounded-xl overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="w-full h-auto bg-[#0a0a0a] rounded-xl touch-none"
                            style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            onTouchStart={handleCanvasTouchStart}
                            onTouchMove={handleCanvasTouchMove}
                            onTouchEnd={handleCanvasTouchEnd}
                        />

                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2">
                            <Controls />
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

                <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                    <motion.button
                        type="button"
                        onClick={openFilePicker}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-base sm:text-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {layers.length > 0 ? <Plus className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        {layers.length > 0 ? 'Add Another Image' : 'Upload Your Design'}
                    </motion.button>

                    <motion.a
                        href="mailto:info@alura.cz?subject=Free Design Consultation"
                        className="w-full flex items-center justify-center gap-3 border border-primary text-primary hover:bg-primary/10 py-4 rounded-xl font-bold"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Free Design Consultation
                    </motion.a>
                    <p className="text-xs text-gray-500 text-center">
                        Not sure? We'll create the perfect tape for you!
                    </p>
                </div>
            </motion.div>
        </>
    );
}
