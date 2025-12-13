import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Footer from './components/Footer';
import CustomizerPage from './pages/CustomizerPage';
import type { CartItem } from './types';

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignupPopup(true);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSignupSubmit = async () => {
    if (!signupEmail || !signupEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsSubmittingSignup(true);
    // Here you would send the email to your backend or service
    // For now, just simulate
    setTimeout(() => {
      setIsSubmittingSignup(false);
      setShowSignupPopup(false);
      alert('Thank you for signing up! You\'ll be the first to know when Alura drops.');
    }, 1000);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckout(true);
    // Scroll to top for checkout
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutComplete = () => {
    setCartItems([]);
    setIsCheckout(false);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navbar
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <Routes>
        {/* Home Page */}
        <Route path="/" element={
          !isCheckout ? (
            <>
              <Hero />
              <About />
              <Footer />
            </>
          ) : (
            <>
              <Checkout
                items={cartItems}
                onComplete={handleCheckoutComplete}
              />
              <Footer />
            </>
          )
        } />

        {/* Dedicated Configurator Page */}
        <Route path="/customize" element={
          <CustomizerPage />
        } />
      </Routes>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-surface to-black rounded-2xl p-8 max-w-md w-full space-y-6 border border-primary/20">
            {/* Mail Icon */}
            <div className="relative h-20 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl"></div>
                <Mail className="w-20 h-20 text-primary relative" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-modak text-white">Get Notified</h3>
              <p className="text-sm text-gray-400">
                Alura is coming soon. Be the first to know when we launch and grab exclusive early-bird pricing.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-gray-300">Early launch notification</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-gray-300">Exclusive discount code</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                <span className="text-gray-300">First access to designs</span>
              </div>
            </div>

            {/* Input and buttons */}
            <div className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignupPopup(false)}
                  className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 rounded-lg transition-all font-medium"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleSignupSubmit}
                  disabled={isSubmittingSignup}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                >
                  {isSubmittingSignup ? 'Signing Up...' : 'Sign Up'}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

