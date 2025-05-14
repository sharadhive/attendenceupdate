const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('Branch', branchSchema, 'branch');  // Use 'branch' collection
