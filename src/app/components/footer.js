'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Twitter,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Sparkles,
  Palette,
  Heart,
} from 'lucide-react';

export default function Footer() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [openSections, setOpenSections] = useState({
    youngMakersHelp: false,
    ourStory: false,
    craftShop: false,
  });
  const [isClient, setIsClient] = useState(false);

  // Footer link data (kid-friendly labels)
  const footerLinks = {
    youngMakersHelp: [
      { href: '/contact', label: 'Ask for Help!' },
      { href: '/faqs', label: 'Fun Questions' },
      { href: '/shipping', label: 'Magic Delivery' },
      { href: '/returns', label: 'Oops! Send Back' },
    ],
    ourStory: [
      { href: '/about', label: 'Our Adventure' },
      { href: '/careers', label: 'Join the Fun Team' },
      { href: '/terms', label: 'Play Rules' },
      { href: '/privacy', label: 'Secret Keeper' },
    ],
    craftShop: [
      { href: '/products', label: 'All Cool Crafts' },
      { href: '/featured', label: 'Super Stars' },
      { href: '/new-arrivals', label: 'Brand New Magic' },
      { href: '/deals', label: 'Treasure Deals' },
    ],
  };

  // Set isClient to true on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync dark mode with localStorage (keep for fun night/day theme)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const darkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(darkMode);
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Toggle collapsible sections on mobile
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Oops! Enter your magic email!', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        },
        iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
      });
      return;
    }

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Yay! You\'re in for fun crafts!', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #F85606',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(248, 86, 6, 0.2)',
          },
          iconTheme: { primary: '#F85606', secondary: '#FFFFFF' },
        });
        setEmail('');
      } else {
        toast.error(data.message || 'Oops! Try again.', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
        });
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Magic glitch! Try again.', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        },
        iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
      });
    }
  };

  // Clear email input
  const clearEmail = () => {
    setEmail('');
  };

  return (
    <motion.footer
      className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-gray-600 dark:text-gray-300 border-t border-purple-200 dark:border-purple-800 py-10 sm:py-12 z-10 font-poppins"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Young Makers Help */}
          <div>
            <motion.button
              className="w-full md:cursor-default flex justify-between items-center text-sm font-semibold text-purple-800 dark:text-purple-100 uppercase tracking-wider mb-4 md:mb-5 flex items-center"
              onClick={() => toggleSection('youngMakersHelp')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-expanded={openSections.youngMakersHelp}
              aria-controls="young-makers-links"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Young Makers Help
              <span className="md:hidden">
                {openSections.youngMakersHelp ? (
                  <ChevronUp className="h-5 w-5 text-pink-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-pink-500" />
                )}
              </span>
            </motion.button>
            <AnimatePresence>
              {(openSections.youngMakersHelp || isClient) && (
                <motion.ul
                  id="young-makers-links"
                  className="space-y-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {footerLinks.youngMakersHelp.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200 flex items-center"
                      >
                        <Heart className="h-3 w-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {/* Our Story */}
          <div>
            <motion.button
              className="w-full md:cursor-default flex justify-between items-center text-sm font-semibold text-purple-800 dark:text-purple-100 uppercase tracking-wider mb-4 md:mb-5 flex items-center"
              onClick={() => toggleSection('ourStory')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-expanded={openSections.ourStory}
              aria-controls="our-story-links"
            >
              <Palette className="h-4 w-4 mr-2" />
              Our Story
              <span className="md:hidden">
                {openSections.ourStory ? (
                  <ChevronUp className="h-5 w-5 text-pink-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-pink-500" />
                )}
              </span>
            </motion.button>
            <AnimatePresence>
              {(openSections.ourStory || isClient) && (
                <motion.ul
                  id="our-story-links"
                  className="space-y-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {footerLinks.ourStory.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200 flex items-center"
                      >
                        <Heart className="h-3 w-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {/* Craft Shop */}
          <div>
            <motion.button
              className="w-full md:cursor-default flex justify-between items-center text-sm font-semibold text-purple-800 dark:text-purple-100 uppercase tracking-wider mb-4 md:mb-5 flex items-center"
              onClick={() => toggleSection('craftShop')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-expanded={openSections.craftShop}
              aria-controls="craft-shop-links"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Craft Shop
              <span className="md:hidden">
                {openSections.craftShop ? (
                  <ChevronUp className="h-5 w-5 text-pink-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-pink-500" />
                )}
              </span>
            </motion.button>
            <AnimatePresence>
              {(openSections.craftShop || isClient) && (
                <motion.ul
                  id="craft-shop-links"
                  className="space-y-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {footerLinks.craftShop.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200 flex items-center"
                      >
                        <Heart className="h-3 w-3 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {/* Stay Connected */}
          <div>
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-100 uppercase tracking-wider mb-4 md:mb-5 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Stay Magical
            </h3>
            <p className="text-sm mb-4">
              Get sparkly updates and craft ideas just for you!
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="email"
                  placeholder="Your magic email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-purple-800 border border-purple-200 dark:border-purple-600 rounded-lg sm:rounded-l-lg sm:rounded-r-none px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 transition-all duration-300"
                  aria-label="Newsletter email"
                />
                {email && (
                  <motion.button
                    type="button"
                    onClick={clearEmail}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Clear email"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
              <motion.button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg sm:rounded-r-lg sm:rounded-l-none text-sm font-medium transition-colors duration-300 shadow-md hover:shadow-lg flex items-center"
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="inline h-4 w-4 mr-2" />
                Sparkle Up!
              </motion.button>
            </form>
          </div>
        </div>
        <div className="pt-6 sm:pt-8 border-t border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="mb-4 sm:mb-0 text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Kiddo Crafts. All magic reserved. ✨
          </p>
          <div className="flex space-x-4 sm:space-x-6">
            <motion.a
              href="https://facebook.com"
              className="text-purple-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Facebook"
            >
              <Facebook className="h-6 w-6" />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              className="text-purple-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Instagram"
            >
              <Instagram className="h-6 w-6" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              className="text-purple-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Twitter"
            >
              <Twitter className="h-6 w-6" />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}