// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all public recipes (public endpoint - no auth needed)
router.get('/public', async (req, res) => {
  try {
    const recipes = await Recipe.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search recipes (public endpoint)
router.get('/search', async (req, res) => {
  try {
    const { query, category } = req.query;
    
    const searchQuery = {};
    
    // Add text search if provided
    if (query && query.trim() !== '') {
      searchQuery.$text = { $search: query };
    }
    
    // Add category filter if provided
    if (category && category !== 'All') {
      searchQuery.category = category;
    }
    
    // Always only return public recipes
    searchQuery.isPublic = true;
    
    const recipes = await Recipe.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
    
    res.json(recipes);
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single recipe by ID (public endpoint)
router.get('/public/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ 
      _id: req.params.id,
      isPublic: true 
    }).populate('createdBy', 'username');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PROTECTED ROUTES (require authentication)

// Get all recipes (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching all recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's recipes (my recipes)
router.get('/my-recipes', authenticateToken, async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new recipe
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      title, description, ingredients, instructions, 
      prepTime, cookTime, servings, difficulty, 
      category, imageUrl, isPublic, tags 
    } = req.body;
    
    // Create new recipe
    const newRecipe = new Recipe({
      title,
      description,
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim()),
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      category,
      imageUrl: imageUrl || '/images/default-recipe.jpg',
      createdBy: req.user.id,
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())
    });
    
    const recipe = await newRecipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recipe
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Check ownership or admin status
    if (recipe.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this recipe' });
    }
    
    const { 
      title, description, ingredients, instructions, 
      prepTime, cookTime, servings, difficulty, 
      category, imageUrl, isPublic, tags 
    } = req.body;
    
    // Update recipe fields
    recipe.title = title || recipe.title;
    recipe.description = description || recipe.description;
    recipe.ingredients = Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim());
    recipe.instructions = instructions || recipe.instructions;
    recipe.prepTime = prepTime || recipe.prepTime;
    recipe.cookTime = cookTime || recipe.cookTime;
    recipe.servings = servings || recipe.servings;
    recipe.difficulty = difficulty || recipe.difficulty;
    recipe.category = category || recipe.category;
    recipe.imageUrl = imageUrl || recipe.imageUrl;
    recipe.isPublic = isPublic !== undefined ? isPublic : recipe.isPublic;
    recipe.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    recipe.updatedAt = Date.now();
    
    const updatedRecipe = await recipe.save();
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete recipe
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Check ownership or admin status
    if (recipe.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }
    
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle favorite recipe
router.post('/favorite/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if recipe is already in favorites
    const isFavorite = user.favorites.includes(req.params.id);
    
    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(favId => favId.toString() !== req.params.id);
    } else {
      // Add to favorites
      user.favorites.push(req.params.id);
    }
    
    await user.save();
    
    res.json({ 
      isFavorite: !isFavorite,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorite recipes
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;