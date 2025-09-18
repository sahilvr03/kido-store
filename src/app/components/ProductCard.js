'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart,
  Star,
  Loader2,
  ShoppingBag,
  XCircle,
  LogIn,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import CountdownTimer from './CountdownTimer';
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/700.css';

export default function ProductCard({ product, isSale = false }) {
  const [loading, setLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const checkSession = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json();
      return sessionData?.session?.user || null;
    } catch (error) {
      console.error('Session check failed:', error);
      return null;
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (loading || showAuthModal) return;
    setLoading(true);
    const user = await checkSession();
    if (!user) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add to cart');
      }
      const cartResponse = await fetch('/api/cart', { credentials: 'include' });
      const cartData = await cartResponse.json();
      const count = cartData.items
        ? cartData.items.reduce((sum, item) => sum + item.quantity, 0)
        : 0;
      toast.success(`${product.title} added to cart! 🎉`, {
        style: {
          background: '#FFF7ED',
          color: '#1E3A8A',
          border: '3px solid #F97316',
          borderRadius: '25px',
          boxShadow: '0 10px 20px rgba(249, 115, 22, 0.5)',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '14px 18px',
        },
        iconTheme: { primary: '#F97316', secondary: '#FFF7ED' },
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count } }));
      }
    } catch (error) {
      toast.error(error.message || 'Oops! Couldn’t add to cart 😿', {
        style: {
          background: '#FFF7ED',
          color: '#1E3A8A',
          border: '3px solid #EF4444',
          borderRadius: '25px',
          boxShadow: '0 10px 20px rgba(239, 68, 68, 0.5)',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '14px 18px',
        },
        iconTheme: { primary: '#EF4444', secondary: '#FFF7ED' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    if (buyLoading || showAuthModal) return;
    setBuyLoading(true);
    const user = await checkSession();
    if (!user) {
      setShowAuthModal(true);
      setBuyLoading(false);
      return;
    }
    router.push(`/products/${product._id}`);
    setBuyLoading(false);
  };

  const displayPrice = parseFloat(product.price || 0);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const discount =
    originalPrice && displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : product.discount || 0;

  const buttonHover = { scale: 1.15, rotate: [0, 5, -5, 0], transition: { duration: 0.3 } };
  const buttonTap = { scale: 0.85, transition: { duration: 0.2 } };
  const cardHover = { scale: 1.05, rotate: [0, 2, -2, 0], transition: { duration: 0.4 } };

  const getBadge = () => {
    switch (product.type) {
      case 'flashSale':
        return (
          <motion.div
            className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {discount > 0 ? `${discount}% OFF 🎉` : 'Flash Sale ⚡'}
          </motion.div>
        );
      case 'recommended':
        return (
          <motion.div
            className="absolute top-3 left-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Recommended 🌟
          </motion.div>
        );
      default:
        return null;
    }
  };

  const optimizedImageUrl = product.images?.[0]
    ? `${product.images[0].split('/upload/')[0]}/upload/w_400,h_400,c_fill/${product.images[0].split('/upload/')[1]}`
    : product.imageUrl?.trim()
    ? `${product.imageUrl.split('/upload/')[0]}/upload/w_400,h_400,c_fill/${product.imageUrl.split('/upload/')[1]}`
    : '/placeholder.jpg';

  const AuthModal = () => (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          className="fixed inset-0 bg-blue-900/70 backdrop-blur-lg flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          key="auth-modal-backdrop"
        >
          <motion.div
            className="bg-gradient-to-b from-yellow-100 to-blue-100 rounded-3xl shadow-2xl p-8 w-96 max-w-[90%] text-center relative border-4 border-blue-500"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            role="dialog"
            aria-labelledby="auth-modal-title"
            aria-modal="true"
          >
            <motion.button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-blue-900 hover:text-orange-600 transition-colors duration-200"
              whileHover={{ scale: 1.3, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close login modal"
            >
              <XCircle className="w-6 h-6" />
            </motion.button>
            <LogIn className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-bounce" />
            <h2 id="auth-modal-title" className="text-2xl font-bold text-blue-900 mb-3">
              Let’s Play! Sign In First 😺
            </h2>
            <p className="text-base text-blue-800 mb-6 font-semibold">
              You need to sign in to grab this toy! 🚀
            </p>
            <div className="space-y-3">
              <motion.button
                onClick={() => {
                  router.push(`/pages/login?redirect=/products/${product._id}`);
                  setShowAuthModal(false);
                }}
                className="w-full border-4 border-blue-600 bg-orange-200 hover:bg-orange-300 text-blue-900 text-lg font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <LogIn className="w-5 h-5" />
                Go to Login 🔑
              </motion.button>
              <motion.button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-blue-900 hover:text-orange-600 text-lg font-bold transition-colors duration-200"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel 😿
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={300}>
        <motion.div
          className="relative bg-gradient-to-b from-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden group flex flex-col h-full   hover:border-blue-600 transition-all duration-300 font-baloo mx-6 my-4 "
          whileHover={cardHover}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          <Link href={`/products/${product._id}`} className="block flex-grow">
            <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl">
              <Image
                src={optimizedImageUrl}
                alt={product.title || 'Toy Image'}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-115 group-hover:rotate-2"
                priority={isSale}
              />
              {getBadge()}
              {product.type === 'flashSale' && product.endDate && (
                <motion.div
                  className="absolute bottom-0 w-full text-white text-center text-sm py-2 font-bold bg-gradient-to-r from-orange-500 to-yellow-500"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <CountdownTimer endDate={product.endDate} />
                </motion.div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-blue-900 line-clamp-2 mb-2 leading-tight group-hover:text-orange-600 transition-colors duration-300 drop-shadow-sm">
                {product.title || 'Super Fun Toy'} 🎈
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-orange-600 font-bold text-xl drop-shadow-md">
                  Rs:{displayPrice.toFixed(2)}
                </p>
                {originalPrice && (
                  <p className="text-blue-600 line-through text-sm font-semibold">
                    Rs:{originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-blue-800">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-blue-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1">({product.reviews || 0} stars)</span>
                </div>
              </div>
            </div>
          </Link>
          <div className="p-4 space-y-3 bg-gradient-to-b from-blue-100 to-yellow-100 rounded-b-3xl">
            <motion.button
              onClick={handleAddToCart}
              disabled={loading}
              className="w-full border-4 border-blue-600 bg-orange-200 hover:bg-orange-300 text-blue-900 text-base font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              {loading ? 'Adding...' : 'Add to Cart 🛒'}
            </motion.button>
            <motion.button
              onClick={handleBuyNow}
              disabled={buyLoading}
              className="w-full border-4 border-blue-600 bg-blue-200 hover:bg-blue-300 text-blue-900 text-base font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              {buyLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              {buyLoading ? 'Processing...' : 'Buy Now 🚀'}
            </motion.button>
          </div>
        </motion.div>
      </Tilt>
      <AuthModal />
    </>
  );
}