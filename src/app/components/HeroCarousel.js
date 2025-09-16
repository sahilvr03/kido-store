"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ArrowRight } from 'lucide-react';

const promotions = [
  {
    id: 1,
    title: 'Spectacular Summer Savings: Up To 70% Off!',
    description: 'Unbeatable deals on your favorite brands. Don’t miss out, offers are for a limited time!',
    image: '/ad1.webp',
  },
  {
    id: 2,
    title: 'Anime Collection: New Drops Available Now!',
    description: 'Fresh drop shoulder tees inspired by your favorite anime heroes. Shop now!',
    image: '/ad2.webp',
  },
  {
    id: 3,
    title: 'Flash Sale: 50% Off All Tees!',
    description: 'Only for 48 hours! Grab your style before it’s gone.',
    image: '/ad3.webp',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % promotions.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + promotions.length) % promotions.length);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-[28rem] rounded-2xl overflow-hidden shadow-xl border border-gray-200 mb-8 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={promotions[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${promotions[current].image})` }}
        >
          <div className="w-full h-full bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center px-6 sm:px-12">
            <div className="max-w-xl space-y-5">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-4xl font-bold text-white drop-shadow-md"
              >
                {promotions[current].title}
              </motion.h1>
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-sm sm:text-lg leading-relaxed"
              >
                {promotions[current].description}
              </motion.p>
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/pages/FlashSalePage">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-md flex items-center">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <motion.button
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiChevronLeft size={22} />
      </motion.button>
      <motion.button
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiChevronRight size={22} />
      </motion.button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {promotions.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              current === idx ? 'bg-orange-500 w-6' : 'bg-white/40 w-2.5'
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>
    </div>
  );
}