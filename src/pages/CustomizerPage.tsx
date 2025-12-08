import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, X, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TapeConfigurator from '../components/TapeConfigurator';
import { savePreorder } from '../lib/firebase';
import { uploadBase64ToImgBB, generateUniqueId } from '../lib/imgbb';

const PRICE_PER_ROLL = 250;

export default function CustomizerPage() {
    const [currentDesign, setCurrentDesign] = useState<{ url: string } | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [showPreorderModal, setShowPreorderModal] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    const handleDesignReady = (imageDataUrl: string) => {
        setCurrentDesign({ url: imageDataUrl });
    };

    const handlePreorder = () => {
        if (!currentDesign) {
            alert('Please upload at least one design');
            return;
        }
        setShowPreorderModal(true);
    };

    const handleSubmitPreorder = async () => {
        if (!email || !email.includes('@')) {
            setSubmitError('Please enter a valid email address');
            return;
        }

        if (!currentDesign) {
            setSubmitError('No design found. Please upload at least one design.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const uniqueId = generateUniqueId();

            setUploadProgress('Uploading your design...');

            // Upload the final tape preview to ImgBB
            const tapePreviewUrl = await uploadBase64ToImgBB(currentDesign.url, `${uniqueId}_tape`);

            // Save to Firebase
            setUploadProgress('Saving your preorder...');
            const result = await savePreorder({
                email,
                originalImageUrl: tapePreviewUrl, // We only have the final composite now
                tapePreviewUrl,
                quantity,
                total: quantity * PRICE_PER_ROLL
            });

            if (result.success) {
                setSubmitSuccess(true);
                setTimeout(() => {
                    setShowPreorderModal(false);
                    setSubmitSuccess(false);
                    setEmail('');
                    setUploadProgress('');
                }, 2000);
            } else {
                setSubmitError('Failed to submit preorder. Please try again.');
            }
        } catch (error) {
            console.error('Preorder error:', error);
            setSubmitError('Failed to upload images. Please try again.');
        }

        setIsSubmitting(false);
    };

    const total = quantity * PRICE_PER_ROLL;

    return (
        <>
            {/* Preorder Modal */}
            <AnimatePresence>
                {showPreorderModal && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md border border-white/10"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            {submitSuccess ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Preorder Submitted!</h3>
                                    <p className="text-gray-400">We'll contact you soon at {email}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold">Complete Your Preorder</h3>
                                        <button
                                            onClick={() => setShowPreorderModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-sm text-gray-400">
                                            <span>Quantity</span>
                                            <span>{quantity} roll{quantity > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                                            <span>Total</span>
                                            <span className="text-primary">{total} Kč</span>
                                        </div>
                                    </div>

                                    {/* Email Input */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold mb-2 text-gray-400">
                                            YOUR EMAIL
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            disabled={isSubmitting}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                                        />
                                        {submitError && (
                                            <p className="text-red-400 text-sm mt-2">{submitError}</p>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 mb-6">
                                        We'll send you payment details and updates about your order to this email.
                                    </p>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitPreorder}
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all text-lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-sm">{uploadProgress}</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Submit Preorder
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            Upload your images, position them, and preorder. Add multiple images to one tape!
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left: Configurator */}
                        <div className="lg:col-span-3">
                            <TapeConfigurator onDesignReady={handleDesignReady} />
                        </div>

                        {/* Right: Order Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-surface rounded-xl p-6 space-y-6 sticky top-24">
                                <h3 className="font-bold tracking-wide text-lg">PREORDER</h3>

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

                                {/* Preorder Button */}
                                <button
                                    onClick={handlePreorder}
                                    disabled={!currentDesign}
                                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all text-lg"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Preorder Now
                                </button>

                                {!currentDesign && (
                                    <p className="text-sm text-gray-500 text-center">
                                        Upload a design to enable preorder
                                    </p>
                                )}

                                <p className="text-xs text-gray-600 text-center">
                                    This is a preorder. We'll contact you with payment details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
