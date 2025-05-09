// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your_jwt_secret_key'; // In production, use environment variables

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    try {
      // Get user from database to check current role
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Add user info to request object
      req.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { authenticateToken, isAdmin };