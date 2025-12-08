import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, Loader2, MessageCircle } from 'lucide-react';

/**
 * WORKING TAPE CONFIGURATOR
 * Properly processes the mask to clip user's design to tape surface
 */

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Images
    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [processedMask, setProcessedMask] = useState<HTMLCanvasElement | null>(null);
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [userFile, setUserFile] = useState<File | null>(null);

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Transform - positioned to align with the tape's printable area
    const [transform, setTransform] = useState({
        x: 350,
        y: 350,
        scale: 0.25,
        rotation: -15
    });

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

    // Process the mask image to create a proper alpha mask
    const processMaskImage = useCallback((maskImg: HTMLImageElement): HTMLCanvasElement => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = CANVAS_WIDTH;
        maskCanvas.height = CANVAS_HEIGHT;
        const ctx = maskCanvas.getContext('2d')!;

        // Draw the mask image
        ctx.drawImage(maskImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const data = imageData.data;

        // Convert: blue pixels -> opaque white, other pixels -> transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detect the blue color from the mask (#6B93B8 approximately)
            // Blue has higher B value than R, and reasonable G
            const isBlue = b > 150 && b > r && g > 100;

            if (isBlue) {
                // Make opaque white (this will be the visible area)
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = 255; // A - fully opaque
            } else {
                // Make transparent (this will be hidden)
                data[i + 3] = 0;   // A - fully transparent
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return maskCanvas;
    }, []);

    // Load images on mount
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

        Promise.all([
            loadImage('/tape.png'),
            loadImage('/tape-mask.png')
        ]).then(([tape, mask]) => {
            setTapeImage(tape);
            setProcessedMask(processMaskImage(mask));
            setIsLoading(false);
        }).catch(err => {
            console.error('Failed to load images:', err);
            setIsLoading(false);
        });
    }, [processMaskImage]);

    // Render the canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !tapeImage) return;

        // Clear with dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw the tape as base
        ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // If user has an image and we have a processed mask
        if (userImage && processedMask) {
            // Create a temporary canvas for the masked user design
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = CANVAS_WIDTH;
            tempCanvas.height = CANVAS_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d')!;

            // Draw user's image with transforms
            tempCtx.save();
            tempCtx.translate(transform.x, transform.y);
            tempCtx.rotate((transform.rotation * Math.PI) / 180);
            tempCtx.scale(transform.scale, transform.scale);
            tempCtx.drawImage(
                userImage,
                -userImage.width / 2,
                -userImage.height / 2
            );
            tempCtx.restore();

            // Apply the processed mask (only show design where mask is opaque)
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(processedMask, 0, 0);

            // Draw the masked design onto the main canvas with multiply blend
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tempCanvas, 0, 0);

            // Reset composite operation
            ctx.globalCompositeOperation = 'source-over';
        }

        // Notify parent
        if (userImage && userFile && onDesignReady) {
            onDesignReady(canvas.toDataURL('image/png'), userFile);
        }
    }, [tapeImage, processedMask, userImage, userFile, transform, onDesignReady]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // File upload handler
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
                setTransform({
                    x: 350,
                    y: 350,
                    scale: 0.25,
                    rotation: -15
                });
                setIsProcessing(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Remove image
    const handleRemove = () => {
        setUserImage(null);
        setUserFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Reset transform
    const handleReset = () => {
        setTransform({ x: 350, y: 350, scale: 0.25, rotation: -15 });
    };

    // Canvas coordinate helper
    const getCanvasPoint = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
            y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
        };
    };

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!userImage) return;
        e.preventDefault();
        const point = getCanvasPoint(e.clientX, e.clientY);
        setIsDragging(true);
        dragStartRef.current = { x: point.x, y: point.y, imgX: transform.x, imgY: transform.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const point = getCanvasPoint(e.clientX, e.clientY);
        setTransform(prev => ({
            ...prev,
            x: dragStartRef.current.imgX + (point.x - dragStartRef.current.x),
            y: dragStartRef.current.imgY + (point.y - dragStartRef.current.y)
        }));
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!userImage || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const point = getCanvasPoint(touch.clientX, touch.clientY);
        setIsDragging(true);
        dragStartRef.current = { x: point.x, y: point.y, imgX: transform.x, imgY: transform.y };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const point = getCanvasPoint(touch.clientX, touch.clientY);
        setTransform(prev => ({
            ...prev,
            x: dragStartRef.current.imgX + (point.x - dragStartRef.current.x),
            y: dragStartRef.current.imgY + (point.y - dragStartRef.current.y)
        }));
    };

    const handleTouchEnd = () => setIsDragging(false);

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl p-12 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-gray-400">Loading tape mockup...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Canvas Preview */}
            <div className="bg-surface rounded-xl p-6">
                <h3 className="font-bold tracking-wide mb-4">TAPE PREVIEW</h3>

                <div className="relative rounded-xl overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="w-full h-auto bg-[#0a0a0a] rounded-xl"
                        style={{
                            cursor: userImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            touchAction: 'none'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />

                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    )}

                    {userImage && !isProcessing && (
                        <div className="absolute bottom-3 left-0 right-0 text-center">
                            <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                                Drag to move • Use buttons below to adjust
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-surface rounded-xl p-6 space-y-5">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all text-lg"
                >
                    <Upload className="w-5 h-5" />
                    {userImage ? 'Change Design' : 'Upload Your Design'}
                </button>

                {userImage && !isProcessing && (
                    <>
                        {/* Size */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-400 tracking-wide">
                                SIZE ({Math.round(transform.scale * 100)}%)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.05, p.scale - 0.05) }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg"
                                >
                                    <ZoomOut className="w-4 h-4" /> Smaller
                                </button>
                                <button
                                    onClick={() => setTransform(p => ({ ...p, scale: Math.min(1, p.scale + 0.05) }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg"
                                >
                                    <ZoomIn className="w-4 h-4" /> Larger
                                </button>
                            </div>
                        </div>

                        {/* Rotation */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-400 tracking-wide">
                                ROTATION ({transform.rotation}°)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTransform(p => ({ ...p, rotation: p.rotation - 5 }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg"
                                >
                                    <RotateCcw className="w-4 h-4" /> -5°
                                </button>
                                <button
                                    onClick={() => setTransform(p => ({ ...p, rotation: p.rotation + 5 }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg"
                                >
                                    <RotateCw className="w-4 h-4" /> +5°
                                </button>
                            </div>
                        </div>

                        {/* Reset & Remove */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 hover:bg-white/5 rounded-lg"
                            >
                                <RefreshCw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handleRemove}
                                className="flex-1 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                                Remove
                            </button>
                        </div>
                    </>
                )}

                {/* Consultation */}
                <div className="pt-4 border-t border-white/10">
                    <a
                        href="mailto:info@alura.cz?subject=Free Design Consultation"
                        className="w-full flex items-center justify-center gap-3 border border-primary text-primary hover:bg-primary/10 py-4 rounded-xl font-bold transition-all"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Free Design Consultation
                    </a>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Need help with your design? We'll help you create the perfect tape!
                    </p>
                </div>
            </div>
        </div>
    );
}
