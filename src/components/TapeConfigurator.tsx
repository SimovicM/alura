import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCw, RefreshCw, Trash2, HelpCircle, Plus, X, Maximize2 } from 'lucide-react';
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
    const [showHelp, setShowHelp] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenMessage, setShowFullscreenMessage] = useState(false);

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

    // Show helpful message after user enters fullscreen for 3 seconds
    useEffect(() => {
        if (isFullscreen) {
            const timer = setTimeout(() => {
                setShowFullscreenMessage(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowFullscreenMessage(false);
        }
    }, [isFullscreen]);

    // Load tape image on mount
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setTapeImage(img);
        };
        img.onerror = () => {
            console.error('Failed to load tape image');
        };
        img.src = '/tape.png';
    }, []);

    // Render canvas whenever layers, tapeImage, or selectedLayerId changes
    const renderCanvas = useCallback((canvasEl: HTMLCanvasElement | null) => {
        if (!canvasEl || !tapeImage) return;

        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw tape background
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw all layers
        layers.forEach((layer) => {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.translate(layer.x, layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.scale(layer.scale, layer.scale);
            ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2);
            ctx.restore();
        });

        // Apply tape mask
        if (layers.length > 0) {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw selection border
        const selected = layers.find((l) => l.id === selectedLayerId);
        if (selected) {
            ctx.save();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.translate(selected.x, selected.y);
            ctx.rotate((selected.rotation * Math.PI) / 180);
            const w = (selected.image.width * selected.scale) / 2;
            const h = (selected.image.height * selected.scale) / 2;
            ctx.strokeRect(-w, -h, w * 2, h * 2);
            ctx.restore();
        }
    }, [tapeImage, layers, selectedLayerId]);

    // Effect to re-render both canvases
    useEffect(() => {
        renderCanvas(canvasRef.current);
        renderCanvas(fullscreenCanvasRef.current);
    }, [renderCanvas]);

    // Effect to call onDesignReady callback
    useEffect(() => {
        if (onDesignReady && canvasRef.current && layers.length > 0) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onDesignReady(dataUrl, layers.map((l) => l.file));
        }
    }, [layers, onDesignReady]);
    // File upload handler
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

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
                    rotation: 0,
                };
                setLayers((prev) => [...prev, newLayer]);
                setSelectedLayerId(newLayer.id);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Canvas interaction handlers
    const getCanvasCoords = (e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) * CANVAS_WIDTH) / rect.width,
            y: ((e.clientY - rect.top) * CANVAS_HEIGHT) / rect.height,
        };
    };

    const findLayerAtPoint = (x: number, y: number) => {
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const w = (layer.image.width * layer.scale) / 2;
            const h = (layer.image.height * layer.scale) / 2;
            if (Math.abs(x - layer.x) < w && Math.abs(y - layer.y) < h) {
                return layer;
            }
        }
        return null;
    };

    const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const pt = getCanvasCoords(e, canvas);
        const clicked = findLayerAtPoint(pt.x, pt.y);
        if (clicked) {
            setSelectedLayerId(clicked.id);
            isDraggingRef.current = true;
            dragStartRef.current = { x: pt.x, y: pt.y, startX: clicked.x, startY: clicked.y };
        }
    };

    const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current || !selectedLayerId) return;
        const canvas = e.currentTarget;
        const pt = getCanvasCoords(e, canvas);
        const dx = pt.x - dragStartRef.current.x;
        const dy = pt.y - dragStartRef.current.y;
        setLayers((prev) =>
            prev.map((l) =>
                l.id === selectedLayerId
                    ? {
                          ...l,
                          x: dragStartRef.current.startX + dx,
                          y: dragStartRef.current.startY + dy,
                      }
                    : l
            )
        );
    };

    const onCanvasMouseUp = () => {
        isDraggingRef.current = false;
    };

    // Tool handlers
    const handleZoomIn = () => {
        setLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, scale: Math.min(l.scale + 0.1, 3) } : l))
        );
    };

    const handleZoomOut = () => {
        setLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, scale: Math.max(l.scale - 0.1, 0.1) } : l))
        );
    };

    const handleRotateLeft = () => {
        setLayers((prev) =>
            prev.map((l) =>
                l.id === selectedLayerId ? { ...l, rotation: (l.rotation - 15 + 360) % 360 } : l
            )
        );
    };

    const handleRotateRight = () => {
        setLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, rotation: (l.rotation + 15) % 360 } : l))
        );
    };

    const handleReset = () => {
        const selected = layers.find((l) => l.id === selectedLayerId);
        if (!selected) return;
        setLayers((prev) =>
            prev.map((l) =>
                l.id === selectedLayerId
                    ? {
                          ...l,
                          x: CANVAS_WIDTH / 2,
                          y: CANVAS_HEIGHT / 2,
                          scale: 0.15,
                          rotation: 0,
                      }
                    : l
            )
        );
    };

    const handleDelete = () => {
        setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
        setSelectedLayerId(null);
    };

    const hasSelection = selectedLayerId !== null;

    return (
        <div className="tape-configurator space-y-6">
            {/* Help Section */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <p className="font-semibold text-primary">Design Tips</p>
                        <ul className="text-gray-300 space-y-1 text-xs">
                            <li>Your design doesn't need to cover the entire tape width</li>
                            <li>Simple designs with 2-3 colors work best</li>
                            <li>Click on your design to select it for editing</li>
                            <li>Drag to move, use buttons to zoom and rotate</li>
                            <li>Add multiple images by uploading again</li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Canvas Area */}
            <div className="bg-surface rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold tracking-wide">DESIGN PREVIEW</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Show help"
                        >
                            <HelpCircle className="w-5 h-5 text-gray-400" />
                        </button>
                        {layers.length > 0 && (
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                title="Fullscreen mode"
                            >
                                <Maximize2 className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg p-4">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className={`w-full h-auto rounded cursor-${isDraggingRef.current ? 'grabbing' : layers.length > 0 ? 'grab' : 'default'}`}
                        onMouseDown={onCanvasMouseDown}
                        onMouseMove={onCanvasMouseMove}
                        onMouseUp={onCanvasMouseUp}
                        onMouseLeave={onCanvasMouseUp}
                    />

                    {layers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg">
                            <p className="text-gray-600 text-center">Upload your design to see it on the tape</p>
                        </div>
                    )}
                </div>

                {layers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Click to select • Drag to move</span>
                    </div>
                )}

                {/* Polished Toolbar */}
                {hasSelection && (
                    <div className="flex items-center justify-center gap-2 bg-black/50 rounded-xl p-3 flex-wrap">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:scale-110 active:scale-95"
                            title="Add another image"
                        >
                            <Plus className="w-5 h-5" />
                        </button>

                        <div className="w-px h-6 bg-white/20" />

                        <button
                            onClick={handleRotateLeft}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            title="Rotate left 15°"
                        >
                            <RotateCw className="w-5 h-5 -scale-x-100" />
                        </button>

                        <button
                            onClick={handleZoomOut}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleZoomIn}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleRotateRight}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            title="Rotate right 15°"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>

                        <div className="w-px h-6 bg-white/20" />

                        <button
                            onClick={handleReset}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            title="Reset"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleDelete}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all hover:scale-110 active:scale-95"
                            title="Delete"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Section */}
            <div className="bg-surface rounded-lg p-6 space-y-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg text-sm font-bold transition-all uppercase tracking-wide"
                >
                    {layers.length > 0 ? <Plus className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {layers.length > 0 ? 'Add Another Image' : 'Upload Your Design'}
                </button>
                <a
                    href="mailto:info@alura.cz?subject=Free Design Consultation"
                    className="w-full flex items-center justify-center gap-2 border border-primary/50 text-primary hover:bg-primary/10 py-3 px-4 rounded-lg text-sm font-bold transition-all uppercase tracking-wide"
                >
                    Get Free Consultation
                </a>
            </div>

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
                        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-bold">Edit Design - Fullscreen</h3>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 overflow-auto relative">
                            {/* Canvas - takes most of the space */}
                            <canvas
                                ref={fullscreenCanvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="w-full max-w-5xl h-auto bg-[#0a0a0a] rounded-xl cursor-grab active:cursor-grabbing"
                                onMouseDown={onCanvasMouseDown}
                                onMouseMove={onCanvasMouseMove}
                                onMouseUp={onCanvasMouseUp}
                                onMouseLeave={onCanvasMouseUp}
                            />

                            {/* Help text */}
                            {layers.length > 0 && (
                                <p className="text-sm text-gray-400 text-center">Click to select • Drag to move</p>
                            )}

                            {/* Helpful message after delay */}
                            <AnimatePresence>
                                {showFullscreenMessage && (
                                    <motion.div
                                        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-primary/20 border border-primary/40 rounded-lg p-4 max-w-sm text-center"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                    >
                                        <p className="text-sm text-gray-200 mb-3">
                                            Don't worry if it doesn't look right. Our design team can help you perfect it.
                                        </p>
                                        <a
                                            href="mailto:info@alura.cz?subject=Free Design Consultation"
                                            className="inline-block bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Get Free Help
                                        </a>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer - Toolbar */}
                        <div className="border-t border-white/10 bg-black/50 px-6 py-4">
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:scale-110 active:scale-95"
                                    title="Add another image"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>

                                <div className="w-px h-8 bg-white/20" />

                                <button
                                    onClick={handleRotateLeft}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Rotate left 15°"
                                >
                                    <RotateCw className="w-6 h-6 -scale-x-100" />
                                </button>

                                <button
                                    onClick={handleZoomOut}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Zoom out"
                                >
                                    <ZoomOut className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handleZoomIn}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Zoom in"
                                >
                                    <ZoomIn className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handleRotateRight}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Rotate right 15°"
                                >
                                    <RotateCw className="w-6 h-6" />
                                </button>

                                <div className="w-px h-8 bg-white/20" />

                                <button
                                    onClick={handleReset}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Reset position and scale"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={!hasSelection}
                                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${hasSelection ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}
                                    title="Delete this image"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
