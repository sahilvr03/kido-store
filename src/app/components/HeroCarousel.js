"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HeroCarousel({ promotions, current, setCurrent }) {
  const intervalRef = useRef(null);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % promotions.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

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
      className="relative w-full h-[24rem] sm:h-[28rem] md:h-[32rem] lg:h-[36rem] xl:h-[40rem] overflow-hidden group"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-200 via-blue-100 to-blue-50 animate-gradient" />

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-6 left-4 text-2xl sm:text-3xl md:text-4xl hidden sm:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        🎈
      </motion.div>
        {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-6 left-4 text-2xl sm:text-3xl md:text-4xl hidden sm:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        🎈
      </motion.div>
      
      <motion.div
        className="absolute top-8 right-4 text-xl sm:text-2xl md:text-3xl hidden sm:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        ⭐
      </motion.div>
      <motion.div
        className="absolute bottom-16 left-6 text-xl sm:text-2xl md:text-3xl hidden sm:block"
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
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6"
        >
          <div className="relative w-full max-w-8xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border-2 border-yellow-300 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
            {/* Left Side Image */}
            <div className="flex-1 flex justify-center items-center w-full">
              <Image
                src={promotions[current].image}
                alt={promotions[current].title}
                width={400}
                height={400}
                className="rounded-2xl shadow-lg object-contain w-full max-h-[200px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[400px]"
                priority
              />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-5">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-pink-600 drop-shadow-lg font-comic leading-snug"
              >
                {promotions[current].title} 🎉
              </motion.h1>

              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-prose"
              >
                {promotions[current].description}
              </motion.p>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/pages/ForYouPage">
                  <button className="relative bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-400 hover:from-pink-500 hover:via-yellow-500 hover:to-purple-500 text-white font-bold px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center group mx-auto md:mx-0">
                    <span className="relative z-10 text-sm sm:text-base md:text-lg">Shop Now</span>
                    <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full"></span>
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Thumbnail Navigation */}
      {/* <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 md:gap-4 z-20 flex-wrap justify-center">
        {promotions.map((promo, idx) => (
          <motion.div
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`cursor-pointer border-2 sm:border-3 rounded-full overflow-hidden shadow-md transition-all duration-300 ${
              current === idx
                ? "border-pink-400 scale-110 shadow-pink-200"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            whileHover={{ scale: 1.1, y: -2 }}
          >
            <Image
              width={40}
              height={40}
              src={promo.image}
              alt={promo.title}
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-cover rounded-full"
            />
          </motion.div>
        ))}
      </div> */}

      {/* Rainbow Progress Bar */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-[80%] sm:w-[70%] md:w-[50%] h-1.5 sm:h-2 md:h-3 bg-white/40 rounded-full overflow-hidden z-20">
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