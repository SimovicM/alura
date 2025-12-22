import { useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';
import type { CartItem } from '../types';
import { uploadToImgBB } from '../lib/imgbb';
import { savePreorder } from '../lib/firebase';

interface CheckoutProps {
    items: CartItem[];
    onComplete: () => void;
    appliedCoupon?: { code: string; percent: number } | null;
}

export default function Checkout({ items, onComplete, appliedCoupon }: CheckoutProps) {
    const [email, setEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const uploadPromises = items.map(async (item) => {
                if (item.design.imageFile) {
                    const imageUrl = await uploadToImgBB(item.design.imageFile);
                    return { ...item, design: { ...item.design, imageUrl } };
                }
                return item; // already has imageUrl/thumbnail
            });

            const uploadedItems = await Promise.all(uploadPromises);

            const orderItems = uploadedItems.map(item => ({
                designUrl: item.design.imageUrl || item.design.thumbnail,
                quantity: item.quantity,
                price: item.price
            }));

            // Save preorder to firebase (include coupon info if present)
            await savePreorder({
                email,
                quantity: items.reduce((s, it) => s + it.quantity, 0),
                total,
                productName: JSON.stringify(orderItems),
                // coupon fields
                couponCode: appliedCoupon?.code,
                couponApplied: !!appliedCoupon,
                discountAmount: appliedCoupon ? Math.round((appliedCoupon.percent / 100) * total * 100) / 100 : 0
            } as any);

            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsComplete(true);
            setTimeout(() => onComplete(), 3000);

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to process order. Please try again.');
            setIsProcessing(false);
        }
    };

    if (isComplete) {
        return (
            <section className="py-32 px-6 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-modak mb-4">Order Confirmed!</h2>
                    <p className="text-lg text-gray-400 mb-2">
                        We'll email you at <span className="text-primary font-bold">{email}</span>
                    </p>
                    <p className="text-gray-600">when your custom tape is ready to ship.</p>
                </div>
            </section>
        );
    }

    return (
        <section id="checkout" className="py-32 px-6 min-h-screen flex items-center">
            <div className="max-w-4xl mx-auto w-full">
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-7xl font-modak text-white mb-4">
                        Complete Your Order
                    </h2>
                    <p className="text-xl text-gray-400 font-light">
                        Reserve your custom tape now
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="bg-surface rounded-lg p-8">
                        <h3 className="text-lg font-bold mb-6 tracking-wide">ORDER SUMMARY</h3>
                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <img
                                        src={item.design.thumbnail}
                                        alt="Design"
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold">Custom Tape x{item.quantity}</p>
                                        <p className="text-sm text-gray-500">{item.price} € each</p>
                                    </div>
                                    <p className="font-bold text-primary">{item.price * item.quantity} €</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">{total} €</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-3 tracking-wide">EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="bg-primary/5 border-l-2 border-primary rounded p-4">
                                <p className="text-sm text-gray-400">
                                    This is a preorder. We'll notify you via email when your custom tape is ready to ship.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Complete Preorder'
                                )}
                            </button>

                            <p className="text-xs text-gray-600 text-center">
                                By placing this order, you agree to our terms of service.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
