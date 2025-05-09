// app.js - Main Express server file
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Make sure root route serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Explicitly define routes for HTML pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Recipe Manager Routes
app.get('/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recipes.html'));
});

app.get('/recipes/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'add-recipe.html'));
});

app.get('/recipes/edit/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-recipe.html'));
});

app.get('/recipes/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-recipe.html'));
});

app.get('/admin/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-recipes.html'));
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/authSystem', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create User model
const User = mongoose.model('User', UserSchema);

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key'; // In production, use environment variables

// Routes
// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with default user role
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role: 'user' // Default role
    });
    
    await newUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token with role
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Import route modules
const recipeRoutes = require('./routes/recipeRoutes');

// Use API routes
app.use('/api/recipes', recipeRoutes);

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});