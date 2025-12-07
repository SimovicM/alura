import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Footer from './components/Footer';
import CustomizerPage from './pages/CustomizerPage';
import type { CartItem, CustomDesign } from './types';

// Updated pricing: 250 CZK per roll
const PRICE_PER_ROLL = 250;

function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);

  const handleAddToCart = (design: CustomDesign, quantity: number) => {
    const newItem: CartItem = {
      id: design.id,
      design,
      quantity,
      price: PRICE_PER_ROLL,
    };

    setCartItems([...cartItems, newItem]);
    setIsCartOpen(true);
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
          <CustomizerPage
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
          />
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
    </div>
  );
}

export default App;
