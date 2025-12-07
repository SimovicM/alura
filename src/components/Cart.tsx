import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../types';

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onUpdateQuantity: (id: string, quantity: number) => void;
    onRemoveItem: (id: string) => void;
    onCheckout: () => void;
}

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 z-40"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-black border-l border-white/10 z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold tracking-wide">YOUR CART</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Your cart is empty</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface rounded-lg p-4 flex gap-4"
                                    >
                                        <img
                                            src={item.design.thumbnail}
                                            alt="Design"
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold">Custom Tape</h3>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveItem(item.id)}
                                                    className="p-1 hover:bg-red-500/10 rounded transition-colors text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        className="w-7 h-7 rounded border border-white/10 hover:bg-white/5 transition-colors text-sm"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="w-7 h-7 rounded border border-white/10 hover:bg-white/5 transition-colors text-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="font-bold text-primary">{item.price * item.quantity} Kč</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t border-white/10 space-y-4">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{total} Kč</span>
                                </div>
                                <button
                                    onClick={onCheckout}
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg text-base font-bold transition-all uppercase tracking-wide"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
