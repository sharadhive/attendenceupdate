const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const path = require('path');

const auth = require('./middlewares/auth'); // Correct path to auth middleware
const employeeRoutes = require('./routes/employee');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Session Setup
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is missing in .env");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connectMongo.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// ✅ ADDITION: Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Serve frontend if in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, 'frontend/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
//   });
// }

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
