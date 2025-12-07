import { ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
    cartItemCount: number;
    onCartClick: () => void;
}

export default function Navbar({ cartItemCount, onCartClick }: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <img
                    src="/alura-logo.png"
                    alt="Alura"
                    className="h-10 hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => navigate('/')}
                />

                <div className="flex items-center gap-8">
                    {isHome && (
                        <button
                            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hover:text-primary transition-colors font-medium text-sm tracking-wide"
                        >
                            ABOUT
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/customize')}
                        className="hover:text-primary transition-colors font-medium text-sm tracking-wide"
                    >
                        DESIGN
                    </button>
                    <button
                        onClick={onCartClick}
                        className="relative hover:text-primary transition-colors"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}
