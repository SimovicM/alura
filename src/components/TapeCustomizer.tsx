import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Move, Download } from 'lucide-react';
import tapeBaseImg from '../assets/tape/tape-base.png';
import tapeMaskImg from '../assets/tape/tape-mask.png';

/**
 * TAPE CUSTOMIZER COMPONENT
 * =========================
 * Professional canvas-based tape design editor with:
 * - Image upload
 * - Drag to move
 * - Scale/zoom controls
 * - Rotation controls
 * - Export to PNG
 * 
 * ASSETS:
 * - tape-base.png: Tape mockup overlay (shown on top)
 * - tape-mask.png: Black/white mask (white = printable area)
 * 
 * Replace placeholder images in src/assets/tape/ with final graphics
 */

interface TapeCustomizerProps {
    onDesignChange?: (dataUrl: string | null) => void;
    onImageFile?: (file: File | null) => void;
}

interface Transform {
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

// Canvas dimensions (internal resolution)
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

export default function TapeCustomizer({ onDesignChange, onImageFile }: TapeCustomizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image state
    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [tapeBase, setTapeBase] = useState<HTMLImageElement | null>(null);
    const [tapeMask, setTapeMask] = useState<HTMLImageElement | null>(null);

    // Transform state
    const [transform, setTransform] = useState<Transform>({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        scale: 1,
        rotation: 0
    });

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Load tape base and mask images on mount
    useEffect(() => {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        Promise.all([
            loadImage(tapeBaseImg),
            loadImage(tapeMaskImg)
        ]).then(([base, mask]) => {
            setTapeBase(base);
            setTapeMask(mask);
        }).catch(err => {
            console.error('Failed to load tape assets:', err);
        });
    }, []);

    /**
     * CANVAS RENDERING FUNCTION
     * Draws the composition: user image → mask clipping → tape overlay
     */
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // If user uploaded an image, draw it with transform
        if (userImage) {
            ctx.save();

            // Apply transformations
            ctx.translate(transform.x, transform.y);
            ctx.rotate((transform.rotation * Math.PI) / 180);
            ctx.scale(transform.scale, transform.scale);

            // Draw user image centered
            const imgWidth = userImage.width;
            const imgHeight = userImage.height;
            ctx.drawImage(
                userImage,
                -imgWidth / 2,
                -imgHeight / 2,
                imgWidth,
                imgHeight
            );

            ctx.restore();

            // Apply tape mask to clip the design to printable area
            if (tapeMask) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(tapeMask, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        // Draw tape base overlay on top
        if (tapeBase) {
            ctx.drawImage(tapeBase, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Export data URL when rendering changes
        if (onDesignChange) {
            const dataUrl = userImage ? canvas.toDataURL('image/png') : null;
            onDesignChange(dataUrl);
        }
    }, [userImage, tapeBase, tapeMask, transform, onDesignChange]);

    // Re-render canvas when dependencies change
    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    /**
     * IMAGE UPLOAD HANDLER
     */
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setUserImage(img);

                // Auto-fit image to canvas (scale to fit within canvas bounds)
                const scaleX = (CANVAS_WIDTH * 0.6) / img.width;
                const scaleY = (CANVAS_HEIGHT * 0.6) / img.height;
                const autoScale = Math.min(scaleX, scaleY, 1);

                setTransform({
                    x: CANVAS_WIDTH / 2,
                    y: CANVAS_HEIGHT / 2,
                    scale: autoScale,
                    rotation: 0
                });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);

        if (onImageFile) {
            onImageFile(file);
        }
    };

    /**
     * MOUSE/TOUCH DRAG HANDLERS
     */
    const getPointerPosition = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        let clientX: number, clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handlePointerDown = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        if (!userImage) return;

        const pos = getPointerPosition(e);
        setIsDragging(true);
        setDragStart({ x: pos.x - transform.x, y: pos.y - transform.y });

        e.preventDefault();
    };

    const handlePointerMove = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        if (!isDragging || !userImage) return;

        const pos = getPointerPosition(e);
        setTransform(prev => ({
            ...prev,
            x: pos.x - dragStart.x,
            y: pos.y - dragStart.y
        }));

        e.preventDefault();
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    /**
     * CONTROL FUNCTIONS
     */
    const handleZoomIn = () => {
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 3) }));
    };

    const handleZoomOut = () => {
        setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }));
    };

    const handleRotate = () => {
        setTransform(prev => ({ ...prev, rotation: (prev.rotation + 15) % 360 }));
    };

    const handleReset = () => {
        if (!userImage) return;

        const scaleX = (CANVAS_WIDTH * 0.6) / userImage.width;
        const scaleY = (CANVAS_HEIGHT * 0.6) / userImage.height;
        const autoScale = Math.min(scaleX, scaleY, 1);

        setTransform({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            scale: autoScale,
            rotation: 0
        });
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'alura-tape-design.png';
        link.href = dataUrl;
        link.click();
    };

    const handleRemoveImage = () => {
        setUserImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onImageFile) {
            onImageFile(null);
        }
        if (onDesignChange) {
            onDesignChange(null);
        }
    };

    return (
        <div className="tape-customizer space-y-6">
            {/* Canvas Preview */}
            <div className="canvas-container bg-surface rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 tracking-wide">DESIGN PREVIEW</h3>
                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg p-4">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className={`w-full h-auto rounded cursor-${isDragging ? 'grabbing' : userImage ? 'grab' : 'default'}`}
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                    />

                    {!userImage && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-gray-600 text-center px-4">
                                Upload your design to see it on the tape
                            </p>
                        </div>
                    )}
                </div>

                {userImage && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                        <Move className="w-4 h-4" />
                        <span>Drag to move your design</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="controls-panel bg-surface rounded-lg p-6 space-y-6">
                {/* Upload */}
                <div>
                    <label className="block text-sm font-bold mb-3 tracking-wide">
                        {userImage ? 'CHANGE DESIGN' : 'UPLOAD YOUR DESIGN'}
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg text-sm font-bold transition-all uppercase tracking-wide"
                        >
                            {userImage ? 'Change Image' : 'Upload Image'}
                        </button>
                        {userImage && (
                            <button
                                onClick={handleRemoveImage}
                                className="px-4 py-3 border border-white/10 hover:bg-white/5 rounded-lg text-sm transition-all"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                {userImage && (
                    <>
                        {/* Zoom Controls */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide">
                                ZOOM: {(transform.scale * 100).toFixed(0)}%
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleZoomOut}
                                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 px-4 rounded-lg transition-all"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                    <span className="text-sm font-bold">Zoom Out</span>
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 px-4 rounded-lg transition-all"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    <span className="text-sm font-bold">Zoom In</span>
                                </button>
                            </div>
                        </div>

                        {/* Rotation */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide">
                                ROTATION: {transform.rotation}°
                            </label>
                            <button
                                onClick={handleRotate}
                                className="w-full flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 px-4 rounded-lg transition-all"
                            >
                                <RotateCw className="w-4 h-4" />
                                <span className="text-sm font-bold">Rotate 15°</span>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-white/10">
                            <button
                                onClick={handleReset}
                                className="flex-1 border border-white/10 hover:bg-white/5 py-3 px-4 rounded-lg text-sm font-bold transition-all uppercase tracking-wide"
                            >
                                Reset Position
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 px-4 rounded-lg text-sm font-bold transition-all uppercase tracking-wide"
                            >
                                <Download className="w-4 h-4" />
                                Export PNG
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
