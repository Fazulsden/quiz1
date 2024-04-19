const Users = require("../models/Users");
const Recipe = require("../models/Recipe");
const Ingredient = require("../models/Ingredient");
var express = require("express");
const mongoose = require("mongoose");

var router = express.Router();

router.post("/listAll", async (req, res) => {
  try {
    // Fetch all recipes from the database
    const recipes = await Recipe.find({});
    
    // If there are no recipes found, return an empty array
    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ message: 'No recipes found.' });
    }

    // If recipes are found, return them in the response
    res.status(200).json(recipes);
  } catch (err) {
    // If there's an error, return a 500 Internal Server Error response
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

router.post("/getRecipeWithIngredients", async (req, res) => {
  try {
    console.log("Mei agya hun ")
    // Extract the recipe ID from the request parameters
    const { recipeId } = req.body;

    // Find the recipe by its ID and populate its ingredients
    const recipe = await Recipe.findById(new mongoose.Types.ObjectId(recipeId)).populate('ingredients');

    // If the recipe is not found, return a 404 Not Found response
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    // Return the recipe details along with its populated ingredients
    res.status(200).json(recipe);
  } catch (err) {
    // If there's an error, return a 500 Internal Server Error response
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});


/******* above are all the routes that WILL NOT pass through the middleware ********/

router.use((req, res, next) => {
  if (!req.user.admin) return res.json({ msg: "NOT ADMIN" });
  else next();
});

/******* below are all the routes that WILL pass through the middleware ********/

router.post("/addIngredients", async (req, res) => {
  try {
    // Extract ingredient details from the request body
    const { name, description } = req.body;

    // Check if the ingredient already exists
    const existingIngredient = await Ingredient.findOne({ name });
    if (existingIngredient) {
      return res.status(400).json({ message: 'Ingredient already exists.' });
    }

    // Create a new ingredient
    const newIngredient = new Ingredient({
      name,
      description
    });

    // Save the new ingredient to the database
    await newIngredient.save();

    // Return a success response
    res.status(201).json({ message: 'Ingredient added successfully.', ingredient: newIngredient });
  } catch (err) {
    // If there's an error, return a 500 Internal Server Error response
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

router.post("/addRecipeWithIngredients", async (req, res) => {
  try {
    // Extract recipe details from the request body
    const { name, description, ingredients } = req.body;

    // Check if all provided ingredient names exist
    const missingIngredients = [];
    for (const ingredientName of ingredients) {
      const existingIngredient = await Ingredient.findOne({ name: ingredientName });
      if (!existingIngredient) {
        missingIngredients.push(ingredientName);
      }
    }

    if (missingIngredients.length > 0) {
      return res.status(400).json({ message: `Ingredients '${missingIngredients.join(', ')}' not found.` });
    }

    // If all ingredients exist, find their IDs
    const ingredientIds = await Promise.all(ingredients.map(async (ingredientName) => {
      const existingIngredient = await Ingredient.findOne({ name: ingredientName });
      return existingIngredient._id;
    }));

    // Create a new recipe
    const newRecipe = new Recipe({
      name,
      description,
      ingredients: ingredientIds
    });

    // Save the new recipe to the database
    await newRecipe.save();

    // Return a success response
    res.status(201).json({ message: 'Recipe added successfully.', recipe: newRecipe });
  } catch (err) {
    // If there's an error, return a 500 Internal Server Error response
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
