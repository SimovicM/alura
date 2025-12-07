import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelect: (file: File, preview: string) => void;
    currentImage?: string;
    onRemove: () => void;
}

export default function ImageUploader({ onImageSelect, currentImage, onRemove }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            onImageSelect(file, e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="relative">
            {currentImage ? (
                <div className="relative group bg-surface p-6 rounded-lg">
                    <img
                        src={currentImage}
                        alt="Uploaded design"
                        className="w-full h-full object-contain rounded max-h-96"
                    />
                    <button
                        onClick={onRemove}
                        className="absolute top-8 right-8 bg-black/80 hover:bg-black text-white p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all min-h-[400px] flex flex-col items-center justify-center ${isDragging ? 'border-primary bg-surface' : 'border-white/10 hover:border-white/20'
                        }`}
                >
                    <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary' : 'text-gray-600'}`} strokeWidth={1.5} />
                    <h3 className="text-xl font-bold mb-2">Drop your image here</h3>
                    <p className="text-gray-500 mb-2">or click to browse</p>
                    <p className="text-sm text-gray-600">PNG, JPG up to 10MB</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
}
