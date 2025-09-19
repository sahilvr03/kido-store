// pages/UserDashboardPage.jsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit, Trash2, X, Loader2, Search, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import OneSignal from 'react-onesignal';
import { Dialog } from '@headlessui/react';

export default function UserDashboardPage() {
  const [product, setProduct] = useState({
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    rating: '',
    reviews: '',
    description: '',
    images: [],
    category: '',
    type: 'forYou',
    endDate: '',
    colors: [],
    brand: '',
    weight: '',
    details: '',
    inStock: true,
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productSortConfig, setProductSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderActiveTab, setOrderActiveTab] = useState('all');
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const itemsPerPage = 10;
  const predefinedReasons = ["Changed mind", "Wrong item", "Found better price", "Other"];
  const router = useRouter();

  // Initialize OneSignal and check session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.session || !data.session.user || data.session.user.role !== 'user') {
          toast.error('Please log in as a user.', {
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
            },
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
          });
          router.push('/login?redirect=/user-dashboard');
          return;
        }
        setUserEmail(data.session.user.email);
        setSessionChecked(true);
      } catch (error) {
        console.error('Session check error:', error.message);
        toast.error('Failed to verify session', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
        });
        router.push('/login?redirect=/user-dashboard');
      }
    };

    const initializeOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '2a61ca63-57b7-480b-a6e9-1b11c6ac7375',
          allowLocalhostAsSecureOrigin: true,
        });
        await OneSignal.showSlidedownPrompt();
        const token = localStorage.getItem('authToken');
        if (token) {
          const sessionResponse = await fetch('/api/auth/session', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          });
          const sessionData = await sessionResponse.json();
          if (sessionData.session?.user?.email) {
            await OneSignal.setExternalUserId(sessionData.session.user.email);
          }
        }
      } catch (error) {
        console.error('Error initializing OneSignal:', error.message);
      }
    };

    checkSession();
    initializeOneSignal();
  }, [router]);

  // Fetch products, categories, and orders
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/products?user=true', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const productsArray = Array.isArray(data) ? data : data.products || [];
        setProducts(productsArray);
        setFilteredProducts(productsArray);
      } catch (error) {
        console.error('Error fetching products:', error.message);
        toast.error('Failed to load products.', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
        });
        setProducts([]);
        setFilteredProducts([]);
      }
    };

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/categories', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error.message);
        toast.error('Failed to load categories', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
        });
        setCategories([]);
      }
    };

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/orders', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const ordersData = await response.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setFilteredOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error('Error fetching orders:', error.message);
        toast.error('Failed to load orders', {
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          },
          iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
        });
        setOrders([]);
        setFilteredOrders([]);
      }
    };

    if (sessionChecked) {
      fetchProducts();
      fetchCategories();
      fetchOrders();
    }
  }, [sessionChecked]);

  // Debounced search for products
  const debouncedProductSearch = useCallback(
    debounce((query) => {
      const filtered = products.filter((prod) =>
        (prod.title?.toLowerCase().includes(query.toLowerCase()) ||
         prod.category?.toLowerCase().includes(query.toLowerCase()) ||
         prod.brand?.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setProductCurrentPage(1);
    }, 300),
    [products]
  );

  // Debounced search for orders
  const debouncedOrderSearch = useCallback(
    debounce((query) => {
      const filtered = orders.filter((order) =>
        order._id.toLowerCase().includes(query.toLowerCase()) ||
        order.items.some((item) => item.product.title.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredOrders(filtered.filter((order) => orderActiveTab === 'all' || order.status === orderActiveTab));
      setOrderCurrentPage(1);
    }, 300),
    [orders, orderActiveTab]
  );

  useEffect(() => {
    debouncedProductSearch(productSearchQuery);
  }, [productSearchQuery, debouncedProductSearch]);

  useEffect(() => {
    debouncedOrderSearch(orderSearchQuery);
  }, [orderSearchQuery, debouncedOrderSearch]);

  // Filter orders by active tab
  useEffect(() => {
    const filtered = orders.filter((order) => orderActiveTab === 'all' || order.status === orderActiveTab);
    setFilteredOrders(filtered.filter((order) =>
      order._id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.items.some((item) => item.product.title.toLowerCase().includes(orderSearchQuery.toLowerCase()))
    ));
    setOrderCurrentPage(1);
  }, [orderActiveTab, orders, orderSearchQuery]);

  // Handle product form changes
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    if (name === 'colors') {
      setProduct({ ...product, colors: value.split(',').map(item => item.trim()).filter(item => item) });
    } else if (name === 'inStock') {
      setProduct({ ...product, inStock: e.target.checked });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      toast.error('Maximum 5 images allowed.', {
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
    setFiles(selectedFiles);
  };

  // Submit product form
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!product.title || !product.price || !product.category) {
      toast.error('Please fill all required fields.', {
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
    setUploading(true);
    try {
      let images = editingProductId ? [...product.images] : [];
      if (files.length > 0) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) throw new Error('Cloudinary cloud name not configured');
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'ecommerce');
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || `Failed to upload ${file.name}`);
          return data.secure_url;
        });
        const newImages = await Promise.all(uploadPromises);
        images = [...images, ...newImages];
      }

      const productData = {
        ...product,
        images,
        price: parseFloat(product.price) || 0,
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
        discount: product.discount ? parseInt(product.discount) : null,
        rating: product.rating ? parseFloat(product.rating) : null,
        reviews: product.reviews ? parseInt(product.reviews) : null,
        endDate: product.type === 'flashSale' && product.endDate ? product.endDate : null,
        brand: product.brand || null,
        weight: product.weight || null,
        details: product.details || null,
        inStock: product.inStock,
      };

      const token = localStorage.getItem('authToken');
      const url = editingProductId ? `/api/product/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (editingProductId ? 'Failed to update product' : 'Failed to add product'));
      }

      toast.success(editingProductId ? 'Product updated successfully!' : 'Product added successfully!', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #16A34A',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
        },
        iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
      });

      const updatedProductsResponse = await fetch('/api/products?user=true', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedProducts = await updatedProductsResponse.json();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : updatedProducts.products || []);
      setFilteredProducts(Array.isArray(updatedProducts) ? updatedProducts : updatedProducts.products || []);
      setProduct({
        title: '',
        price: '',
        originalPrice: '',
        discount: '',
        rating: '',
        reviews: '',
        description: '',
        images: [],
        category: '',
        type: 'forYou',
        endDate: '',
        colors: [],
        brand: '',
        weight: '',
        details: '',
        inStock: true,
      });
      setFiles([]);
      setIsModalOpen(false);
      setEditingProductId(null);
    } catch (error) {
      console.error('Error processing product:', error.message);
      toast.error(error.message || 'Failed to process product', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        },
        iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
      });
    } finally {
      setUploading(false);
    }
  };

  // Edit product
  const handleEditProduct = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/product/${id}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch product');
      }
      const productData = await response.json();
      setProduct({
        ...productData,
        price: productData.price.toString(),
        originalPrice: productData.originalPrice?.toString() || '',
        discount: productData.discount?.toString() || '',
        rating: productData.rating?.toString() || '',
        reviews: productData.reviews?.toString() || '',
        colors: productData.colors || [],
        brand: productData.brand || '',
        weight: productData.weight || '',
        details: productData.details || '',
        images: productData.images || [],
        inStock: productData.inStock !== undefined ? productData.inStock : true,
      });
      setEditingProductId(id);
      setFiles([]);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching product for edit:', error.message);
      toast.error(error.message || 'Failed to load product for editing', {
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

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/product/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      toast.success('Product deleted successfully!', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #16A34A',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
        },
        iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
      });
      setProducts(products.filter((p) => p._id !== id));
      setFilteredProducts(filteredProducts.filter((p) => p._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error.message);
      toast.error(error.message || 'Failed to delete product', {
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

  // Toggle order selection for cancellation
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Cancel selected orders
  const handleCancelOrders = async () => {
    if (!cancelReason) {
      toast.error('Please select a reason for cancellation', {
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

    setIsCancelling(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderIds: selectedOrders, status: 'cancelled', reason: cancelReason }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel orders');
      }

      setOrders((prev) =>
        prev.map((order) =>
          selectedOrders.includes(order._id) ? { ...order, status: 'cancelled', cancellationReason: cancelReason } : order
        )
      );
      setFilteredOrders((prev) =>
        prev.map((order) =>
          selectedOrders.includes(order._id) ? { ...order, status: 'cancelled', cancellationReason: cancelReason } : order
        )
      );
      setSelectedOrders([]);
      toast.success('Selected orders cancelled successfully', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #16A34A',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
        },
        iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
      });
    } catch (error) {
      console.error('Error cancelling orders:', error.message);
      toast.error(error.message || 'Failed to cancel orders', {
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        },
        iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setCancelReason('');
    }
  };

  // Open add product modal
  const openAddProductModal = () => {
    setProduct({
      title: '',
      price: '',
      originalPrice: '',
      discount: '',
      rating: '',
      reviews: '',
      description: '',
      images: [],
      category: '',
      type: 'forYou',
      endDate: '',
      colors: [],
      brand: '',
      weight: '',
      details: '',
      inStock: true,
    });
    setEditingProductId(null);
    setFiles([]);
    setIsModalOpen(true);
  };

  // Sort products
  const handleProductSort = (key) => {
    let direction = 'asc';
    if (productSortConfig.key === key && productSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setProductSortConfig({ key, direction });
    const sorted = [...filteredProducts].sort((a, b) => {
      if (key === 'price') {
        return direction === 'asc' ? (a.price || 0) - (b.price || 0) : (b.price || 0) - (a.price || 0);
      }
      const aValue = a[key]?.toString().toLowerCase() || '';
      const bValue = b[key]?.toString().toLowerCase() || '';
      return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    setFilteredProducts(sorted);
  };

  // Pagination
  const paginatedProducts = filteredProducts.slice(
    (productCurrentPage - 1) * itemsPerPage,
    productCurrentPage * itemsPerPage
  );
  const paginatedOrders = filteredOrders.slice(
    (orderCurrentPage - 1) * itemsPerPage,
    orderCurrentPage * itemsPerPage
  );
  const productTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const orderTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  if (!sessionChecked) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 font-poppins">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Loader2 className="w-12 h-12 text-orange-600 dark:text-orange-400 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-poppins">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400"
                  onClick={() => setSidebarOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.button>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center">
                  <Package className="w-8 h-8 mr-3 text-orange-600 dark:text-orange-400" />
                  User Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <motion.button
                  onClick={openAddProductModal}
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </motion.button>
              </div>
            </div>

            {/* Products Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">My Products</h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No products found. Try adding some!</p>
                  <motion.button
                    onClick={openAddProductModal}
                    className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white px-5 py-2.5 rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Add Your First Product
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                          {['Image', 'Title', 'Price', 'Category', 'Brand', 'Stock'].map((header) => (
                            <th
                              key={header}
                              className="px-6 py-4 font-semibold cursor-pointer"
                              onClick={() => handleProductSort(header.toLowerCase())}
                            >
                              <span className="flex items-center gap-2">
                                {header}
                                {productSortConfig.key === header.toLowerCase() && (
                                  <span>{productSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </span>
                            </th>
                          ))}
                          <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((prod) => (
                          <motion.tr
                            key={prod._id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td className="px-6 py-4">
                              {prod.images?.[0] ? (
                                <Image src={prod.images[0]} alt={prod.title} width={48} height={48} className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                  <span className="text-xs">No Image</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 truncate max-w-xs">{prod.title || 'N/A'}</td>
                            <td className="px-6 py-4">Rs: {parseFloat(prod.price || 0).toFixed(2)}</td>
                            <td className="px-6 py-4">{prod.category || 'N/A'}</td>
                            <td className="px-6 py-4">{prod.brand || 'N/A'}</td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-medium ${prod.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {prod.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex space-x-3">
                              <motion.button
                                onClick={() => handleEditProduct(prod._id)}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-500"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit product"
                              >
                                <Edit className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteProduct(prod._id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete product"
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden space-y-4">
                    {paginatedProducts.map((prod) => (
                      <motion.div
                        key={prod._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-4">
                          {prod.images?.[0] ? (
                            <Image src={prod.images[0]} alt={prod.title} width={64} height={64} className="w-16 h-16 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-xs">No Image</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{prod.title || 'N/A'}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Rs: {parseFloat(prod.price || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{prod.category || 'N/A'}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{prod.brand || 'N/A'}</p>
                            <p className={`text-xs font-medium ${prod.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {prod.inStock ? 'In Stock' : 'Out of Stock'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <motion.button
                              onClick={() => handleEditProduct(prod._id)}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-500"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteProduct(prod._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(productCurrentPage - 1) * itemsPerPage + 1} to {Math.min(productCurrentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setProductCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={productCurrentPage === 1}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => setProductCurrentPage((prev) => Math.min(prev + 1, productTotalPages))}
                        disabled={productCurrentPage === productTotalPages}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.section>

            {/* Orders Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">My Orders</h2>
              <div className="mb-6">
                <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-600">
                  {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setOrderActiveTab(tab)}
                      className={`px-4 py-2 font-medium ${orderActiveTab === tab ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'}`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search orders by ID or product..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                {selectedOrders.length > 0 && (
                  <motion.button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isCancelling}
                    className={`px-6 py-2.5 rounded-lg font-medium text-white ${isCancelling ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'} transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCancelling ? (
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    ) : (
                      `Cancel Selected (${selectedOrders.length})`
                    )}
                  </motion.button>
                )}
              </div>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found.</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            <input
                              type="checkbox"
                              checked={selectedOrders.length === paginatedOrders.filter(o => o.status === 'pending').length && paginatedOrders.some(o => o.status === 'pending')}
                              onChange={() => {
                                if (selectedOrders.length === paginatedOrders.filter(o => o.status === 'pending').length) {
                                  setSelectedOrders([]);
                                } else {
                                  setSelectedOrders(paginatedOrders.filter(o => o.status === 'pending').map(o => o._id));
                                }
                              }}
                              className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded"
                            />
                          </th>
                          <th className="px-6 py-4 font-semibold">Order ID</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Items</th>
                          <th className="px-6 py-4 font-semibold">Payment</th>
                          <th className="px-6 py-4 font-semibold">Address</th>
                          <th className="px-6 py-4 font-semibold">Ordered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.map((order) => (
                          <motion.tr
                            key={order._id}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order._id)}
                                onChange={() => toggleSelectOrder(order._id)}
                                disabled={order.status !== 'pending'}
                                className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 truncate max-w-xs">{order._id}</td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-medium ${order.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : order.status === 'shipped' ? 'text-blue-600 dark:text-blue-400' : order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                {order.status === 'cancelled' && order.cancellationReason && (
                                  <span className="block text-xs">({order.cancellationReason})</span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-2">
                                  <Image src={item.product.imageUrl || '/placeholder.png'} alt={item.product.title} width={32} height={32} className="w-8 h-8 object-cover rounded" />
                                  <div>
                                    <p className="text-xs">{item.product.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </td>
                            <td className="px-6 py-4">{order.paymentMethod || 'N/A'}</td>
                            <td className="px-6 py-4 truncate max-w-xs">{order.shippingDetails?.address || 'N/A'}</td>
                            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden space-y-4">
                    {paginatedOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleSelectOrder(order._id)}
                            disabled={order.status !== 'pending'}
                            className="mt-1 h-5 w-5 text-orange-500 focus:ring-orange-500 rounded"
                          />
                          <Package className="w-8 h-8 text-orange-600 dark:text-orange-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Order #{order._id}</p>
                            <p className={`text-sm font-medium ${order.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : order.status === 'shipped' ? 'text-blue-600 dark:text-blue-400' : order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </p>
                            {order.status === 'cancelled' && order.cancellationReason && (
                              <p className="text-sm text-red-600 dark:text-red-400">Reason: {order.cancellationReason}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">Payment: {order.paymentMethod || 'N/A'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Address: {order.shippingDetails?.address || 'N/A'}, {order.shippingDetails?.town || 'N/A'}, {order.shippingDetails?.city || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                            <div className="mt-4">
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Items</h3>
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 mt-2">
                                  <Image
                                    src={item.product.imageUrl || '/placeholder.png'}
                                    alt={item.product.title}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.product.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Price: Rs: {item.product.price?.toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(orderCurrentPage - 1) * itemsPerPage + 1} to {Math.min(orderCurrentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setOrderCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={orderCurrentPage === 1}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => setOrderCurrentPage((prev) => Math.min(prev + 1, orderTotalPages))}
                        disabled={orderCurrentPage === orderTotalPages}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.section>

            {/* Product Modal */}
            <AnimatePresence>
              {isModalOpen && (
                <motion.div
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                        {editingProductId ? 'Edit Product' : 'Add New Product'}
                      </h2>
                      <motion.button
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    </div>
                    <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={product.title}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          required
                          placeholder="e.g., Wireless Mouse"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Price *</label>
                        <input
                          type="number"
                          name="price"
                          value={product.price}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          required
                          min="0"
                          step="0.01"
                          placeholder="e.g., 29.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Original Price</label>
                        <input
                          type="number"
                          name="originalPrice"
                          value={product.originalPrice}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 39.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Discount (%)</label>
                        <input
                          type="number"
                          name="discount"
                          value={product.discount}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          min="0"
                          max="100"
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Rating</label>
                        <input
                          type="number"
                          name="rating"
                          value={product.rating}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          min="0"
                          max="5"
                          step="0.1"
                          placeholder="e.g., 4.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Reviews</label>
                        <input
                          type="number"
                          name="reviews"
                          value={product.reviews}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          min="0"
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Product Type *</label>
                        <select
                          name="type"
                          value={product.type}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          required
                        >
                          <option value="forYou">For You</option>
                          <option value="recommended">Recommended</option>
                          <option value="flashSale">Flash Sale</option>
                        </select>
                      </div>
                      {product.type === 'flashSale' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Flash Sale End Date *</label>
                          <input
                            type="datetime-local"
                            name="endDate"
                            value={product.endDate}
                            onChange={handleProductChange}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                            required
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Category *</label>
                        <select
                          name="category"
                          value={product.category}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Colors (comma-separated)</label>
                        <input
                          type="text"
                          name="colors"
                          value={product.colors.join(', ')}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          placeholder="e.g., Red, Blue, Black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Brand</label>
                        <input
                          type="text"
                          name="brand"
                          value={product.brand}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          placeholder="e.g., Apple"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Weight</label>
                        <input
                          type="text"
                          name="weight"
                          value={product.weight}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          placeholder="e.g., 1.5 kg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Stock Status</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="inStock"
                            checked={product.inStock}
                            onChange={handleProductChange}
                            className="h-4 w-4 text-orange-600 dark:text-orange-400 focus:ring-orange-500 dark:focus:ring-orange-400 border-gray-200 dark:border-gray-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
                        <textarea
                          name="description"
                          value={product.description}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          rows="4"
                          placeholder="Enter product description"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Details</label>
                        <textarea
                          name="details"
                          value={product.details}
                          onChange={handleProductChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                          rows="4"
                          placeholder="e.g., Material: Aluminum, Warranty: 1 year"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Product Images (up to 5)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100"
                          disabled={uploading}
                        />
                        {files.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Selected Images:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {files.map((file, index) => (
                                <div key={index} className="relative">
                                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-24 h-24 object-cover rounded-lg" />
                                  <motion.button
                                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {editingProductId && product.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Existing Images:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {product.images.map((img, index) => (
                                <div key={index} className="relative">
                                  <Image src={img} alt={`Image ${index + 1}`} width={96} height={96} className="w-24 h-24 object-cover rounded-lg" />
                                  <motion.button
                                    onClick={() => setProduct({ ...product, images: product.images.filter((_, i) => i !== index) })}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2 flex justify-end space-x-4">
                        <motion.button
                          type="submit"
                          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              {editingProductId ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            editingProductId ? 'Update Product' : 'Add Product'
                          )}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={uploading}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cancel Order Dialog */}
            <AnimatePresence>
              {showCancelDialog && (
                <Dialog
                  open={showCancelDialog}
                  onClose={() => setShowCancelDialog(false)}
                  className="fixed inset-0 z-50 flex items-center justify-center"
                >
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                  <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Cancel Selected Orders
                    </Dialog.Title>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Reason for Cancellation
                      </label>
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-800 dark:text-gray-100"
                      >
                        <option value="">Select a reason</option>
                        {predefinedReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <motion.button
                        onClick={handleCancelOrders}
                        disabled={isCancelling || !cancelReason}
                        className={`px-4 py-2 rounded-lg font-medium text-white ${isCancelling || !cancelReason ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCancelling ? (
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        ) : (
                          'Confirm Cancellation'
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => setShowCancelDialog(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Close
                      </motion.button>
                    </div>
                  </motion.div>
                </Dialog>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}