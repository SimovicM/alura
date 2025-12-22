import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import TapeCustomizer from './TapeCustomizer';
import type { CustomDesign } from '../types';

interface ConfiguratorProps {
    onAddToCart: (design: CustomDesign, quantity: number) => void;
}

// Updated pricing: price in euros
const PRICE_PER_ROLL = 7.99;

export default function Configurator({ onAddToCart }: ConfiguratorProps) {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [designDataUrl, setDesignDataUrl] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    const handleDesignChange = (dataUrl: string | null) => {
        setDesignDataUrl(dataUrl);
    };

    const handleImageFile = (file: File | null) => {
        setImageFile(file);
    };

    const handleAddToCart = () => {
        if (!imageFile || !designDataUrl) {
            alert('Please upload and customize a design first');
            return;
        }

        const design: CustomDesign = {
            id: Date.now().toString(),
            imageFile,
            imageUrl: '',
            thumbnail: designDataUrl, // Use the canvas-rendered design
        };

        onAddToCart(design, quantity);

        // Note: Not resetting to allow users to add multiple quantities
        alert(`✅ Added ${quantity} roll(s) to cart!`);
    };

    const total = quantity * PRICE_PER_ROLL;

    return (
        <section id="configurator" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-7xl font-modak text-white mb-4">
                        Design Your Tape
                    </h2>
                    <p className="text-xl text-gray-400 font-light">
                        Upload your design, customize it, and add to cart
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left: Canvas Customizer */}
                    <div>
                        <TapeCustomizer
                            onDesignChange={handleDesignChange}
                            onImageFile={handleImageFile}
                        />
                    </div>

                    {/* Right: Order Options */}
                    <div className="space-y-8">
                        {/* Quantity & Price */}
                        <div className="bg-surface rounded-lg p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-4 tracking-wide">QUANTITY</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="border border-white/10 p-3 rounded hover:bg-white/5 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="border border-white/10 p-3 rounded hover:bg-white/5 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <div className="flex justify-between items-center mb-2 text-gray-400">
                                    <span className="text-sm">Price per roll</span>
                                    <span className="font-bold">{PRICE_PER_ROLL} €</span>
                                </div>
                                <div className="flex justify-between items-center text-2xl font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{total} €</span>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!imageFile || !designDataUrl}
                                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                            >
                                Add to Cart
                            </button>

                            <p className="text-sm text-gray-600 text-center">
                                This is a preorder. We'll notify you when ready to ship.
                            </p>
                        </div>

                        {/* Tips */}
                        {imageFile && (
                            <div className="bg-surface border-l-2 border-primary rounded-lg p-6">
                                <h4 className="font-bold mb-2">DESIGN TIPS</h4>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>• Drag your design to reposition it</li>
                                    <li>• Use zoom to resize your design</li>
                                    <li>• Rotate for perfect alignment</li>
                                    <li>• Export PNG to download your final design</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
