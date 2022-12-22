const postsCollection = require("../db").db().collection("posts");
const User = require("./User");
const ObjectId = require("mongodb").ObjectId;
const sanitizeHTML = require("sanitize-html");

class Post {
    constructor(data, userId, requestedPPostId) {
        this.data = data;
        this.userId = userId;
        this.errors = [];
        this.requestedPPostId = requestedPPostId;
    }

    cleanUp() {
        if(typeof(this.data.title) != "string") {
            this.data.title = "";
        }
        if(typeof(this.data.body) != "string") {
            this.data.body = "";
        }
        
        this.data = {
            title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
            body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
            createdDate: new Date(),
            author: ObjectId(this.userId)
        }
    }

    validate() {
        if(this.data.title == "") {
            this.errors.push("titolo obbligatorio");
        }
        if(this.data.body == "") {
            this.errors.push("testo del post obbligatorio");
        }
    }
    create() {
        return new Promise((resolve, reject) => {
            this.cleanUp();
            this.validate();
            if(!this.errors.length) {
                // salvataggio post
                postsCollection.insertOne(this.data).then((info) => {
                    resolve(info.insertedId);
                }).catch(() => {
                    this.errors.push("errore nel salvataggio dei dati");
                    reject(this.errors);
                });
            } else {
                reject(this.errors);
            }
        });
        
    }

    update() {
        return new Promise( async (resolve, reject) => {
            try {
                let post = await Post.findSingleById(this.requestedPPostId, this.userId);
                if(post.isVisitorOwner) {
                    let status = await this.actuallyUpdate();
                    resolve(status)
                } else {
                    reject();
                }
            } catch {
                reject();
            }
        });
    }

    actuallyUpdate() {
        return new Promise( async (resolve, reject) => {
            this.cleanUp();
            this.validate();
            if(!this.errors.length) {
                await postsCollection.findOneAndUpdate({
                    _id: new ObjectId(this.requestedPPostId)
                },
                {
                    $set: {
                        title: this.data.title,
                        body: this.data.body
                    }
                });
                resolve("success")
            } else {
                resikve("failure")
            }
        }); 
    }

}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat(
            [
                {
                    $lookup: {
                        from: "users",
                        localField: "author",
                        foreignField: "_id",
                        as: "authorDocument"
                    }
                },
                {
                    $project: {
                        title: 1,
                        body: 1,
                        createdDate: 1,
                        authorId: "$author",
                        author: {
                            $arrayElemAt: ["$authorDocument", 0]
                        }
                    }
                }
            ]
        );
        let posts = await postsCollection.aggregate(aggOperations).toArray();

        // pulizia delle informazioni dell'autore legate ai post
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId);
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            };
            return post;
        });

        resolve(posts);
    });
}

Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if(typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject();
            return;
        }
        let posts = await Post.reusablePostQuery([
            {
                $match: {
                    _id: new ObjectId(id)
                }
            }
        ], visitorId);
        if(posts.length) {
            resolve(posts[0]);
        } else {
            reject();
        }
    });
}



Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {
            $match: {
                author: authorId
            }
        },
        {
            $sort: {
                createdDate: -1
            }
        }
    ]);
}

module.exports = Post;
