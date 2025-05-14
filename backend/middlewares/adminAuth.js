const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).send('Access Denied. No token.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).send('Access Denied. Admin only.');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(400).send('Invalid token.');
  }
};
