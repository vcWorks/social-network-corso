const {MongoClient} = require("mongodb");

const client = new MongoClient("mongodb+srv://vcMongo:TQF97Xsz4SP8ffV@cluster0.efq1taf.mongodb.net/socialNetwork?retryWrites=true&w=majority");

async function start() {
    await client.connect();
    module.exports = client.db();
    const app = require('./app');
    app.listen(3000);
}

start();