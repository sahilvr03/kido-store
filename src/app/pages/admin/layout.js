'use client';
import React, { useState } from 'react';
import AdminSidebar from './Sidebar/page';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex relative">
      {/* Sidebar */}

      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Mobile Toggle Button */}
        <button
          className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md text-gray-800 hover:text-teal-600 transition"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 px-4 sm:px-6 lg:px-8 lg:ml-64 mt-14 lg:mt-0"
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
