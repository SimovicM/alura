import { ShoppingCart, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface NavbarProps {
    cartItemCount: number;
    onCartClick: () => void;
}

export default function Navbar({ cartItemCount, onCartClick }: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile dropdown on navigation changes
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    return (
        <>
            <motion.nav
                className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/5"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <motion.img
                        src="/alura-logo.png"
                        alt="Alura"
                        className="h-10 hover:opacity-80 transition-opacity cursor-pointer"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    />

                    {/* Desktop / tablet items only */}
                    <div className="hidden md:flex items-center gap-8">
                        {isHome && (
                            <motion.button
                                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-primary transition-colors font-medium text-sm tracking-wide"
                                whileHover={{ y: -2 }}
                            >
                                ABOUT
                            </motion.button>
                        )}
                        <motion.button
                            onClick={() => window.open('https://design.aluratape.cz', '_blank', 'noopener,noreferrer')}
                            className="hover:text-primary transition-colors font-medium text-sm tracking-wide"
                            whileHover={{ y: -2 }}
                        >
                            DESIGN
                        </motion.button>

                        {isHome && (
                            <motion.button
                                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-primary transition-colors font-medium text-sm tracking-wide"
                                whileHover={{ y: -2 }}
                            >
                                PRODUCTS
                            </motion.button>
                        )}
                        <motion.button
                            onClick={onCartClick}
                            className="relative hover:text-primary transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartItemCount > 0 && (
                                <motion.span
                                    className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500 }}
                                >
                                    {cartItemCount}
                                </motion.span>
                            )}
                        </motion.button>
                    </div>

                    {/* Mobile: show only menu button on phones */}
                    <div className="md:hidden flex items-center">
                        <button aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile dropdown (anchored under top nav) */}
            {mobileOpen && (
                <div className="md:hidden absolute left-4 right-4 top-16 z-50 bg-surface/90 border border-white/10 rounded-lg shadow-lg p-3 mx-4">
                    <div className="flex flex-col gap-3">
                        {isHome && (
                            <button onClick={() => { document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }} className="text-left hover:text-primary transition-colors font-medium">ABOUT</button>
                        )}

                        <button onClick={() => { window.open('https://design.aluratape.cz', '_blank', 'noopener,noreferrer'); setMobileOpen(false); }} className="text-left hover:text-primary transition-colors font-medium">DESIGN</button>

                        {isHome && (
                            <button onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }} className="text-left hover:text-primary transition-colors font-medium">PRODUCTS</button>
                        )}

                        <button onClick={() => { onCartClick(); setMobileOpen(false); }} className="text-left hover:text-primary transition-colors font-medium flex items-center gap-2">CART <span className="ml-auto text-xs text-gray-400">{cartItemCount} item(s)</span></button>
                    </div>
                </div>
            )}
        </>
    );
}
