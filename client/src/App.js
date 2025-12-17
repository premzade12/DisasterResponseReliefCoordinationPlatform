import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import UserPortal from './components/UserPortal';
import ClientDashboard from './components/ClientDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<UserPortal />} />
          <Route path="/client" element={<ClientDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;