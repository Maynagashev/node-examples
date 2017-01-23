var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Favorites = require('../models/favorites');
var Verify = require('./verify');


var favoriteRouter  = express.Router();
favoriteRouter.use(bodyParser.json());



favoriteRouter.route('/')

    .get(Verify.verifyOrdinaryUser, function(req,res,next){
        var user_id = req.decoded._doc._id;
        Favorites.find({postedBy : user_id})
            .populate('postedBy')
            .populate('dishes')
            .exec(function (err, user) {
                if (err) throw err;
                res.json(user);
            });

    })

    .post(Verify.verifyOrdinaryUser, function(req,res,next){
        var user_id = req.decoded._doc._id;
        var dish_id = req.body._id;
        if (!dish_id) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("Dish _id not set.");
            return next();
        }

        Favorites.findOne({postedBy : user_id}, function (err, user) {
            console.log("POST req, res of find func:", user);

            // if user not presented in db yet, create new record
            if (!user) {
                var dishes = [];
                dishes.push(dish_id);
                Favorites.create({postedBy: user_id, dishes: dishes}, function (err, user) {
                    if (err) throw err;
                    console.log('New record in favorites created!');
                    res.json(user);
                });
            }
            // else if record found update it
            else {
                console.log("user record presented in db: ", user);

                if (user.dishes.indexOf(dish_id) === -1) {
                    user.dishes.push(dish_id);
                    user.save(function (err, user) {
                        if (err) throw err;
                        console.log("Updated record: ", user);
                        res.json(user);
                    });
                }
                else {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("Dish "+dish_id+" already exists in favorites of user "+user_id+", skipping.");
                }

            }
        });
    })

    .delete(Verify.verifyOrdinaryUser, function (req, res, next) {
        var user_id = req.decoded._doc._id;

        Favorites.findOne({postedBy : user_id}, function (err, user) {
            if (err) throw err;
            console.log("DELETE ALL request - res of findOne func:", user);

            user.dishes = [];

            user.save(function (err, result) {
                if (err) throw err;
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Favorites cleared!');
            });

        });
    })


favoriteRouter.route('/:dishObjectId')

    .delete(Verify.verifyOrdinaryUser, function (req, res, next) {
        var user_id = req.decoded._doc._id;
        var dish_id = req.params.dishObjectId;

        if (!dish_id) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("Dish for deleting not specified.");
            return next();
        }

        Favorites.findOne({postedBy : user_id}, function (err, user) {
            if (err) throw err;
            console.log("DELETE ONE request, res of findOne func:", user);

            var save_dishes = [];
            for (var i = (user.dishes.length - 1); i >= 0; i--) {
                var id = user.dishes[i];
                if (id == dish_id) {
                    console.log("Set to remove: " + id);
                }
                else {
                    save_dishes.push(id);
                }
            }
            user.dishes = save_dishes;

            user.save(function (err, result) {
                if (err) throw err;
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Removed '+dish_id+' from favorites!');
            });

        });
    })

module.exports = favoriteRouter;