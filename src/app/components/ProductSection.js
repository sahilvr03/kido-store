import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';
import CountdownTimer from './CountdownTimer';
import '@fontsource/baloo-2/400.css';
import '@fontsource/baloo-2/700.css';

export default function ProductSection({ title, items, loading, error, link, icon, isSale = false, endDate }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  };
  const buttonHover = { scale: 1.1, rotate: 5 };
  const buttonTap = { scale: 0.9 };

  return (
    <section className="mb-12 p-4 sm:p-6  font-baloo bg-gradient-to-l from-blue-100 to-white shadow-lg ">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="p-3 rounded-xl bg-orange-100 mr-4 shadow-md">{icon}</div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">{title}</h2>
            {isSale && items.length > 0 && (
              <CountdownTimer endDate={endDate} className="text-sm text-blue-700 font-bold mt-1" />
            )}
          </div>
        </div>

        {/* View All Button */}
        <Link
          href={link}
          className="flex items-center border-2 border-blue-500 hover:bg-orange-100 text-blue-500 px-4 py-2 rounded-xl font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300"
        >
          <motion.div whileHover={buttonHover} whileTap={buttonTap}>
            View All <ChevronRight className="ml-1 h-5 w-5" />
          </motion.div>
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </motion.div>
        </div>
      ) : error && items.length === 0 ? (
        <motion.div
          className="text-center py-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
        >
          <p className="text-lg text-blue-900 font-bold mb-4">{error} 😿</p>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          className="text-center py-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
        >
          <svg
            className="w-16 h-16 mx-auto text-blue-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-lg text-blue-900 font-bold mb-4">No toys available 😿</p>
          <Link href="/products">
            <motion.button
              className="border-2 border-blue-500 hover:bg-orange-100 text-blue-500 px-6 py-3 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-300"
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              Explore All Toys 🌈
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((product) => (
            <motion.div key={product._id} variants={itemVariants}>
              <ProductCard product={product} isSale={isSale} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
