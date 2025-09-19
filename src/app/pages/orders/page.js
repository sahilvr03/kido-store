'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Package, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import OneSignal from 'react-onesignal';

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [leopardOrders, setLeopardOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const predefinedReasons = ["Changed mind", "Wrong item", "Found better price", "Other"];

  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "2a61ca63-57b7-480b-a6e9-1b11c6ac7375",
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

    initializeOneSignal();

    const checkAuthAndFetchOrders = async () => {
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

        if (!sessionResponse.ok || !(await sessionResponse.json()).session?.user) {
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

        const leopardResponse = await fetch('/api/leopard/orders');
        const leopardData = await leopardResponse.json();
        setLeopardOrders(Array.isArray(leopardData) ? leopardData : leopardData.trackBookedPacketResult || []);
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

    checkAuthAndFetchOrders();
  }, []);

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleCancelOrders = async () => {
    if (!cancelReason) {
      toast.error('Please select a reason for cancellation', {
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
      setSelectedOrders([]);
      toast.success('Selected orders cancelled successfully', {
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
      console.error('Error cancelling orders:', error.message);
      toast.error(error.message || 'Failed to cancel orders', {
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
      setIsCancelling(false);
      setShowCancelDialog(false);
      setCancelReason('');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 font-baloo">My Orders</h1>
          {selectedOrders.length > 0 && (
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={isCancelling}
              className={`mb-4 px-6 py-3 rounded-lg font-baloo font-medium text-white ${
                isCancelling ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              } transition`}
            >
              {isCancelling ? (
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              ) : (
                `Cancel Selected (${selectedOrders.length})`
              )}
            </button>
          )}
          {orders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 font-baloo">You have no orders yet.</p>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <motion.div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
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
                      className="mt-1 h-5 w-5 text-teal-500 focus:ring-teal-500 rounded"
                    />
                    <Package className="w-8 h-8 text-teal-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-medium text-gray-900 dark:text-white font-baloo">Order #{order._id}</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Status: {order.status}</p>
                      {order.status === 'cancelled' && order.cancellationReason && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-baloo">Cancellation Reason: {order.cancellationReason}</p>
                      )}
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
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-baloo">Price: Rs:{item.product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {leopardOrders.length > 0 && (
                    <>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-2 font-baloo">Leopard Parcels</h2>
                      <div className="grid gap-4">
                        {leopardOrders.map((parcel, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-baloo">CN: {parcel.consignmentNo}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-baloo">Status: {parcel.status}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-baloo">Destination: {parcel.destinationCity}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-baloo">Booked On: {parcel.bookingDate}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={showLoginPopup} onClose={() => setShowLoginPopup(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white font-baloo">Sign In Required</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600 dark:text-gray-400 font-baloo">
              Please log in to view your orders.
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

      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white font-baloo">Confirm Order Cancellation</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600 dark:text-gray-400 font-baloo">
              Select a reason to cancel the selected orders:
            </Dialog.Description>
            <div className="mt-4">
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-baloo"
              >
                <option value="">Select Reason</option>
                {predefinedReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleCancelOrders}
                disabled={isCancelling || !cancelReason}
                className={`px-4 py-2 rounded-lg font-baloo text-white ${
                  isCancelling || !cancelReason ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                } transition`}
              >
                {isCancelling ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
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