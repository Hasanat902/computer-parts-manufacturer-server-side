const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wtttq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const productCollection = client.db("manufacturer_website").collection("products");
        const reviewCollection = client.db("manufacturer_website").collection("reviews");
        const orderCollection = client.db("manufacturer_website").collection("orders");


        app.get('/product', async(req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/product/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await productCollection.findOne(query);
            res.send(result);
        })


        app.get('/review', async(req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/order', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        app.post('/order', async(req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        
    }
    finally{

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Hello from manufacturer website");
});

app.listen(port, () => {
    console.log("Listening from port", port);
})