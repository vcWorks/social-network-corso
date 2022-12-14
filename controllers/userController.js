const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const jwt = require("jsonwebtoken");

exports.doesUsernameExist = async function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        res.json(true);
    }).catch(function() {
        res.json(false);
    });
}

exports.doesEmailExist = async function(req, res) {
    let emailBool = await User.doesEmailExist(req.body.email);
    res.json(emailBool);
}

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;
    if(req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    }

    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;

    //numeri corretti
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);
    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;
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

exports.apiMustBeLoggedIn = function(req, res, next) {
    try {
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
        next();
    } catch {
        res.json("token trasmesso non valido");
    }
}

exports.apiGetPostsByUsername = async function(req, res) {
    try {
        let authorDoc = await User.findByUsername(req.params.username);
        let posts = await Post.findByAuthorId(authorDoc._id);
        res.json(posts);
    } catch {
        res.json("username non valido");
    }
}

exports.apiLogin = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '30m'}));
    }).catch(function(err) {
        res.json("sbagliatoooooo");
    });
}

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id,
            email: user.data.email
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
            _id: user.data._id,
            email: user.data.email
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

exports.home = async function(req, res) {
    if(req.session.user) {
        let posts = await Post.getFeed(req.session.user._id);
        res.render('home-dashboard', {
            posts: posts
        });
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
            title: req.profileUser.username,
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount
            }
        });
    }).catch(function() {
        res.render("404");
    });
}

exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id);
        res.render("profile-followers", {
            currentPage: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount
            }
        });
    } catch {
        res.render("404");
    }
}

exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render("profile-following", {
            currentPage: "following",
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount
            }
        });
    } catch {
        res.render("404");
    }
}


