import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TAPE CONFIGURATOR - Fullscreen support + Help tooltip
 */

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 300;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);
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
        scale: 0.3,
        rotation: 0
    });

    const [activeAction, setActiveAction] = useState<'drag' | null>(null);
    const interactionStartRef = useRef({ x: 0, y: 0 });

    // Load tape image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { setTapeImage(img); setIsLoading(false); };
        img.onerror = () => setIsLoading(false);
        img.src = '/tape.png';
    }, []);

    // Render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !tapeImage) return;

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

        if (userImage && userFile && onDesignReady) {
            onDesignReady(canvas.toDataURL('image/png'), userFile);
        }
    }, [tapeImage, userImage, userFile, transform, onDesignReady]);

    useEffect(() => { renderCanvas(); }, [renderCanvas]);

    // Handle ESC key for fullscreen
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

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
                setTransform({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.3, rotation: 0 });
                setIsProcessing(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Get canvas coordinates
    const getCanvasPoint = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    // Pointer handlers
    const handlePointerDown = (clientX: number, clientY: number) => {
        if (!userImage) return;
        setActiveAction('drag');
        interactionStartRef.current = getCanvasPoint(clientX, clientY);
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!activeAction) return;
        const point = getCanvasPoint(clientX, clientY);
        const start = interactionStartRef.current;
        setTransform(prev => ({
            ...prev,
            x: prev.x + (point.x - start.x),
            y: prev.y + (point.y - start.y)
        }));
        interactionStartRef.current = point;
    };

    const handlePointerUp = () => setActiveAction(null);
    const handleReset = () => setTransform({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 0.3, rotation: 0 });

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl p-12 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const CanvasContent = ({ inFullscreen = false }: { inFullscreen?: boolean }) => (
        <div
            ref={containerRef}
            className={`relative rounded-xl overflow-hidden touch-none ${inFullscreen ? 'flex items-center justify-center h-full' : ''}`}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handlePointerUp}
        >
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={`bg-[#0a0a0a] rounded-xl ${inFullscreen ? 'max-w-[95vw] max-h-[80vh] w-auto h-auto' : 'w-full h-auto'}`}
                style={{ cursor: userImage ? (activeAction ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={(e) => { e.preventDefault(); handlePointerDown(e.clientX, e.clientY); }}
                onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            />

            {/* Floating Controls */}
            {userImage && !isProcessing && (
                <motion.div
                    className={`absolute ${inFullscreen ? 'bottom-8' : 'bottom-4'} left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 bg-black/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-xl border border-white/10`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                        onClick={() => setTransform(p => ({ ...p, rotation: p.rotation - 15 }))}
                    >
                        <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 transform -scale-x-100" />
                    </button>
                    <button
                        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                        onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.1, p.scale - 0.05) }))}
                    >
                        <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                        onClick={() => setTransform(p => ({ ...p, scale: Math.min(1.5, p.scale + 0.05) }))}
                    >
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                        onClick={() => setTransform(p => ({ ...p, rotation: p.rotation + 15 }))}
                    >
                        <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                        onClick={handleReset}
                    >
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </motion.div>
            )}

            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            )}

            {userImage && !isProcessing && (
                <div className="absolute top-3 left-0 right-0 text-center">
                    <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                        Drag to move
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        ref={fullscreenRef}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h3 className="font-bold text-lg">Tape Preview</h3>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-4">
                            <CanvasContent inFullscreen />
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
                {/* Canvas */}
                <div className="bg-surface rounded-xl p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold tracking-wide text-sm">TAPE PREVIEW</h3>
                            {/* Help Button */}
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        {/* Fullscreen Button */}
                        <button
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
                                className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <p className="text-gray-300 mb-2">
                                    <strong>📋 This design will repeat across the whole tape!</strong>
                                </p>
                                <p className="text-gray-400 text-xs">
                                    Your uploaded design will be printed repeatedly along the entire length of the tape.
                                    If anything doesn't look right or you need help, use the <strong className="text-primary">Free Design Consultation</strong> button below — we'll make it perfect for you!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <CanvasContent />
                </div>

                {/* Upload & Consultation */}
                <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                    <motion.button
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
