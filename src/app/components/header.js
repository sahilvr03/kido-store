'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  Grid,
  Tag,
  Sparkles,
  LogOut,
  ChevronDown,
  Package,
  LogIn,
  UserPlus,
  Zap,
  Star,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Adding premium, playful Google Fonts
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/700.css';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    async function fetchSessionAndData() {
      setError(null);
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from session API');
        }
        const data = await response.json();
        if (response.ok && data.session && data.session.user) {
          setIsLoggedIn(true);
          setUserDetails(data.session.user);
          const cartResponse = await fetch(`/api/cart?userId=${data.session.user.id}`, {
            credentials: 'include',
          });
          const cartContentType = cartResponse.headers.get('content-type');
          if (!cartContentType || !cartContentType.includes('application/json')) {
            throw new Error('Received non-JSON response from cart API');
          }
          const cartData = await cartResponse.json();
          if (cartResponse.ok) {
            const count = cartData.items ? cartData.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            setCartCount(count);
          } else {
            throw new Error(cartData.error || 'Failed to fetch cart');
          }
        } else {
          setIsLoggedIn(false);
          setUserDetails(null);
          setCartCount(0);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to fetch session data. Please try again later.');
        toast.error('Invalid session. Please log in.', {
          style: {
            background: '#DBEAFE',
            color: '#1E3A8A',
            border: '2px solid #F97316',
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(249, 115, 22, 0.4)',
            fontFamily: 'Baloo 2, sans-serif',
            fontWeight: '700',
            padding: '12px 16px',
          },
          iconTheme: { primary: '#F97316', secondary: '#DBEAFE' },
        });
        router.push('/pages/login');
      }

      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data);
        } else {
          throw new Error(data.error || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories.', {
          style: {
            background: '#DBEAFE',
            color: '#1E3A8A',
            border: '2px solid #F97316',
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(249, 115, 22, 0.4)',
            fontFamily: 'Baloo 2, sans-serif',
            fontWeight: '700',
            padding: '12px 16px',
          },
          iconTheme: { primary: '#F97316', secondary: '#DBEAFE' },
        });
      }
    }

    fetchSessionAndData();

    const handleCartUpdate = (e) => {
      setCartCount(e.detail.count);
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [router]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        toast.success('Logged out successfully!', {
          style: {
            background: '#DBEAFE',
            color: '#91c90eff',
            border: '2px solid #F97316',
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(249, 115, 22, 0.4)',
            fontFamily: 'Baloo 2, sans-serif',
            fontWeight: '700',
            padding: '12px 16px',
          },
          iconTheme: { primary: '#F97316', secondary: '#DBEAFE' },
        });

        setIsLoggedIn(false);
        setUserDetails(null);
        setCartCount(0);
        router.push('/pages/login');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Logout failed.', {
          style: {
            background: '#DBEAFE',
            color: '#1E3A8A',
            border: '2px solid #EF4444',
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)',
            fontFamily: 'Baloo 2, sans-serif',
            fontWeight: '700',
            padding: '12px 16px',
          },
          iconTheme: { primary: '#EF4444', secondary: '#DBEAFE' },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('An error occurred during logout.', {
        style: {
          background: '#DBEAFE',
          color: '#1E3A8A',
          border: '2px solid #EF4444',
          borderRadius: '20px',
          boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '12px 16px',
        },
        iconTheme: { primary: '#EF4444', secondary: '#DBEAFE' },
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {error && (
        <motion.div
          className="bg-blue-100 text-blue-900 p-3 sm:p-4 text-center text-base sm:text-lg font-bold rounded-3xl shadow-xl mx-2 sm:mx-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      <motion.header
        className="bg-gradient-to-r from-green-900 to-yellow-600 dark:from-blue-900 dark:to-blue-900 shadow-2xl sticky top-0 z-50 border-b-4 border-orange-500 dark:border-orange-600 font-baloo"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <motion.button
                className="md:hidden p-2 sm:p-3 rounded-full hover:bg-orange-500/20 transition-colors duration-300"
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </motion.button>
              <Link
                href="/"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3"
              >
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 animate-bounce" />
                KiddoShop ✨
              </Link>
            </div>
            <div className="hidden md:flex flex-grow mx-4 lg:mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Discover awesome toys! 🎈"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/90 dark:bg-blue-800/90 border-2 border-orange-400 dark:border-orange-500 rounded-3xl py-2 sm:py-3 pl-10 sm:pl-14 pr-10 sm:pr-12 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-200 text-base sm:text-lg text-blue-900 dark:text-white placeholder-orange-400 dark:placeholder-orange-300 transition-all duration-300 shadow-md hover:shadow-orange-300/50 font-baloo"
                  aria-label="Search products"
                />
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ rotate: { duration: 0.3 } }}
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.button>
                )}
              </form>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <motion.button
                className="md:hidden p-2 sm:p-3 rounded-full hover:bg-orange-500/20 transition-colors duration-300"
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                <Search className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </motion.button>
              <Link
                href="/pages/orders"
                className="flex items-center p-2 sm:p-3 rounded-full text-white hover:text-orange-300 transition-colors duration-300 font-bold font-baloo text-base sm:text-lg"
              >
                <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.9 }}>
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.div>
                <span className="ml-2 hidden lg:inline">Orders</span>
              </Link>
              {isLoggedIn ? (
                <div className="relative group" onMouseEnter={() => setProfileDropdownOpen(true)} onMouseLeave={() => setProfileDropdownOpen(false)}>
                  <button
                    className="flex items-center p-2 sm:p-3 rounded-full text-white hover:text-orange-300 transition-colors duration-300 font-bold font-baloo text-base sm:text-lg"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.9 }}>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md font-baloo">
                        {userDetails?.name?.[0]?.toUpperCase() || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </div>
                    </motion.div>
                    <span className="ml-2 hidden lg:inline">{userDetails?.name || 'Account'}</span>
                  </button>
                  <motion.div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-48 sm:w-56 bg-blue-200 dark:bg-blue-700 shadow-2xl rounded-3xl py-2 sm:py-3 z-50 border-2 border-orange-400 dark:border-orange-500"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: profileDropdownOpen ? 1 : 0, y: profileDropdownOpen ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg text-blue-900 dark:text-white hover:bg-orange-300 dark:hover:bg-orange-400 transition-colors duration-200 font-baloo font-bold"
                    >
                      Logout 🚀
                    </button>
                  </motion.div>
                </div>
              ) : (
                <>
                  <Link
                    href="/pages/login"
                    className="flex items-center p-2 sm:p-3 rounded-full text-white hover:text-orange-300 transition-colors duration-300 font-bold font-baloo text-base sm:text-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.9 }}>
                      <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>
                    <span className="ml-2 hidden lg:inline">Login</span>
                  </Link>
                  <Link
                    href="/pages/signup"
                    className="flex items-center p-2 sm:p-3 rounded-full text-white hover:text-orange-300 transition-colors duration-300 font-bold font-baloo text-base sm:text-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.9 }}>
                      <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>
                    <span className="ml-2 hidden lg:inline">Sign Up</span>
                  </Link>
                </>
              )}
              <Link href="/carts" className="relative p-2 sm:p-3 rounded-full text-white hover:text-orange-300 transition-colors duration-300 font-bold font-baloo text-base sm:text-lg">
                <motion.div whileHover={{ scale: 1.15, rotate: 8 }} whileTap={{ scale: 0.9 }}>
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  {cartCount > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full flex items-center justify-center border-2 border-orange-300 dark:border-orange-600 shadow-md font-baloo"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0], transition: { repeat: Infinity, duration: 1.2 } }}
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            </div>
          </div>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                className="md:hidden mb-4 sm:mb-6"
                initial={{ opacity: 0, maxHeight: 0 }}
                animate={{ opacity: 1, maxHeight: 100 }}
                exit={{ opacity: 0, maxHeight: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Discover awesome toys! 🎈"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/90 dark:bg-blue-800/90 border-2 border-orange-400 dark:border-orange-500 rounded-3xl py-2 sm:py-3 pl-10 sm:pl-14 pr-10 sm:pr-12 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-200 text-base sm:text-lg text-blue-900 dark:text-white placeholder-orange-400 dark:placeholder-orange-300 transition-all duration-300 shadow-md hover:shadow-orange-300/50 font-baloo"
                    aria-label="Search products"
                  />
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                  {searchQuery && (
                    <motion.button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ rotate: { duration: 0.3 } }}
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="hidden md:flex items-center justify-center gap-4 lg:gap-8 py-2 sm:py-3 border-t-4 border-orange-500 dark:border-orange-600">
            <Link href="/" className="flex items-center gap-2 text-base lg:text-lg font-bold text-white hover:text-orange-300 transition-colors duration-200 font-baloo">
              <Home className="h-4 w-4 lg:h-5 lg:w-5" /> Home 🏠
            </Link>
            <Link href="/pages/FlashSalePage" className="flex items-center gap-2 text-base lg:text-lg font-bold text-white hover:text-orange-300 transition-colors duration-200 font-baloo">
              <Zap className="h-4 w-4 lg:h-5 lg:w-5" /> Flash Sale ⚡
            </Link>
            <Link href="/pages/RecommendedPage" className="flex items-center gap-2 text-base lg:text-lg font-bold text-white hover:text-orange-300 transition-colors duration-200 font-baloo">
              <Star className="h-4 w-4 lg:h-5 lg:w-5" /> Recommended 🌟
            </Link>
            <Link href="/pages/ForYouPage" className="flex items-center gap-2 text-base lg:text-lg font-bold text-white hover:text-orange-300 transition-colors duration-200 font-baloo">
              <Heart className="h-4 w-4 lg:h-5 lg:w-5" /> For You 💖
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-2 text-base lg:text-lg font-bold text-white hover:text-orange-300 transition-colors duration-200 py-2 px-3 sm:px-4 rounded-3xl font-baloo">
                <Grid className="h-4 w-4 lg:h-5 lg:w-5" /> Categories 🎨
                <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              <motion.div
                className="absolute left-0 top-full mt-2 w-48 sm:w-56 bg-blue-200 dark:bg-blue-700 shadow-2xl rounded-3xl py-2 sm:py-3 z-50 border-2 border-orange-400 dark:border-orange-500 hidden group-hover:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/pages/CategoryPage/${category._id}`}
                      className="block px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg text-blue-900 dark:text-white hover:bg-orange-300 dark:hover:bg-orange-400 transition-colors duration-200 font-baloo font-bold"
                    >
                      {category.name} 🌈
                    </Link>
                  ))
                ) : (
                  <p className="px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg text-orange-500 dark:text-orange-300 font-baloo">No categories available 😿</p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-gradient-to-b from-blue-300 to-blue-500 dark:from-blue-600 dark:to-blue-800 backdrop-blur-lg shadow-2xl fixed inset-0 z-70 pt-16 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
              <motion.button
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-3 rounded-full hover:bg-orange-500/20 transition-colors duration-300"
                onClick={() => setMobileMenuOpen(false)}
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close menu"
              >
                <X className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </motion.button>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 font-baloo">
                    Explore 🌟
                  </h3>
                  <nav className="space-y-2 sm:space-y-3">
                    <Link
                      href="/"
                      className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Home 🏠
                    </Link>
                    <Link
                      href="/pages/FlashSalePage"
                      className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Flash Sale ⚡
                    </Link>
                    <Link
                      href="/pages/RecommendedPage"
                      className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Recommended 🌟
                    </Link>
                    <Link
                      href="/pages/ForYouPage"
                      className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> For You 💖
                    </Link>
                    <div className="relative">
                      <button
                        className="w-full text-left py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                        onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                      >
                        <Grid className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Categories 🎨
                        <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 ml-auto transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {categoryMenuOpen && (
                          <motion.div
                            className="pl-4 sm:pl-6 space-y-2 sm:space-y-2 mt-2 sm:mt-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <Link
                                  key={category._id}
                                  href={`/pages/CategoryPage/${category._id}`}
                                  className="block py-2 sm:py-3 px-3 sm:px-4 bg-blue-200 dark:bg-blue-700 rounded-3xl text-base sm:text-lg text-blue-900 dark:text-white hover:bg-orange-300 dark:hover:bg-orange-400 transition-colors duration-200 font-baloo font-bold"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  {category.name} 🌈
                                </Link>
                              ))
                            ) : (
                              <p className="py-2 sm:py-3 px-3 sm:px-4 text-base sm:text-lg text-orange-500 dark:text-orange-300 font-baloo">No categories available 😿</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </nav>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider mb-3 sm:mb-4 font-baloo">
                    My Account 😺
                  </h3>
                  <nav className="space-y-2 sm:space-y-3">
                    {isLoggedIn ? (
                      <>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                        >
                          <LogOut className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Logout 😺
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/pages/login"
                          className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LogIn className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Sign In 🔑
                        </Link>
                        <Link
                          href="/pages/signup"
                          className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> Sign Up 🌟
                        </Link>
                      </>
                    )}
                    <Link
                      href="/pages/orders"
                      className="block py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 flex items-center text-base sm:text-lg font-baloo font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" /> My Orders 📦
                    </Link>
                  </nav>
                </div>
                <motion.button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center py-2 sm:py-3 px-3 sm:px-4 rounded-3xl text-white hover:text-orange-300 transition-colors duration-200 text-base sm:text-lg font-baloo font-bold"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-5 w-5 sm:h-6 sm:w-6 mr-3 sm:mr-4 text-white" />
                      Switch to Light Mode ☀️
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5 sm:h-6 sm:w-6 mr-3 sm:mr-4 text-white" />
                      Switch to Dark Mode 🌙
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}