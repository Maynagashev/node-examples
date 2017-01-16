var User = require('../models/user');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config.js');

exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey, {
        expiresIn: 3600
    });
};

exports.verifyOrdinaryUser = function (req, res, next) {

    // for ordinary user just check token with helper function
    return verify_token(req, res, next);
}

exports.verifyAdmin = function (req, res, next) {

    //for admin check token and decoded data via callback function with decoded content
   return verify_token(req, res, next, function(decoded){
       console.log(decoded, decoded._doc.admin);
       if (decoded._doc.admin===true) {
           console.log('Current user is admin.');
           return next();
       }
       else {
           var err = new Error('You are not authorized. Admin only!');
           err.status = 401;
           return next(err);
       }
   });
};

// helper function
function verify_token(req, res, next, callback_check_decoded) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.secretKey, function (err, decoded) {
            if (err) {
                var err = new Error('You are not authenticated!');
                err.status = 401;
                return next(err);
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;

                // if set callback call it, else next()
                return (callback_check_decoded) ? callback_check_decoded(decoded) : next();
            }
        });
    } else {
        // if there is no token
        // return an error
        var err = new Error('No token provided!');
        err.status = 403;
        return next(err);
    }
}