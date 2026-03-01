import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = ({ role = 'patient' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActivePath = (path) => location.pathname.startsWith(path);

  // Role-based navigation items
  const navigationItems = {
    patient: [
      { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/dashboard' },
      { name: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/appointments' },
      { name: 'Logout' ,icon: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-6-4l4-4m0 0l-4-4m4 4H3', path:'/logout'}
    ],
    doctor: [
      { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/dashboard' },
      { name: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/schedule' },
      { name: 'Logout' ,icon: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-6-4l4-4m0 0l-4-4m4 4H3', path:'/logout'}
    ],
  };

  const items = navigationItems[role] || navigationItems.patient;

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setMobileOpen(false);
      } else {
        setIsOpen(true);
        setMobileOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);


  return (
    <>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed z-50 p-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
          style={{
            left: mobileOpen ? '16rem' : '1rem',
            top: '1rem',
            transition: 'left 300ms ease-in-out',
          }}
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-blue-900 to-cyan-900 text-white transition-all duration-300 ease-in-out z-40 shadow-2xl ${
          isMobile
            ? mobileOpen
              ? 'w-64 translate-x-0'
              : '-translate-x-full'
            : isOpen
            ? 'w-64'
            : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-blue-700/50">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${(!isOpen && !isMobile) ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <h1 className="text-xl font-bold whitespace-nowrap">MediCare Portal</h1>
              <p className="text-sm text-blue-200 whitespace-nowrap">Hello, {role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={() =>
                `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                  isActivePath(item.path)
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'hover:bg-white/10 hover:text-blue-100'
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {/* Active indicator dot */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-has-[[aria-current=page]]:opacity-100"></span>
              </div>
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                (!isOpen && !isMobile) ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700/50 transition-all duration-300 ${
          (!isOpen && !isMobile) ? 'opacity-0 h-0' : 'opacity-100 h-auto'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold">{role.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;