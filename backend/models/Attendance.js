const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  totalHours: { type: Number },
  checkInPhoto: { type: String },
  checkOutPhoto: { type: String },



  breakIn: { type: Date },
  breakOut: { type: Date },
  breakInPhoto: { type: String },
  breakOutPhoto: { type: String },

status: {
    type: String,
    enum: ['On-time','Week Off', 'Late', 'Absent', 'Half-day'],
    default: 'On-time',
  },
  remarks: {
    type: String,
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
