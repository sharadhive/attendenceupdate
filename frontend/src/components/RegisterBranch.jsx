import React, { useState } from 'react';
import axios from 'axios';

function CreateBranch() {
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBranch = async () => {
  if (!branchName || !password) {
    setMessage('Branch name and password are required');
    return;
  }

  setLoading(true);
  try {
    const response = await axios.post(
      'http://localhost:5000/api/admin/register-branch',
      { branchName, password }
    );

    setMessage('Branch registered successfully');
    console.log(response.data); // Log response data for debugging
    setBranchName('');
    setPassword('');
  } catch (error) {
    // Check if error.response?.data is an object and has a message
    const errorMessage = error.response?.data?.message || 'Failed to register branch';
    setMessage(errorMessage);  // Set the message properly
    console.error('Error:', errorMessage);
  }
  setLoading(false);
};


  return (
    <div>
      <h2>Create New Branch</h2>
      <div>
        <label>Branch Name</label>
        <input
          type="text"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleCreateBranch} disabled={loading}>
        {loading ? 'Creating...' : 'Register Branch'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateBranch;
