import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TAPE CONFIGURATOR - Simple rectangular tape
 */

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 300;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [userFile, setUserFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

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

        // Clear
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw tape as background
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw user image on top with multiply blend
        if (userImage) {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.translate(transform.x, transform.y);
            ctx.rotate((transform.rotation * Math.PI) / 180);
            ctx.scale(transform.scale, transform.scale);
            ctx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
            ctx.restore();

            // Clip to tape bounds (simple rectangular clip)
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (userImage && userFile && onDesignReady) {
            onDesignReady(canvas.toDataURL('image/png'), userFile);
        }
    }, [tapeImage, userImage, userFile, transform, onDesignReady]);

    useEffect(() => { renderCanvas(); }, [renderCanvas]);

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

    return (
        <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Canvas */}
            <div className="bg-surface rounded-xl p-4 sm:p-6">
                <h3 className="font-bold tracking-wide mb-4 text-sm">TAPE PREVIEW</h3>

                <div
                    ref={containerRef}
                    className="relative rounded-xl overflow-hidden touch-none"
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
                        className="w-full h-auto bg-[#0a0a0a] rounded-xl"
                        style={{ cursor: userImage ? (activeAction ? 'grabbing' : 'grab') : 'default' }}
                        onMouseDown={(e) => { e.preventDefault(); handlePointerDown(e.clientX, e.clientY); }}
                        onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                    />

                    {/* Floating Controls */}
                    {userImage && !isProcessing && (
                        <motion.div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 backdrop-blur-sm rounded-full p-2 shadow-xl border border-white/10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                                onClick={() => setTransform(p => ({ ...p, rotation: p.rotation - 15 }))}
                            >
                                <RotateCw className="w-5 h-5 transform -scale-x-100" />
                            </button>
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                                onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.1, p.scale - 0.05) }))}
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                                onClick={() => setTransform(p => ({ ...p, scale: Math.min(1.5, p.scale + 0.05) }))}
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                                onClick={() => setTransform(p => ({ ...p, rotation: p.rotation + 15 }))}
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                                onClick={handleReset}
                            >
                                <RefreshCw className="w-5 h-5" />
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
                    Need help? We'll create the perfect design for you!
                </p>
            </div>
        </motion.div>
    );
}
