// Require express
const express = require('express')
// Set recipe router
const recipeRouter = express.Router()
// Require upload middleware
const upload = require('../middlewares/upload')
const isAuthenticated = require('../middlewares/authentication')
// Require recipe schema
const RecipeModel = require('../models/recipeModel')

// MIDDLEWARE
const formatData = (req, res, next) => {
    if (req.file) {
        req.body.img = req.file.path
    }
    req.body.serves = parseInt(req.body.serves)
    req.body.cookTime = parseInt(req.body.cookTime)
    if (typeof req.body.ingredients === 'string') {
        req.body.ingredients = [req.body.ingredients]
    } 
    if (typeof req.body.methods === 'string') {
        req.body.methods = [req.body.methods]
    }
    if (typeof req.body.ingredients === 'object') {
        req.body.ingredients = req.body.ingredients.filter(str => str !== '')
    }
    if (typeof req.body.methods === 'object') {
        req.body.methods = req.body.methods.filter(str => str !== '')
    }
    req.body.author = req.session.currentUser
    return next()
}

// CREATE - allow user to enter new recipe data and store data in database
// ============ NEW GET /recipe/new (render: new.ejs) ============ //
recipeRouter.get('/recipe/new', isAuthenticated, (req, res) => {
    res.render('recipeViews/new.ejs', {
        currentUser: req.session.currentUser,
        baseUrl: req.baseUrl,
        tabTitle: 'Create New Recipe'
    })
})

// ============ CREATE POST (redirect to /recipe) ============ //
recipeRouter.post('/', upload.single('img'), formatData, (req, res) => {
    RecipeModel.create(req.body)
        .then(() => {
            res.redirect(req.baseUrl + `/recipe`)
            // how to direct to recipe show page?
        })
        .catch((err) => {
            console.log("Error creating new recipe:", err);
        })
})

// READ - show user the homepage with highlighted recipes
// ============ HOME GET / (render: home.ejs) ============ //
recipeRouter.get('/', (req, res) => {
    RecipeModel.find()
        .exec()
        .then((recipes) => {
            res.render('recipeViews/home.ejs', {
                currentUser: req.session.currentUser,
                allRecipes: recipes,
                baseUrl: req.baseUrl,
                tabTitle: 'EasyPeasy Home'
            })
        })
})

// READ - show user the page with all recipe
// ============ INDEX GET /recipe (render: index.ejs)============ //
recipeRouter.get('/recipe', (req, res) => {
    RecipeModel.find()
        .exec()
        .then((recipes) => {
            res.render('recipeViews/index.ejs', {
                currentUser: req.session.currentUser,
                allRecipes: recipes,
                baseUrl: req.baseUrl,
                tabTitle: 'View All Recipes'
            })
        })
})

// READ - show user the page of a specific recipe
// ============ SHOW GET /recipe/:id (render: show.ejs) ============ //
recipeRouter.get('/recipe/:id', isAuthenticated, (req, res) => {
    RecipeModel.findById(req.params.id)
        .populate('author')
        .exec()
        .then((recipe) => {
            res.render('recipeViews/show.ejs', {
                currentUser: req.session.currentUser,
                recipe: recipe,
                baseUrl: req.baseUrl,
                tabTitle: `${recipe.title}`
            })
        })
})

// UPDATE - allow user to edit an existing recipe and update the data in db
// ============ EDIT GET /recipe/:id/edit (render: edit.ejs) ============ //
recipeRouter.get('/recipe/:id/edit', isAuthenticated, (req, res) => {
    RecipeModel.findById(req.params.id)
        .exec()
        .then((recipe) => {
            res.render('recipeViews/edit.ejs', {
                currentUser: req.session.currentUser,
                recipe: recipe,
                baseUrl: req.baseUrl,
                tabTitle: `Edit ${recipe.title}`
            })
        })
})

// ============ UPDATE PUT (redirect to: /recipe/:id) ============ //
recipeRouter.put('/recipe/:id/edit', upload.single('img'), formatData, (req, res) => {
    const updatedRecipe = RecipeModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .exec()
        .then((updatedRecipe) => {
            res.redirect(req.baseUrl + `/recipe/${req.params.id}`)
        })
        .catch((err) => {
            console.log("Error updating new recipe:", err);
        })
})

// DELETE - allow user to delete and existing recipe (from the db as well)
// ============ DELETE DELETE (redirect to: /recipe) ============ //
recipeRouter.delete('/:id', isAuthenticated, (req, res) => {
    RecipeModel.findByIdAndDelete(req.params.id)
        .exec()
        .then(() => {
            res.redirect(req.baseUrl + '/recipe')
        })         
})

// Export router for access in server.js
module.exports = recipeRouter
