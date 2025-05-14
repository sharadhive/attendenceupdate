import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import EmployeePanel from './components/EmployeePanel';
import RegisterBranch from './components/RegisterBranch';


function App() {
  return (
    <Routes>
      <Route path="/registerBranch" element={<RegisterBranch />} />
       <Route path="/admin" element={<AdminPanel />} />
      <Route path="/employee" element={<EmployeePanel />} />
    </Routes>
  );
}

export default App;
