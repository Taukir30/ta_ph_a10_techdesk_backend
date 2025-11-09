const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());


//connection uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ta.qolps9k.mongodb.net/?appName=TA`;

//client
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        //connecting  the client to the server
        await client.connect();

        //getting the database
        const db = client.db('tech_desk_db');

        //getting the table/collection
        const jobsCollection = db.collection('jobs');
        const acceptedJobsCollection = db.collection('acceptedJobs');
        const usersCollection = db.collection('users');

        //users APIs
        //create api
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = newUser.email;                                    //taking email from req.body for query

            const query = { email: email };                                 //query to check user 
            const existingUser = await userCollection.findOne(query);       //finding wheather the user already exists in the db or not

            if (existingUser) {
                res.send({ message: 'User already exists, no need to insert into db' });              //not inserting if user exists
            } else {
                const result = await userCollection.insertOne(newUser);                             //inserting user into db if user already doesn't exist
                res.send(result);
            }
        })


        //jobs APIs with data from database---------
        //create api
        app.post('/addjob', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.send(result);
        })

        //read api all jobs or jobs by email
        app.get('/alljobs', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.userEmail = email;
            }
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //latest posted jobs
        app.get('/latest-jobs', async (req, res) => {
            const cursor = jobsCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        //job details read api
        app.get('/alljobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            // const query = { _id: id };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        //update api
        app.patch('/updatejob/:id', async (req, res) => {
            const id = req.params.id;                           //getting job id from route
            const query = { _id: new ObjectId(id) };            //making query which job will be updated
            // const query = { _id: id };                           //making query which job will be updated
            const updatedJob = req.body;                    //getting latest data from frontend
            const update = {                                    //making data $set object to pass in function
                // $set: updatedJob;
                $set: {
                    title: updatedJob.title,
                    category: updatedJob.category,
                    summary: updatedJob.summary,
                    coverImage: updatedJob.coverImage
                }
            }

            const result = await jobsCollection.updateOne(query, update);         //updating command
            res.send(result);                                                           //sending response
        })

        //delete api
        app.delete('/deletejob/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            // const query = { _id: id };
            const result = await jobsCollection.deleteOne(query);
            res.send(result);
        })

        //ACCEPTED jobs APIs ----------------------
        //create api
        app.post('/accept-task', async (req, res) => {
            const newacceptedJob = req.body;
            const result = await acceptedJobsCollection.insertOne(newacceptedJob);
            res.send(result);
        })

        //read api for accepted jobs by email
        app.get('/my-accepted-tasks', async (req, res) => {
            const email = req.query.email;
            const query = {accepted_by: email};

            if (!email) {
                res.send('email not specified!')
            }
            const cursor = acceptedJobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //delete accepted jobs api
        app.delete('/delete-accepted-task/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            // const query = { _id: id };
            const result = await acceptedJobsCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

//APIs
app.get('/', (req, res) => {
    res.send('Tech Desk server is up and runnig')
})

app.listen(port, () => {
    console.log(`Tech Desk server is running on port: ${port}`)
})