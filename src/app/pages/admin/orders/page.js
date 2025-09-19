'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Package, Search } from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updateOrderId, setUpdateOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const predefinedReasons = ["Order mistake", "Out of stock", "Customer request", "Other"];

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setShowLoginPopup(true);
          setIsLoading(false);
          return;
        }

        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });

        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok || !sessionData.session?.user || sessionData.session.user.role !== 'admin') {
          setShowLoginPopup(true);
          setIsLoading(false);
          return;
        }

        const ordersResponse = await fetch('/api/orders', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!ordersResponse.ok) {
          throw new Error('Failed to fetch orders');
        }

        const ordersData = await ordersResponse.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error('Error fetching orders:', error.message);
        setShowLoginPopup(true);
        toast.error('Failed to load orders', {
          style: {
            background: '#DBEAFE',
            color: '#1E3A8A',
            border: '2px solid #F97316',
            borderRadius: '20px',
            fontFamily: 'Baloo 2, sans-serif',
            fontWeight: '700',
            padding: '12px 16px',
          },
          iconTheme: { primary: '#F97316', secondary: '#DBEAFE' },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleUpdateStatus = async () => {
    if (newStatus === 'cancelled' && !cancelReason) {
      toast.error('Please select a cancellation reason', {
        style: {
          background: '#DBEAFE',
          color: '#1E3A8A',
          border: '2px solid #EF4444',
          borderRadius: '20px',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '12px 16px',
        },
        iconTheme: { primary: '#EF4444', secondary: '#DBEAFE' },
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderIds: [updateOrderId], status: newStatus, reason: cancelReason }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === updateOrderId ? { ...order, status: newStatus, cancellationReason: cancelReason || order.cancellationReason } : order
        )
      );
      toast.success('Order status updated successfully', {
        style: {
          background: '#DBEAFE',
          color: '#1E3A8A',
          border: '2px solid #F97316',
          borderRadius: '20px',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '12px 16px',
        },
        iconTheme: { primary: '#F97316', secondary: '#DBEAFE' },
      });
    } catch (error) {
      console.error('Error updating order status:', error.message);
      toast.error(error.message || 'Failed to update order status', {
        style: {
          background: '#DBEAFE',
          color: '#1E3A8A',
          border: '2px solid #EF4444',
          borderRadius: '20px',
          fontFamily: 'Baloo 2, sans-serif',
          fontWeight: '700',
          padding: '12px 16px',
        },
        iconTheme: { primary: '#EF4444', secondary: '#DBEAFE' },
      });
    } finally {
      setShowUpdateDialog(false);
      setUpdateOrderId(null);
      setNewStatus('');
      setCancelReason('');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch =
      searchQuery === '' ||
      order.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userDetails?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 font-baloo">Manage Orders</h1>
          <div className="mb-6">
            <div className="flex space-x-4 border-b border-gray-300 dark:border-gray-600">
              {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium font-baloo ${activeTab === tab ? 'border-b-2 border-teal-500 text-teal-500' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by user name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-baloo"
                />
              </div>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 font-baloo">No orders match the selected criteria.</p>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start space-x-4">
                    <Package className="w-8 h-8 text-teal-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-medium text-gray-900 dark:text-white font-baloo">Order #{order._id}</p>
                        <button
                          onClick={() => {
                            setUpdateOrderId(order._id);
                            setNewStatus(order.status);
                            setShowUpdateDialog(true);
                          }}
                          className="text-sm text-teal-500 hover:text-teal-600 font-medium font-baloo"
                        >
                          Update Status
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Status: {order.status}</p>
                      {order.status === 'cancelled' && order.cancellationReason && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-baloo">Cancellation Reason: {order.cancellationReason}</p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">User: {order.userDetails?.name || 'N/A'} ({order.userDetails?.email || 'N/A'})</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Payment: {order.paymentMethod}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">
                        Address: {order.shippingDetails?.address || 'N/A'}, {order.shippingDetails?.town || 'N/A'}, {order.shippingDetails?.city || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Ordered: {new Date(order.createdAt).toLocaleString()}</p>
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white font-baloo">Items</h3>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3 mt-2">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white font-baloo">{item.product.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Quantity: {item.quantity}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Price: ${item.product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={showLoginPopup} onClose={() => setShowLoginPopup(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white font-baloo">Admin Access Required</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600 dark:text-gray-400 font-baloo">
              Please log in as an admin to manage orders.
            </Dialog.Description>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => (window.location.href = '/pages/login')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-baloo"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginPopup(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-baloo"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white font-baloo">Update Order Status</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600 dark:text-gray-400 font-baloo">
              Select a new status for the order.
            </Dialog.Description>
            <div className="mt-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-baloo"
              >
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {newStatus === 'cancelled' && (
              <div className="mt-4">
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-baloo"
                >
                  <option value="">Select Cancellation Reason</option>
                  {predefinedReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === 'cancelled' && !cancelReason}
                className={`px-4 py-2 rounded-lg text-white font-baloo ${newStatus === 'cancelled' && !cancelReason ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} transition`}
              >
                Update
              </button>
              <button
                onClick={() => setShowUpdateDialog(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-baloo"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}