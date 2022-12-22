const Post = require("../models/Post");

exports.viewCreateScreen = function(req, res) {
    res.render('create-post');
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id);
    post.create().then(function() {
        res.send("creato nuovo post");
    }).catch(function(errors) {
        res.send(errors);
    });
}

exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId);
        res.render('single-post-screen', {
            post: post
        });
    } catch {
        res.render('404');
    }
}


exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id);
        if(post.authorId == req.visitorId) {
            res.render("edit-post", {
                post: post
            });
        } else {
            req.flash("errors", "non hai i permessi per visualizzare il post");
            req.session.save( () => res.redirect("/"));
        }
    } catch {
        res.render('404');
    }
}


exports.edit = async function(req, res) {

    let post = new Post(req.body, req.visitorId, req.params.id);
    post.update().then((status) => {
        //post aggiornato oppure c'è un errore di validazione
        if(status == "success") {
            //post aggiornato con successo
            req.flash("success", "Post aggiornato!");
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`);
            });
        } else {
            //errore di validazione
            post.errors.forEach(function(error) {
                req.flash("errors", error);
                req.session.save(() => {
                    res.redirect(`post/${req.params.id}/edit`);
                });
            });
        }

    }).catch(function() {
        //va in errore nel caso non trova l'id del post o se non sei propretario del post
        req.flash("errors", "non hai i permessi per modificare i dati");
        req.session.save(() => {
            res.redirect("/");
        });
    });
}