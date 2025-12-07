import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, X, Loader2, MessageCircle } from 'lucide-react';

/**
 * TAPE CONFIGURATOR
 * User's design is drawn behind the tape, positioned to show through the tape area
 */

interface TapeConfiguratorProps {
    onDesignReady?: (imageDataUrl: string, file: File) => void;
}

// Canvas dimensions
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

export default function TapeConfigurator({ onDesignReady }: TapeConfiguratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Images
    const [tapeImage, setTapeImage] = useState<HTMLImageElement | null>(null);
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [userFile, setUserFile] = useState<File | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Transform state - position aligned to the tape's printable area
    const [transform, setTransform] = useState({
        x: 380,  // Adjusted to tape area
        y: 320,
        scale: 0.3,
        rotation: -18  // Slight angle to match tape perspective
    });

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

    // Load tape image on mount
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setTapeImage(img);
            setIsLoading(false);
        };
        img.onerror = () => {
            console.error('Failed to load tape image');
            setIsLoading(false);
        };
        img.src = '/tape.png';
    }, []);

    // Render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear canvas with dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw user's image FIRST (behind the tape)
        if (userImage) {
            ctx.save();
            ctx.translate(transform.x, transform.y);
            ctx.rotate((transform.rotation * Math.PI) / 180);
            ctx.scale(transform.scale, transform.scale);

            // Draw centered
            ctx.drawImage(
                userImage,
                -userImage.width / 2,
                -userImage.height / 2,
                userImage.width,
                userImage.height
            );
            ctx.restore();
        }

        // Draw the tape on top - using multiply blend mode so design shows through
        if (tapeImage) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';

            // Draw tape again normally for the white parts
            ctx.drawImage(tapeImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Notify parent
        if (userImage && userFile && onDesignReady) {
            const dataUrl = canvas.toDataURL('image/png');
            onDesignReady(dataUrl, userFile);
        }
    }, [tapeImage, userImage, userFile, transform, onDesignReady]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setUserImage(img);
                setUserFile(file);

                // Reset transform
                setTransform({
                    x: 380,
                    y: 320,
                    scale: 0.3,
                    rotation: -18
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Reset transforms
    const handleReset = () => {
        setTransform({
            x: 380,
            y: 320,
            scale: 0.3,
            rotation: -18
        });
    };

    // Get pointer position relative to canvas
    const getCanvasPoint = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!userImage) return;
        e.preventDefault();

        const point = getCanvasPoint(e.clientX, e.clientY);
        setIsDragging(true);
        dragStartRef.current = {
            x: point.x,
            y: point.y,
            imgX: transform.x,
            imgY: transform.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;

        const point = getCanvasPoint(e.clientX, e.clientY);
        const deltaX = point.x - dragStartRef.current.x;
        const deltaY = point.y - dragStartRef.current.y;

        setTransform(prev => ({
            ...prev,
            x: dragStartRef.current.imgX + deltaX,
            y: dragStartRef.current.imgY + deltaY
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!userImage || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const point = getCanvasPoint(touch.clientX, touch.clientY);
        setIsDragging(true);
        dragStartRef.current = {
            x: point.x,
            y: point.y,
            imgX: transform.x,
            imgY: transform.y
        };
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const point = getCanvasPoint(touch.clientX, touch.clientY);
        const deltaX = point.x - dragStartRef.current.x;
        const deltaY = point.y - dragStartRef.current.y;

        setTransform(prev => ({
            ...prev,
            x: dragStartRef.current.imgX + deltaX,
            y: dragStartRef.current.imgY + deltaY
        }));
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Loading state
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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold tracking-wide">TAPE PREVIEW</h3>
                    {userImage && (
                        <button
                            onClick={handleRemove}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Canvas */}
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

                    {/* Processing overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Processing your design...</p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {userImage && !isProcessing && (
                        <div className="absolute bottom-3 left-0 right-0 text-center">
                            <p className="text-xs text-gray-400 bg-black/60 inline-block px-3 py-1 rounded-full">
                                Drag to move • Use buttons to resize & rotate
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-surface rounded-xl p-6 space-y-5">
                {/* Upload button */}
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all text-lg"
                    >
                        <Upload className="w-5 h-5" />
                        {userImage ? 'Change Design' : 'Upload Your Design'}
                    </button>
                </div>

                {/* Transform controls */}
                {userImage && !isProcessing && (
                    <>
                        {/* Size Controls */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-400 tracking-wide">
                                SIZE ({Math.round(transform.scale * 100)}%)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.05, prev.scale - 0.05) }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Smaller</span>
                                </button>
                                <button
                                    onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(1.5, prev.scale + 0.05) }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    <span className="text-sm font-medium">Larger</span>
                                </button>
                            </div>
                        </div>

                        {/* Rotation Controls */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-400 tracking-wide">
                                ROTATION ({transform.rotation}°)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTransform(prev => ({ ...prev, rotation: prev.rotation - 5 }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="text-sm font-medium">-5°</span>
                                </button>
                                <button
                                    onClick={() => setTransform(prev => ({ ...prev, rotation: prev.rotation + 5 }))}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <RotateCw className="w-4 h-4" />
                                    <span className="text-sm font-medium">+5°</span>
                                </button>
                            </div>
                        </div>

                        {/* Reset button */}
                        <button
                            onClick={handleReset}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-sm font-medium">Reset Position & Size</span>
                        </button>
                    </>
                )}

                {/* Free Consultation Button */}
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
