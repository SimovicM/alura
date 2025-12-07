import { useState, useRef } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCw, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

/**
 * SIMPLE CSS-BASED TAPE CUSTOMIZER
 * Reliable approach using CSS transforms instead of canvas
 */

interface SimpleCustomizerProps {
    onDesignComplete?: (designUrl: string) => void;
}

export default function SimpleCustomizer({ onDesignComplete }: SimpleCustomizerProps) {
    const [uploadedImage, setUploadedImage] = useState<string>('');
    const [position, setPosition] = useState({ x: 50, y: 50 }); // percentage
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result as string);
            // Reset transforms
            setPosition({ x: 50, y: 50 });
            setScale(0.5);
            setRotation(0);
        };
        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!uploadedImage) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - (position.x * 6), y: e.clientY - (position.y * 6) });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const container = previewRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - dragStart.x) / rect.width) * 100;
        const y = ((e.clientY - dragStart.y) / rect.height) * 100;

        setPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleExport = async () => {
        if (!previewRef.current) return;

        try {
            const canvas = await html2canvas(previewRef.current, {
                backgroundColor: null,
                scale: 2
            });
            const dataUrl = canvas.toDataURL('image/png');

            // Download
            const link = document.createElement('a');
            link.download = 'alura-tape-design.png';
            link.href = dataUrl;
            link.click();

            if (onDesignComplete) {
                onDesignComplete(dataUrl);
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        }
    };

    return (
        <div className="space-y-8">
            {/* Preview Area */}
            <div className="bg-surface rounded-lg p-8">
                <h3 className="text-lg font-bold mb-6 tracking-wide">DESIGN PREVIEW</h3>

                <div
                    ref={previewRef}
                    className="relative w-full aspect-[2/1] bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* User's uploaded design */}
                    {uploadedImage && (
                        <img
                            src={uploadedImage}
                            alt="Your design"
                            className="absolute pointer-events-none"
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                                maxWidth: '80%',
                                maxHeight: '80%',
                                objectFit: 'contain'
                            }}
                        />
                    )}

                    {/* Tape overlay (transparent PNG) */}
                    <img
                        src="/alura-logo.png"
                        alt="Tape"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-20"
                    />

                    {!uploadedImage && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                            <p>Upload your design to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-surface rounded-lg p-8 space-y-6">
                {/* Upload */}
                <div>
                    <label className="block text-sm font-bold mb-3 tracking-wide">
                        {uploadedImage ? 'CHANGE DESIGN' : 'UPLOAD DESIGN'}
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
                            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-bold transition-all uppercase tracking-wide"
                        >
                            <Upload className="w-4 h-4" />
                            {uploadedImage ? 'Change' : 'Upload'}
                        </button>
                        {uploadedImage && (
                            <button
                                onClick={() => setUploadedImage('')}
                                className="px-4 py-3 border border-white/10 hover:bg-white/5 rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {uploadedImage && (
                    <>
                        {/* Zoom */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide">
                                SIZE: {Math.round(scale * 100)}%
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 rounded-lg transition-all"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                    Smaller
                                </button>
                                <button
                                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 rounded-lg transition-all"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    Larger
                                </button>
                            </div>
                        </div>

                        {/* Rotation */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide">
                                ROTATION: {rotation}°
                            </label>
                            <button
                                onClick={() => setRotation((rotation + 15) % 360)}
                                className="w-full flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-3 rounded-lg transition-all"
                            >
                                <RotateCw className="w-4 h-4" />
                                Rotate 15°
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    setPosition({ x: 50, y: 50 });
                                    setScale(0.5);
                                    setRotation(0);
                                }}
                                className="flex-1 border border-white/10 hover:bg-white/5 py-3 rounded-lg font-bold transition-all uppercase tracking-wide"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-lg font-bold transition-all uppercase tracking-wide"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
