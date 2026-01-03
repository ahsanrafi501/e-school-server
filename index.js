require('dotenv').config()
const express = require('express');
const cors = require('cors')
const app = express()
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware
app.use(express.json())
app.use(cors())



const serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const logger = (req, res, next) => {
  console.log("Hi i'm logger");
  next();
}

const verifyFirebaseToken = async (req, res, next) =>{
  console.log('firebase token', req.headers.authorization);
  if(!req.headers.authorization){
    return res.status(401).send({message: 'Unauthorized Access'})
  }

  const token = req.headers.authorization.split(' ')[1];
  if(!token){
    return res.status(401).send({message: "Unauthorized Access"})
  }

  try{
    const userInfo = await admin.auth().verifyIdToken(token);
    console.log(userInfo)
    req.token_email = userInfo.email;
    next()
  }
  catch{
        return res.status(401).send({message: "Unauthorized Access"})
        console.log("Not found, you are in catch")
  }
}

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
    const enrolledCourseCollection = db.collection('enrolledCourse')

    // course related api 
    app.get('/courses', async (req, res) => {
      const cursor = courseCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/course/:id', async (req, res) => {
      const { id } = req.params;
      const result = await courseCollection.findOne({ _id: new ObjectId(id) });
      res.send(result)
    })


    // my Course
    app.get('/my-courses', verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await courseCollection.find({ email }).toArray();
      res.send(result);
    })

    app.get('/top-courses', async (req, res) => {
      const cursor = courseCollection.find().sort({ ratings: -1 }).limit(3);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/courses', async (req, res) => {
      const courseInfo = req.body;
      const result = await courseCollection.insertOne(courseInfo);
      res.send(result);
    })

    // Course Details
    app.get('/viewDetails/:id', async (req, res) => {
      const { id } = req.params;
      const result = await courseCollection.findOne({ _id: new ObjectId(id) })
      res.send(result);
    })

    app.get('/topInstructors', async (req, res) => {
      const cursor = instractorCollection.find().sort({ ratings: -1 }).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    })

    // Delete My Courses
    app.delete('/courses/:id', async (req, res) => {
      const id = req.params;
      const result = await courseCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result)
    })


    // Edit My Course
    app.patch('/edit-course/:id', async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const result = await courseCollection.updateOne({ _id: new ObjectId(id) }, { $set: data })
      res.send(result)
    })

    // My Enroll Course
    app.post('/my-enrolled-course', async (req, res) => {
      const { courseId, userEmail } = req.body;

      const exist = await enrolledCourseCollection.findOne({ courseId, userEmail })

      if (exist) {
        return res.send({ enrolled: true, message: 'user is already enrolled to the course' })
      }

      const result = await enrolledCourseCollection.insertOne(req.body)
      res.send(result);
    })
    
    app.get('/my-enrolled-course', logger, verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.send([]);
      }

      if(email){
        if(email !== req.token_email){
          return res.status(403).send({message: forbidden})
        }
      }

      const result = await enrolledCourseCollection
        .find({ userEmail: email })
        .toArray();

      res.send(result);
    });


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
