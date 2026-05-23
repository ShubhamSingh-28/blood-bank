import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import RegisterReceiver from './components/RegisterReceiver';
import RegisterHospital from './components/RegisterHospital';
import Dashboard from './components/Dashboard';
import PublicInventory from './components/PublicInventory';

function App() {
  return (
    <Router>
      <div className="App font-sans text-gray-900 bg-gray-50 min-h-screen">
        <Routes>
          <Route path="/" element={<PublicInventory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/receiver" element={<RegisterReceiver />} />
          <Route path="/register/hospital" element={<RegisterHospital />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;