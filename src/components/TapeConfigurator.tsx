import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize2, HelpCircle, X, Plus, Trash2, Layers } from 'lucide-react';
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
    const [showLayers, setShowLayers] = useState(false);

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

    // Render to a specific canvas
    const renderToCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas || !tapeImage) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw all layers
        layers.forEach(layer => {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.translate(layer.x, layer.y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.scale(layer.scale, layer.scale);
            ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2);
            ctx.restore();
        });

        // Clip to tape shape
        if (layers.length > 0) {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw selection indicator for selected layer
        if (selectedLayer) {
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.translate(selectedLayer.x, selectedLayer.y);
            ctx.rotate((selectedLayer.rotation * Math.PI) / 180);
            const size = Math.max(selectedLayer.image.width, selectedLayer.image.height) * selectedLayer.scale;
            ctx.strokeRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }, [tapeImage, layers, selectedLayer]);

    // Render both canvases
    useEffect(() => {
        renderToCanvas(canvasRef.current);
        if (isFullscreen) {
            renderToCanvas(fullscreenCanvasRef.current);
        }

        if (layers.length > 0 && onDesignReady && canvasRef.current) {
            onDesignReady(canvasRef.current.toDataURL('image/png'), layers[0]?.file || null);
        }
    }, [renderToCanvas, isFullscreen, layers, onDesignReady]);

    // File upload
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

        // Reset input so same file can be uploaded again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Update selected layer
    const updateSelectedLayer = (updates: Partial<ImageLayer>) => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.map(layer =>
            layer.id === selectedLayerId ? { ...layer, ...updates } : layer
        ));
    };

    // Delete selected layer
    const deleteSelectedLayer = () => {
        if (!selectedLayerId) return;
        setLayers(prev => prev.filter(layer => layer.id !== selectedLayerId));
        setSelectedLayerId(layers.length > 1 ? layers[0].id : null);
    };

    // Reset selected layer position
    const resetSelectedLayer = () => {
        updateSelectedLayer({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 });
    };

    // Get canvas coordinates from pointer
    const getCanvasCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    // Find clicked layer
    const findLayerAtPoint = (x: number, y: number): ImageLayer | null => {
        // Check in reverse order (top layers first)
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const dx = x - layer.x;
            const dy = y - layer.y;
            const size = Math.max(layer.image.width, layer.image.height) * layer.scale / 2;
            if (Math.abs(dx) < size && Math.abs(dy) < size) {
                return layer;
            }
        }
        return null;
    };

    // Drag handlers
    const startDrag = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        const point = getCanvasCoords(clientX, clientY, canvas);

        // Try to select a layer at click point
        const clickedLayer = findLayerAtPoint(point.x, point.y);
        if (clickedLayer) {
            setSelectedLayerId(clickedLayer.id);
            setIsDragging(true);
            dragStartRef.current = { x: point.x, y: point.y, startX: clickedLayer.x, startY: clickedLayer.y };
        }
    };

    const moveDrag = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        if (!isDragging || !selectedLayerId) return;
        const point = getCanvasCoords(clientX, clientY, canvas);
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        updateSelectedLayer({
            x: dragStartRef.current.startX + dx,
            y: dragStartRef.current.startY + dy
        });
    };

    const endDrag = () => setIsDragging(false);

    // Control buttons component
    const ControlButtons = ({ inFullscreen = false }: { inFullscreen?: boolean }) => (
        <div className={`flex flex-wrap justify-center gap-1 sm:gap-2 bg-black/90 backdrop-blur-sm rounded-2xl p-2 sm:p-3 shadow-xl border border-white/10 ${inFullscreen ? 'max-w-md' : ''}`}>
            {/* Add Image */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-primary/20 hover:bg-primary/30 text-primary rounded-full transition-all active:scale-95"
                title="Add Image"
            >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Rotate Left */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); updateSelectedLayer({ rotation: (selectedLayer?.rotation || 0) - 15 }); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 transform -scale-x-100" />
            </button>

            {/* Zoom Out */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); updateSelectedLayer({ scale: Math.max(0.02, (selectedLayer?.scale || 0.15) - 0.02) }); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Zoom In */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); updateSelectedLayer({ scale: Math.min(1.5, (selectedLayer?.scale || 0.15) + 0.02) }); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Rotate Right */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); updateSelectedLayer({ rotation: (selectedLayer?.rotation || 0) + 15 }); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Reset */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); resetSelectedLayer(); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Delete */}
            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); deleteSelectedLayer(); }}
                disabled={!selectedLayer}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-30 rounded-full transition-all active:scale-95"
            >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </div>
    );

    // Layer selector for mobile
    const LayerSelector = () => (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {layers.map((layer, index) => (
                <button
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${layer.id === selectedLayerId
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                >
                    <img src={layer.image.src} alt={`Layer ${index + 1}`} className="w-full h-full object-cover" />
                </button>
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl p-12 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-white/10">
                            <h3 className="font-bold text-base sm:text-lg">Tape Preview</h3>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 gap-3 sm:gap-4 overflow-hidden">
                            {/* Layer selector in fullscreen */}
                            {layers.length > 1 && (
                                <div className="w-full max-w-md">
                                    <LayerSelector />
                                </div>
                            )}

                            <div
                                className="relative touch-none flex-shrink-0"
                                onMouseMove={(e) => moveDrag(e.clientX, e.clientY, fullscreenCanvasRef.current)}
                                onMouseUp={endDrag}
                                onMouseLeave={endDrag}
                                onTouchMove={(e) => e.touches[0] && moveDrag(e.touches[0].clientX, e.touches[0].clientY, fullscreenCanvasRef.current)}
                                onTouchEnd={endDrag}
                            >
                                <canvas
                                    ref={fullscreenCanvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    className="max-w-[95vw] max-h-[50vh] w-auto h-auto bg-[#0a0a0a] rounded-xl"
                                    style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                    onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY, fullscreenCanvasRef.current); }}
                                    onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX, e.touches[0].clientY, fullscreenCanvasRef.current)}
                                />
                            </div>

                            <ControlButtons inFullscreen />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Canvas Section */}
                <div className="bg-surface rounded-xl p-4 sm:p-6">
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
                            {layers.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setShowLayers(!showLayers)}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Layers className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Help Tooltip */}
                    <AnimatePresence>
                        {showHelp && (
                            <motion.div
                                className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm space-y-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <p className="text-gray-300">
                                    <strong>📋 This design will repeat across the whole tape!</strong>
                                </p>
                                <p className="text-gray-400 text-xs">
                                    <strong>🎨 Maximum 3 colors per tape</strong> — for best print quality, keep your design simple with up to 3 colors.
                                </p>
                                <p className="text-gray-400 text-xs">
                                    <strong>✨ Simple designs work best</strong> — logos with clean lines and solid colors produce the sharpest results.
                                </p>
                                <p className="text-gray-400 text-xs">
                                    <strong>➕ Add multiple images</strong> — use the + button to add more images to your design!
                                </p>
                                <p className="text-gray-400 text-xs">
                                    Need help? Use the <strong className="text-primary">Free Design Consultation</strong> button below!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Layer selector */}
                    {showLayers && layers.length > 1 && (
                        <div className="mb-4">
                            <LayerSelector />
                        </div>
                    )}

                    {/* Main Canvas */}
                    <div
                        className="relative rounded-xl overflow-hidden touch-none"
                        onMouseMove={(e) => moveDrag(e.clientX, e.clientY, canvasRef.current)}
                        onMouseUp={endDrag}
                        onMouseLeave={endDrag}
                        onTouchMove={(e) => e.touches[0] && moveDrag(e.touches[0].clientX, e.touches[0].clientY, canvasRef.current)}
                        onTouchEnd={endDrag}
                    >
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="w-full h-auto bg-[#0a0a0a] rounded-xl"
                            style={{ cursor: layers.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                            onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY, canvasRef.current); }}
                            onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX, e.touches[0].clientY, canvasRef.current)}
                        />

                        {/* Floating Controls */}
                        {!isProcessing && (
                            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2">
                                <ControlButtons />
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        )}

                        {layers.length > 0 && !isProcessing && (
                            <div className="absolute top-3 left-0 right-0 text-center pointer-events-none">
                                <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                                    Tap image to select • Drag to move
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                    <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
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
                        Not sure about your design? We'll help you create the perfect tape for free!
                    </p>
                </div>
            </motion.div>
        </>
    );
}
