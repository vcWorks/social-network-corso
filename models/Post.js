const postsCollection = require("../db").db().collection("posts");
const ObjectId = require("mongodb").ObjectId;

class Post {
    constructor(data, userId) {
        this.data = data;
        this.userId = userId;
        this.errors = [];
    }

    cleanUp() {
        if(typeof(this.data.title) != "string") {
            this.data.title = "";
        }
        if(typeof(this.data.body) != "string") {
            this.data.body = "";
        }

        this.data = {
            title: this.data.title.trim(),
            body: this.data.body.trim(),
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
                postsCollection.insertOne(this.data).then(() => {
                    resolve();
                }).catch(() => {
                    this.errors.push("errore nel salvataggio dei dati");
                    reject(this.errors);
                });
            } else {
                reject(this.errors);
            }
        });
        
    }

}

Post.findSingleById = function(id) {
    return new Promise(async function(resolve, reject) {
        if(typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject();
            return;
        }
        let post = await postsCollection.findOne({
            _id: new ObjectId(id)
        });
        if(post) {
            resolve(post);
        } else {
            reject();
        }
    });
}

module.exports = Post;
