const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;
    if(req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    }

    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;
    next();
}

exports.mustBeLoggedIn = function(req, res, next) {
    if(req.session.user) {
        next();
    } else {
        req.flash("errors", "devi essere loggato per postare");
        req.session.save(function() {
            res.redirect('/');
        });
    }
}

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id
        }
        req.session.save(function() {
            res.redirect('/');
        });
    }).catch(function(err) {
        req.flash('errors', err)
        req.session.save(function() {
            res.redirect('/');
        });
    });
}


exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/');
    })
}


exports.register = function(req, res) {
    let user = new User(req.body);
    user.register().then(() => {
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id
        };
        req.session.save(function() {
            res.redirect('/');
        });
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error);
        });
        req.session.save(function() {
            res.redirect('/');
        });
    });

}

exports.home = function(req, res) {
    if(req.session.user) {
        res.render('home-dashboard');
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')});
    } 
}


exports.ifUserExist = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument;
        next();
    }).catch(function() {
        res.render("404");
    });
}

exports.profilePostsScreen = function(req, res) {
    //ci facciamo resitituire dal file model per i post quelli filtratri per user
    Post.findByAuthorId(req.profileUser._id).then(function(posts) {
        res.render('profile', {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile
        });
    }).catch(function() {
        res.render("404");
    });
}


