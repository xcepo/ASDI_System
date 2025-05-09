// models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  ingredients: [{
    type: String,
    required: true,
    trim: true
  }],
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  prepTime: {
    type: Number,
    required: true
  },
  cookTime: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 'Beverage'],
    required: true
  },
  imageUrl: {
    type: String,
    default: '/images/default-recipe.jpg'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search functionality
RecipeSchema.index({ 
  title: 'text', 
  description: 'text', 
  ingredients: 'text', 
  tags: 'text' 
});

// Update the updatedAt timestamp before saving
RecipeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

module.exports = Recipe;