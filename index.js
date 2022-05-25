const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wtttq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: "UnAuthorized Access"});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
        if(err){
            return res.status(403).send({message: "Forbidden Access"});
        }
        req.decoded = decoded;
        next();
    });
}


async function run(){
    try{
        await client.connect();
        const productCollection = client.db("manufacturer_website").collection("products");
        const reviewCollection = client.db("manufacturer_website").collection("reviews");
        const orderCollection = client.db("manufacturer_website").collection("orders");
        const userCollection = client.db("manufacturer_website").collection("users");
        const userDetailsCollection = client.db("manufacturer_website").collection("userDetails");


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

        app.post('/review', async(req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        app.get('/order', verifyJWT, async(req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(decodedEmail){
                const query = {email: email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                return res.send(orders);
            }
            else{
                return res.status(403).send({message: "Forbidden Access"});
            }        
            
        })

        app.post('/order', async(req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.delete('/order/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/user', verifyJWT, async(req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        

        app.put('/user/admin/:email', verifyJWT, async(req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
                const filter = {email: email};
                const updateDoc = {
                    $set: {role: 'admin'},
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else{
                res.status(403).send({message: "Forbidden access"})
            }
            
        });

        app.put('/user/:email', async(req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
              };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'});
            res.send({result, token});
        });

        app.put('/userDetails/:email', async(req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
              };
            const result = await userDetailsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        
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