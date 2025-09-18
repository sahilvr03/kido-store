"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HeroCarousel({ promotions, current, setCurrent }) {
  const intervalRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % promotions.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + promotions.length) % promotions.length);

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, []);

  const startAutoPlay = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(nextSlide, 6000);
  };

  const stopAutoPlay = () => clearInterval(intervalRef.current);

  return (
    <div
      className="relative w-full h-[30rem] sm:h-[34rem] md:h-[38rem] overflow-hidden  group"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-300 via-blue-200 to-blue-50 animate-gradient" />

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-10 left-8 text-5xl"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        🎈
      </motion.div>
      <motion.div
        className="absolute top-16 right-10 text-4xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        ⭐
      </motion.div>
      <motion.div
        className="absolute bottom-24 left-10 text-4xl"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        🎁
      </motion.div>

      {/* Main Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={promotions[current].id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
        >
          <div className="relative w-[85%] md:w-[70%] bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border-4 border-yellow-300 p-8 flex flex-col md:flex-row items-center gap-6">
            {/* Left Side Image */}
            <div className="flex-1 flex justify-center">
              <Image
                src={promotions[current].image}
                alt={promotions[current].title}
                width={400}
                height={400}
                className="rounded-3xl shadow-lg object-contain"
              />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 text-center md:text-left space-y-5">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-5xl font-extrabold text-pink-600 drop-shadow-lg font-comic"
              >
                {promotions[current].title} 🎉
              </motion.h1>

              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-700 text-base sm:text-lg leading-relaxed font-medium"
              >
                {promotions[current].description}
              </motion.p>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/pages/ForYouPage">
                  <button className="relative bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-400 hover:from-pink-500 hover:via-yellow-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-xl flex items-center group">
                    <span className="relative z-10 text-lg">Shop Now</span>
                    <ArrowRight className="ml-3 h-6 w-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full"></span>
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Thumbnail Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {promotions.map((promo, idx) => (
          <motion.div
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`cursor-pointer border-4 rounded-full overflow-hidden shadow-md transition-all duration-300 ${
              current === idx
                ? "border-pink-400 scale-110 shadow-pink-200"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            whileHover={{ scale: 1.1, y: -3 }}
          >
            <Image
              width={70}
              height={70}
              src={promo.image}
              alt={promo.title}
              className="h-14 w-14 object-cover rounded-full"
            />
          </motion.div>
        ))}
      </div>

      {/* Rainbow Progress Bar */}
      <div className="absolute bottom-30 left-1/2 -translate-x-1/2 w-1/2 h-3 bg-white/40 rounded-full overflow-hidden">
        <motion.div
          key={current}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 6, ease: "linear" }}
          className="h-full bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-500 rounded-full"
        ></motion.div>
      </div>
    </div>
  );
}
