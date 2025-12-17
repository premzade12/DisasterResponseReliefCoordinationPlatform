import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-red-700 to-red-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand Name */}
        <Link className="text-white text-xl md:text-2xl font-extrabold tracking-wider uppercase flex items-center gap-2" to="/">
          🚨 Disaster Response
        </Link>
        
        {/* Navigation Links */}
        <div className="space-x-4">
          <Link className="text-red-100 hover:text-white font-semibold transition duration-300" to="/">
            User Portal
          </Link>
          <Link className="bg-white text-red-700 px-4 py-2 rounded-full font-bold hover:bg-red-100 transition shadow-md text-sm md:text-base" to="/client">
            NGO/Admin Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;