// categories/[id]/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Grid } from 'lucide-react';
import ProductCard from '../../../components/ProductCard';
import Link from 'next/link';
import {
  Home,
  Grid as GridIcon,
  ShoppingCart,
  Package,
  Tag,
  Sparkles,
  Star,
  Heart,
  Zap,
} from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch category and products
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch category details
        const categoryResponse = await fetch(`/api/categories/${params.id}`);
        if (!categoryResponse.ok) {
          throw new Error('Failed to fetch category');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Fetch products for the category
        const productsResponse = await fetch(`/api/products?category=${encodeURIComponent(categoryData.name)}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching category or products:', error);
        setError(error.message || 'Failed to load category or products');
        toast.error(error.message || 'Failed to load category or products', {
          style: {
            background: '#fff',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCategoryAndProducts();
    }
  }, [params.id]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-yellow-50">
        <motion.p
          className="text-lg text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error || 'Category not found'}
        </motion.p>
      </div>
    );
  }

  // Map icon names to Lucide icons
  const iconMap = {
    Home,
    Grid: GridIcon,
    ShoppingCart,
    Package,
    Tag,
    Sparkles,
    Star,
    Heart,
    Zap,
  };

  const IconComponent = category.icon && iconMap[category.icon] ? iconMap[category.icon] : GridIcon;

  return (
    <div className="min-h-screen font-poppins bg-gradient-to-br from-pink-50 to-yellow-50 text-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-8xl">
        
        {/* Breadcrumb */}
        <motion.nav
          className="flex mb-6 text-sm text-gray-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-orange-600 transition-colors duration-200">
                Home
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            
            <li>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900 font-semibold">{category.name}</li>
          </ol>
        </motion.nav>

     

        {/* Products Section */}
        <section className="mb-12 bg-gradient-to-r from-orange-50 via-yellow-50 to-pink-50 p-6 rounded-xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-orange-100 p-2 rounded-lg mr-4">
              <Grid className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Products in {category.name}
            </h2>
          </div>

          {products.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
            >
              <svg
                className="w-16 h-16 mx-auto text-orange-500 mb-4"
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
              <p className="text-lg text-gray-600 mb-4">
                No products available in this category.
              </p>
              <Link href="/pages/ForYouPage">
                <motion.button
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore All Products
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
