import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import TapeConfigurator from '../components/TapeConfigurator';
import type { CustomDesign } from '../types';

const PRICE_PER_ROLL = 250;

interface CustomizerPageProps {
    onAddToCart: (design: CustomDesign, quantity: number) => void;
    onOpenCart: () => void;
}

export default function CustomizerPage({ onAddToCart, onOpenCart }: CustomizerPageProps) {
    const [currentDesign, setCurrentDesign] = useState<{ url: string; file: File } | null>(null);
    const [quantity, setQuantity] = useState(1);

    const handleDesignReady = (imageDataUrl: string, file: File) => {
        setCurrentDesign({ url: imageDataUrl, file });
    };

    const handleAddToCart = () => {
        if (!currentDesign) {
            alert('Please upload a design first');
            return;
        }

        const design: CustomDesign = {
            id: Date.now().toString(),
            imageFile: currentDesign.file,
            imageUrl: '',
            thumbnail: currentDesign.url,
        };

        onAddToCart(design, quantity);
        onOpenCart();
    };

    const total = quantity * PRICE_PER_ROLL;

    return (
        <div className="min-h-screen bg-black pt-24 pb-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Home</span>
                    </Link>

                    <h1 className="text-4xl sm:text-6xl font-modak mb-3">
                        Design Your Tape
                    </h1>
                    <p className="text-lg text-gray-400">
                        Upload your logo or image, position it, and add to cart.
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left: Configurator (takes more space) */}
                    <div className="lg:col-span-3">
                        <TapeConfigurator onDesignReady={handleDesignReady} />
                    </div>

                    {/* Right: Order Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface rounded-xl p-6 space-y-6 sticky top-24">
                            <h3 className="font-bold tracking-wide text-lg">ORDER</h3>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-bold mb-3 text-gray-400 tracking-wide">
                                    QUANTITY
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-3xl font-bold w-12 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="border-t border-white/10 pt-6 space-y-2">
                                <div className="flex justify-between text-gray-400">
                                    <span>Price per roll</span>
                                    <span className="font-medium">{PRICE_PER_ROLL} Kč</span>
                                </div>
                                <div className="flex justify-between text-2xl font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{total} Kč</span>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={!currentDesign}
                                className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all text-lg"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Add to Cart
                            </button>

                            {!currentDesign && (
                                <p className="text-sm text-gray-500 text-center">
                                    Upload a design to enable checkout
                                </p>
                            )}

                            <p className="text-xs text-gray-600 text-center">
                                This is a preorder. We'll notify you when ready to ship.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
