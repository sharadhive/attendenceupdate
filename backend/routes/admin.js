const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middlewares/adminAuth'); // Admin JWT middleware
 const auth = require('../middlewares/auth'); // Employee JWT middleware
// const { authenticateAdmin } = require('../middlewares/auth');

router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Branch name and password are required' });
    }

    // Find the branch by the name
    const branch = await Branch.findOne({ name: name.trim().toLowerCase() });
    if (!branch) return res.status(400).json({ message: 'Branch not found' });

    // Compare the provided password with the stored hashed password
    const isValid = await bcrypt.compare(password, branch.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid password' });

    // Generate a JWT token for the admin
    const token = jwt.sign(
      { _id: branch._id, name: branch.name, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: 'admin', branchName: branch.name });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  router.put('/attendance/:id', adminAuth, async (req, res) => {
//     const { status, remarks } = req.body;
//     try {
//       const attendance = await Attendance.findByIdAndUpdate(
//       req.params.id,
//        { status, remarks },
//        { new: true }
//       );
//      if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
//      res.json(attendance);
//     } catch (err) {
//       res.status(500).json({ message: 'Error updating attendance', error: err.message });
//    }
//   });


router.post('/register-branch', async (req, res) => {
  try {
    const { branchName, password } = req.body;

    // Check if branch name and password are provided
    if (!branchName || !password) {
      return res.status(400).json({ message: 'Branch name and password are required' });
    }

    const name = branchName.trim().toLowerCase();  // Make branch name lowercase and trim spaces

    // Check if the branch already exists
    const exists = await Branch.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Branch already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new branch and save it
    const branch = new Branch({ name, password: hashedPassword });
    await branch.save();

    res.json({ message: 'Branch registered successfully' });
  } catch (err) {
    console.error('Error creating branch:', err);
    res.status(500).json({ message: 'Internal server error', error: err });
  }
});




// In your admin.js route (or whatever your routes file is)
router.post('/create-employee', auth, async (req, res) => {
  const { email, password, branch } = req.body;

  if (!email || !password || !branch) {
    return res.status(400).json({ message: 'Email, password, and branch are required' });
  }

  try {
    // Find the branch by name
    const foundBranch = await Branch.findOne({ name: branch });
    if (!foundBranch) {
      return res.status(400).json({ message: 'Branch not found' });
    }

    // Hash the employee's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the employee
    const employee = new Employee({
      email,
      password: hashedPassword,
      branch: foundBranch._id, // Store the branch ID
    });

    // Save the employee
    await employee.save();

    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});


// Get all Employees by Branch (Admin Only)
router.get('/employees/:branchName', adminAuth, async (req, res) => {
  try {
    const name = req.params.branchName.trim().toLowerCase();
    const branch = await Branch.findOne({ name });
    if (!branch) return res.status(400).json({ message: 'Branch not found' });

    const employees = await Employee.find({ branch: branch._id });
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err.message || err);
    res.status(500).json({ message: 'Internal server error', error: err.message || err });
  }
});


// Get Attendance for One Employee (Admin Only)
router.get('/attendance/:employeeId', adminAuth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.params.employeeId });
    res.json(attendance);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

 router.put('/attendance/:id', async (req, res) => {
   const { status, remarks } = req.body;

   const allowedStatus = ['On-time','Week Off', 'Late', 'Absent', 'Half-day'];
   if (status && !allowedStatus.includes(status)) {
     return res.status(400).json({ error: 'Invalid status value' });
   }

   try {
     const attendance = await Attendance.findById(req.params.id);
     if (!attendance) {
       return res.status(404).json({ message: 'Attendance record not found' });
     }

    // Update only if new values are provided
     if (status) attendance.status = status;
     if (remarks !== undefined) attendance.remarks = remarks;

    await attendance.save();

     res.json({
       message: 'Attendance updated successfully',
       attendance,
     });
   } catch (err) {
     console.error('Error updating attendance:', err);
     res.status(500).json({ message: 'Internal server error' });
   }
 });


module.exports = router;
