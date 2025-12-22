import { useEffect, useState } from 'react';
import { getProducts } from '../lib/firebase';
import type { Product } from '../lib/firebase';
import { ShoppingCart } from 'lucide-react';

// Products is read-only in the UI. Editing is done via the repository (code) per user request.

interface ProductsProps {
    onAddToCart?: (product: any, quantity?: number) => void;
}

export default function Products({ onAddToCart }: ProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);



    // Note: product preorders now add to cart; modal removed

    useEffect(() => {
        loadProducts();
    }, []);






    async function loadProducts() {
        setLoading(true);
        const res = await getProducts();
        setProducts(res);
        setLoading(false);
    }



    function addToCartFromProduct(p: Product) {
        // Create a CartItem-like object for a ready product
        const item = {
            id: `prod-${p.id}`,
            design: {
                id: `prod-${p.id}`,
                imageUrl: `/${p.imageUrl}`,
                thumbnail: `/${p.imageUrl}`,
            },
            quantity: 1,
            price: p.price
        };

        if (onAddToCart) onAddToCart(item, 1);
    }

    // product preorders handled via cart/checkout flow

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
                                        <div className="text-sm text-gray-400">{p.price} €</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { addToCartFromProduct(p); }} className="bg-primary text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4" /> Preorder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* product preorders add to cart — no modal here */}
        </section>
    );
}
