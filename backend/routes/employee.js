const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');

// Helper to get IST time
const getISTTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

// Employee Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const employee = await Employee.findOne({ email });
  if (!employee) return res.status(400).send('Employee not found');

  const isValid = await bcrypt.compare(password, employee.password);
  if (!isValid) return res.status(400).send('Invalid password');

  const token = jwt.sign({ _id: employee._id, role: 'employee' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Employee Check-In
router.post('/checkin', auth, async (req, res) => {
  const { photoUrl } = req.body;
  if (!photoUrl) return res.status(400).send('Photo URL is required');

  const now = getISTTime();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existing) return res.status(400).send('Already checked in today');

  const attendance = new Attendance({
    employee: req.user._id,
    date: now,
    checkIn: now,
    checkInPhoto: photoUrl,
  });

  await attendance.save();
  res.send('Checked in successfully');
});

// Employee Check-Out
router.post('/checkout', auth, async (req, res) => {
  const { photoUrl } = req.body;
  if (!photoUrl) return res.status(400).send('Photo URL is required');

  const now = getISTTime();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!attendance) return res.status(400).send('No check-in record found for today');

  if (attendance.checkOut) return res.status(400).send('Already checked out today');

  attendance.checkOut = now;
  attendance.checkOutPhoto = photoUrl;
  attendance.totalHours = (attendance.checkOut - attendance.checkIn) / 3600000;
  await attendance.save();

  res.send('Checked out successfully');
});

// View Employee's Attendance History
router.get('/attendance', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ employee: req.user._id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
     console.error('Error fetching attendance:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
