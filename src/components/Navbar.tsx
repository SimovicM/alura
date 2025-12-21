import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavbarProps {
    cartItemCount: number;
    onCartClick: () => void;
}

export default function Navbar({ cartItemCount, onCartClick }: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
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

                <div className="flex items-center gap-8">
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
            </div>
        </motion.nav>
    );
}
