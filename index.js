require('dotenv').config()
const express = require('express');
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware
app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.egyokrx.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const db = client.db('E-learning');
    const courseCollection = db.collection('courses');
    const instractorCollection = db.collection('instructor')

    // course related api 
    app.get('/courses', async(req, res) => {
        const cursor = courseCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })
    

    app.get('/top-courses', async(req,res) => {
      const cursor = courseCollection.find().sort({ratings: -1}).limit(3);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/courses', async(req, res) => {
        const courseInfo = req.body;
        const result = await courseCollection.insertOne(courseInfo);
        res.send(result);
    })

    // Course Details
    app.get('/viewDetails/:id', async(req, res) => {
      const {id} = req.params;
      const result = await courseCollection.findOne({_id : new ObjectId(id)})
      res.send(result);
    })

    app.get('/topInstructors', async(req, res)=> {
      const cursor = instractorCollection.find().sort({ratings: -1}).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    })

  } finally {
    // Optional: you can close the client if you want to stop the server
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
