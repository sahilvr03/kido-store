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

  /** ✅ Check session to see if user is logged in */
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

  /** ✅ Add to Cart Handler */
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

  /** ✅ Buy Now Handler */
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

  /** ✅ Price & Discount Calculation */
  const displayPrice = parseFloat(product.price || 0);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const discount =
    originalPrice && displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : product.discount || 0;

  /** ✅ Animation Variants */
  const buttonHover = { scale: 1.15, rotate: [0, 5, -5, 0], transition: { duration: 0.3 } };
  const buttonTap = { scale: 0.85, transition: { duration: 0.2 } };
  const cardHover = { scale: 1.03, rotate: [0, 1.5, -1.5, 0], transition: { duration: 0.4 } };

  /** ✅ Badge Display */
  const getBadge = () => {
    switch (product.type) {
      case 'flashSale':
        return (
          <motion.div
            className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {discount > 0 ? `${discount}% OFF 🎉` : 'Flash Sale ⚡'}
          </motion.div>
        );
      case 'recommended':
        return (
          <motion.div
            className="absolute top-2 left-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Recommended 🌟
          </motion.div>
        );
      default:
        return null;
    }
  };

  /** ✅ Optimized Cloudinary Image */
  const optimizedImageUrl = product.images?.[0]
    ? `${product.images[0].split('/upload/')[0]}/upload/w_400,h_400,c_fill/${product.images[0].split('/upload/')[1]}`
    : product.imageUrl?.trim()
    ? `${product.imageUrl.split('/upload/')[0]}/upload/w_400,h_400,c_fill/${product.imageUrl.split('/upload/')[1]}`
    : '/placeholder.jpg';

  /** ✅ Authentication Modal */
  const AuthModal = () => (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          className="fixed inset-0 bg-blue-900/70 backdrop-blur-lg flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          key="auth-modal-backdrop"
        >
          <motion.div
            className="bg-gradient-to-b from-yellow-100 to-blue-100 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center relative border-4 border-blue-500"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <motion.button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-3 right-3 text-blue-900 hover:text-orange-600 transition-colors duration-200"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <XCircle className="w-6 h-6" />
            </motion.button>
            <LogIn className="w-14 h-14 text-orange-600 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3">
              Let’s Play! Sign In First 😺
            </h2>
            <p className="text-sm sm:text-base text-blue-800 mb-6 font-semibold">
              You need to sign in to grab this toy! 🚀
            </p>
            <div className="space-y-3">
              <motion.button
                onClick={() => {
                  router.push(`/pages/login?redirect=/products/${product._id}`);
                  setShowAuthModal(false);
                }}
                className="w-full border-4 border-blue-600 bg-orange-200 hover:bg-orange-300 text-blue-900 text-base sm:text-lg font-bold px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <LogIn className="w-5 h-5" />
                Go to Login 🔑
              </motion.button>
              <motion.button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-blue-900 hover:text-orange-600 text-base sm:text-lg font-bold transition-colors duration-200"
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
      <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} transitionSpeed={250}>
        <motion.div
          className="relative bg-gradient-to-b from-white to-blue-50 rounded-3xl shadow-lg overflow-hidden group flex flex-col h-full border border-gray-200 hover:border-blue-600 transition-all duration-300 font-baloo max-w-[300px] sm:max-w-sm mx-auto"
          whileHover={cardHover}
        >
          {/* Product Image */}
          <Link href={`/products/${product._id}`} className="block flex-grow">
            <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl">
              <Image
                src={optimizedImageUrl}
                alt={product.title || 'Toy Image'}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
                priority={isSale}
              />
              {getBadge()}
              {product.type === 'flashSale' && product.endDate && (
                <motion.div
                  className="absolute bottom-0 w-full text-white text-center text-xs sm:text-sm py-1 sm:py-2 font-bold bg-gradient-to-r from-orange-500 to-yellow-500"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <CountdownTimer endDate={product.endDate} />
                </motion.div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 flex flex-col flex-grow">
              <h3 className="text-base sm:text-lg font-bold text-blue-900 line-clamp-2 mb-2 leading-tight group-hover:text-orange-600 transition-colors duration-300">
                {product.title || 'Super Fun Toy'} 
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-orange-600 font-bold text-lg sm:text-xl">
                  Rs: {displayPrice.toFixed(2)}
                </p>
                {originalPrice && (
                  <p className="text-blue-600 line-through text-xs sm:text-sm font-semibold">
                    Rs: {originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-blue-800">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
                        i < (product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-blue-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1">({product.reviews || 0} reviews)</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-blue-100 to-yellow-100 rounded-b-3xl">
            <motion.button
              onClick={handleAddToCart}
              disabled={loading}
              className="w-full border-2 sm:border-4 border-blue-600 bg-orange-200 hover:bg-orange-300 text-blue-900 text-sm sm:text-base font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              {loading ? 'Adding...' : 'Add to Cart '}
            </motion.button>
            <motion.button
              onClick={handleBuyNow}
              disabled={buyLoading}
              className="w-full border-2 sm:border-4 border-blue-600 bg-blue-200 hover:bg-blue-300 text-blue-900 text-sm sm:text-base font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              {buyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
              {buyLoading ? 'Processing...' : 'Buy Now '}
            </motion.button>
          </div>
        </motion.div>
      </Tilt>
      <AuthModal />
    </>
  );
}
