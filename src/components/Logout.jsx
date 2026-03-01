import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Logout = () => {
  const navigate=useNavigate();

  const handleConfirmLogout = async() => {
    try {
      await signOut(auth);
      alert("User logged out");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCancel = () => {
    navigate("/")
  };

  return (
    <div className="relative">
      {/* Logout Trigger Button */}

        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCancel}
        />

      {/* Confirmation Modal */}
      
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-7 h-7 text-red-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-600 text-center">
                Are you sure you want to logout?
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <svg 
                    className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm text-blue-700">
                    You'll need to sign in again to access your account
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 hover:from-gray-200 hover:to-gray-100 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 active:scale-95 shadow-sm"
                >
                  <span className="flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back
                  </span>
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 active:scale-95 shadow-lg hover:shadow-red-200"
                >
                  <span className="flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </span>
                </button>
              </div>
              
              {/* Additional Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Session will be terminated immediately
              </p>
            </div>
          </div>
        </div>
      
    </div>
  );
};

export default Logout;