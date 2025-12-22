import { useEffect, useState } from 'react';
import { getProducts, savePreorder } from '../lib/firebase';
import type { Product } from '../lib/firebase';
import { ShoppingCart, X, CheckCircle } from 'lucide-react';

// Products is read-only in the UI. Editing is done via the repository (code) per user request.

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);



    // Preorder modal
    const [preorderOpen, setPreorderOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [email, setEmail] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmittingPreorder, setIsSubmittingPreorder] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);






    async function loadProducts() {
        setLoading(true);
        const res = await getProducts();
        setProducts(res);
        setLoading(false);
    }



    function openPreorder(p: Product) {
        setSelectedProduct(p);
        setEmail('');
        setQuantity(1);
        setSubmitSuccess(false);
        setPreorderOpen(true);
    }

    async function handleSubmitPreorder() {
        if (!email || !email.includes('@')) return alert('Please enter a valid email');
        if (!selectedProduct) return;
        setIsSubmittingPreorder(true);
        try {
            const res = await savePreorder({
                email,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                productImage: selectedProduct.imageUrl,
                quantity,
                total: selectedProduct.price * quantity
            });

            if (res.success) {
                setSubmitSuccess(true);
                setTimeout(() => {
                    setPreorderOpen(false);
                }, 1200);
            } else {
                alert('Failed to submit preorder');
            }
        } catch (error) {
            console.error('Preorder error:', error);
            alert('Failed to submit preorder');
        }
        setIsSubmittingPreorder(false);
    }

    return (
        <section id="products" className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-modak">Ready Designs</h2>
                </div>

                {loading ? (
                    <div className="text-center text-gray-400">Loading products...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {products.map(p => (
                            <div key={p.id} className="bg-surface rounded-xl p-4 space-y-3">
                                <div className="h-44 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                                    {p.imageUrl ? (
                                        <img src={`/${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-500">No image</div>
                                    )}
                                </div>

                                <div id={`product-${p.id}`} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{p.name || <span className="text-gray-500 italic">(empty name)</span>}</div>
                                        <div className="text-sm text-gray-400">{p.price} Kč</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openPreorder(p)} className="bg-primary text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4" /> Preorder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Preorder Modal */}
            {preorderOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-white/10">
                        {submitSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Preorder Submitted!</h3>
                                <p className="text-gray-400">We'll contact you soon at {email}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Preorder — {selectedProduct.name}</h3>
                                    <button onClick={() => setPreorderOpen(false)} className="p-2"><X /></button>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold">Your Email</label>
                                    <input className="w-full px-3 py-2 bg-black/50 rounded border border-white/30 focus:border-primary outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />

                                    <label className="block text-sm font-bold">Quantity</label>
                                    <input type="number" className="w-full px-3 py-2 bg-black/50 rounded border border-white/30 focus:border-primary outline-none" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />

                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleSubmitPreorder} disabled={isSubmittingPreorder} className="bg-primary text-white px-4 py-2 rounded">
                                            {isSubmittingPreorder ? 'Sending...' : 'Submit Preorder'}
                                        </button>
                                        <button onClick={() => setPreorderOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
