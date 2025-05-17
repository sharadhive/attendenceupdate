import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import EmployeePanel from './components/EmployeePanel';

import Home from './components/Home'; // ✅ Import Home component

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> 
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/employee" element={<EmployeePanel />} />
     
    </Routes>
  );
}

export default App;
