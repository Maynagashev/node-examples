var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Favorites = require('../models/favorites');
var Verify = require('./verify')

var favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());
favoriteRouter.route('/')
// verify ordinary user for all operations
.all(Verify.verifyOrdinaryUser)
.get(function(req, res, next) {
    Favorites.find({postedBy: req.decoded._doc._id})
    .populate('postedBy')
    .populate('dishes')
    .exec(function(err, favorite){
        if (err) throw err;
        res.json(favorite);
    });
})
.post(function (req, res, next){
    Favorites.findOneAndUpdate({postedBy: req.decoded._doc._id}, {
        // push to array only if unique
        $addToSet: {dishes: req.body}
    }, {
        // return the new, updated object in callback
        new: true,
        // create the object if it doesn't exist yet
        upsert: true
    }, function (err, favorite) {
        if (err) throw err;
        res.json(favorite);
    });
})
.delete(function(req,res,next){
    Favorites.remove({postedBy: req.decoded._doc._id}, function(err, resp){
        if (err) throw err;
        res.json(resp);
    })
});

favoriteRouter.route('/:dishId')
.delete(Verify.verifyOrdinaryUser, function(req,res,next){
    Favorites.findOneAndUpdate({postedBy: req.decoded._doc._id}, {
        // remove the dish from the array
        $pull: {dishes: req.params.dishId}
    }, {
        new: true,
    }, function (err, favorite) {
        if (err) throw err;
        res.json(favorite);
    });
})
module.exports = favoriteRouter;
