import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, MessageCircle, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

/**
 * CANVA-STYLE TAPE CONFIGURATOR
 * On-canvas controls for mobile-friendly editing
 */

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Images
    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [processedMask, setProcessedMask] = useState<HTMLCanvasElement | null>(null);
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [userFile, setUserFile] = useState<File | null>(null);

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Transform
    const [transform, setTransform] = useState({
        x: 350,
        y: 350,
        scale: 0.25,
        rotation: -15
    });

    // Interaction states
    const [activeAction, setActiveAction] = useState<'drag' | 'rotate' | 'scale' | null>(null);
    const interactionStartRef = useRef({ x: 0, y: 0, value: 0 });

    // Process mask
    const processMaskImage = useCallback((maskImg: HTMLImageElement): HTMLCanvasElement => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = CANVAS_WIDTH;
        maskCanvas.height = CANVAS_HEIGHT;
        const ctx = maskCanvas.getContext('2d')!;
        ctx.drawImage(maskImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const isBlue = b > 150 && b > r && g > 100;
            if (isBlue) {
                data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
            } else {
                data[i + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return maskCanvas;
    }, []);

    // Load images
    useEffect(() => {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        Promise.all([loadImage('/tape.png'), loadImage('/tape-mask.png')])
            .then(([tape, mask]) => {
                setTapeImage(tape);
                setProcessedMask(processMaskImage(mask));
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [processMaskImage]);

    // Render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !tapeImage) return;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (userImage && processedMask) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = CANVAS_WIDTH;
            tempCanvas.height = CANVAS_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d')!;

            tempCtx.save();
            tempCtx.translate(transform.x, transform.y);
            tempCtx.rotate((transform.rotation * Math.PI) / 180);
            tempCtx.scale(transform.scale, transform.scale);
            tempCtx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
            tempCtx.restore();

            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(processedMask, 0, 0);

            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (userImage && userFile && onDesignReady) {
            onDesignReady(canvas.toDataURL('image/png'), userFile);
        }
    }, [tapeImage, processedMask, userImage, userFile, transform, onDesignReady]);

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
                setTransform({ x: 350, y: 350, scale: 0.25, rotation: -15 });
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

    // Unified pointer handlers
    const handlePointerDown = (clientX: number, clientY: number, action: 'drag' | 'rotate' | 'scale') => {
        if (!userImage) return;
        setActiveAction(action);
        const point = getCanvasPoint(clientX, clientY);
        interactionStartRef.current = {
            x: point.x,
            y: point.y,
            value: action === 'rotate' ? transform.rotation : action === 'scale' ? transform.scale : 0
        };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!activeAction) return;
        const point = getCanvasPoint(clientX, clientY);
        const start = interactionStartRef.current;

        if (activeAction === 'drag') {
            setTransform(prev => ({
                ...prev,
                x: prev.x + (point.x - start.x),
                y: prev.y + (point.y - start.y)
            }));
            interactionStartRef.current = { ...start, x: point.x, y: point.y };
        } else if (activeAction === 'rotate') {
            const deltaX = point.x - start.x;
            setTransform(prev => ({ ...prev, rotation: start.value + deltaX * 0.5 }));
        } else if (activeAction === 'scale') {
            const deltaY = start.y - point.y;
            const newScale = Math.max(0.05, Math.min(1.5, start.value + deltaY * 0.002));
            setTransform(prev => ({ ...prev, scale: newScale }));
        }
    };

    const handlePointerUp = () => setActiveAction(null);

    // Reset
    const handleReset = () => setTransform({ x: 350, y: 350, scale: 0.25, rotation: -15 });

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl p-12 flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Canvas with floating controls */}
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
                        style={{ cursor: userImage ? (activeAction === 'drag' ? 'grabbing' : 'grab') : 'default' }}
                        onMouseDown={(e) => { e.preventDefault(); handlePointerDown(e.clientX, e.clientY, 'drag'); }}
                        onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, 'drag')}
                    />

                    {/* Floating Controls - Canva Style */}
                    {userImage && !isProcessing && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 backdrop-blur-sm rounded-full p-2 shadow-xl border border-white/10">
                            {/* Rotate Left */}
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                                onMouseDown={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, rotation: p.rotation - 15 })); }}
                                onTouchStart={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, rotation: p.rotation - 15 })); }}
                            >
                                <RotateCw className="w-5 h-5 transform -scale-x-100" />
                            </button>

                            {/* Smaller */}
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                                onMouseDown={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, scale: Math.max(0.05, p.scale - 0.05) })); }}
                                onTouchStart={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, scale: Math.max(0.05, p.scale - 0.05) })); }}
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            {/* Larger */}
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                                onMouseDown={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, scale: Math.min(1.5, p.scale + 0.05) })); }}
                                onTouchStart={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, scale: Math.min(1.5, p.scale + 0.05) })); }}
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            {/* Rotate Right */}
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                                onMouseDown={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, rotation: p.rotation + 15 })); }}
                                onTouchStart={(e) => { e.stopPropagation(); setTransform(p => ({ ...p, rotation: p.rotation + 15 })); }}
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>

                            {/* Reset */}
                            <button
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                                onMouseDown={(e) => { e.stopPropagation(); handleReset(); }}
                                onTouchStart={(e) => { e.stopPropagation(); handleReset(); }}
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Processing overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    )}

                    {/* Instructions */}
                    {userImage && !isProcessing && (
                        <div className="absolute top-3 left-0 right-0 text-center">
                            <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                                Drag to move
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Button */}
            <div className="bg-surface rounded-xl p-4 sm:p-6 space-y-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all text-base sm:text-lg"
                >
                    <Upload className="w-5 h-5" />
                    {userImage ? 'Change Design' : 'Upload Your Design'}
                </button>

                {/* Consultation */}
                <a
                    href="mailto:info@alura.cz?subject=Free Design Consultation"
                    className="w-full flex items-center justify-center gap-3 border border-primary text-primary hover:bg-primary/10 py-4 rounded-xl font-bold transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                    Free Design Consultation
                </a>
                <p className="text-xs text-gray-500 text-center">
                    Need help? We'll create the perfect design for you!
                </p>
            </div>
        </div>
    );
}
