import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize2, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 300;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [userFile, setUserFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [transform, setTransform] = useState({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        scale: 0.15,
        rotation: 0
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

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

        if (userImage) {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.translate(transform.x, transform.y);
            ctx.rotate((transform.rotation * Math.PI) / 180);
            ctx.scale(transform.scale, transform.scale);
            ctx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
            ctx.restore();

            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }
    }, [tapeImage, userImage, transform]);

    // Render both canvases
    useEffect(() => {
        renderToCanvas(canvasRef.current);
        if (isFullscreen) {
            renderToCanvas(fullscreenCanvasRef.current);
        }

        if (userImage && userFile && onDesignReady && canvasRef.current) {
            onDesignReady(canvasRef.current.toDataURL('image/png'), userFile);
        }
    }, [renderToCanvas, isFullscreen, userImage, userFile, onDesignReady]);

    // File upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setUserImage(img);
                setUserFile(file);
                setTransform({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 });
                setIsProcessing(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
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

    // Drag handlers
    const startDrag = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        if (!userImage) return;
        const point = getCanvasCoords(clientX, clientY, canvas);
        setIsDragging(true);
        dragStartRef.current = { x: point.x, y: point.y, startX: transform.x, startY: transform.y };
    };

    const moveDrag = (clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
        if (!isDragging) return;
        const point = getCanvasCoords(clientX, clientY, canvas);
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        setTransform(prev => ({
            ...prev,
            x: dragStartRef.current.startX + dx,
            y: dragStartRef.current.startY + dy
        }));
    };

    const endDrag = () => setIsDragging(false);

    // Transform handlers - fixed to properly update state
    const rotateLeft = () => setTransform(prev => ({ ...prev, rotation: prev.rotation - 15 }));
    const rotateRight = () => setTransform(prev => ({ ...prev, rotation: prev.rotation + 15 }));
    const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.02, prev.scale - 0.02) }));
    const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(1.5, prev.scale + 0.02) }));
    const handleReset = () => setTransform({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.15, rotation: 0 });

    // Control buttons component
    const ControlButtons = () => (
        <div className="flex gap-1 sm:gap-2 bg-black/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-xl border border-white/10">
            <button
                type="button"
                onClick={rotateLeft}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 transform -scale-x-100" />
            </button>
            <button
                type="button"
                onClick={zoomOut}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
                type="button"
                onClick={zoomIn}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
                type="button"
                onClick={rotateRight}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
                type="button"
                onClick={handleReset}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
            >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
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
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h3 className="font-bold text-lg">Tape Preview</h3>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
                            <div
                                className="relative touch-none"
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
                                    className="max-w-[95vw] max-h-[60vh] w-auto h-auto bg-[#0a0a0a] rounded-xl"
                                    style={{ cursor: userImage ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                    onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY, fullscreenCanvasRef.current); }}
                                    onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX, e.touches[0].clientY, fullscreenCanvasRef.current)}
                                />
                            </div>

                            {userImage && <ControlButtons />}
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
                                    Need help? Use the <strong className="text-primary">Free Design Consultation</strong> button below!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                            style={{ cursor: userImage ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                            onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY, canvasRef.current); }}
                            onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX, e.touches[0].clientY, canvasRef.current)}
                        />

                        {/* Floating Controls */}
                        {userImage && !isProcessing && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <ControlButtons />
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        )}

                        {userImage && !isProcessing && (
                            <div className="absolute top-3 left-0 right-0 text-center pointer-events-none">
                                <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                                    Drag to move
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
                        <Upload className="w-5 h-5" />
                        {userImage ? 'Change Design' : 'Upload Your Design'}
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
