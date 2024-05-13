const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// miidleware  written here
const corsConfig = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}
app.use(cors(corsConfig))
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5ynzghe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const queryCollection = client.db('productPulseDB').collection('queries');
    const recommendationCollection = client.db('productPulseDB').collection('recommendations');

    //   const categoryCollection = client.db('craftifycreationsDB').collection('category');


    app.get('/query', async (req, res) => {
      const cursor = queryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/recommendation', async (req, res) => {
      const cursor = recommendationCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    //query with 

    //  Get a single query data from db using id
    app.get('/query/:id', async (req, res) => {
      const id = req.params.id;
      // const querys = { _id: (id) }
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
      const result = await queryCollection.findOne(query)
      res.send(result)
    })

    //  Get a single query data from db using id
    

    app.get('/recommendation/:id', async (req, res) => {
      const id = req.params.id;
      let query;
  
      // Check if the id is a valid ObjectId
      query = { $or: [{ queries_id: new ObjectId(id) }, { queries_id: id }] };
  
      try {
          const results = await recommendationCollection.find(query).toArray();
          if (results.length > 0) {
              res.send(results);
          } else {
              res.status(404).send("No recommendations found for the specified id");
          }
      } catch (error) {
          console.error("Error:", error);
          res.status(500).send("Internal Server Error");
      }
  });
  



    // Endpoint to search data based on user email
    app.get('/query/email/:useremail', async (req, res) => {
      try {
        // Extract the user email from the request parameters
        const userEmail = req.params.useremail;

        // Search for data in the query collection based on the user email
        const result = await queryCollection.find({ useremail: userEmail }).toArray();

        // Send the search result back to the client
        res.send(result);
      } catch (error) {
        // If an error occurs, send an error response
        console.error('Error searching data by email:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // recommendation   search   based on user email
    app.get('/recommendation/email/:recommenderEmail', async (req, res) => {
      try {
        // Extract the user email from the request parameters
        const userEmail = req.params.recommenderEmail;

        // Search for data in the query collection based on the user email
        const result = await recommendationCollection.find({ recommenderEmail: userEmail }).toArray();

        // Send the search result back to the client
        res.send(result);
      } catch (error) {
        // If an error occurs, send an error response
        console.error('Error searching data by email:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // recommendation   search   based on user email
    app.get('/recommendations/email/:QueryEmail', async (req, res) => {
      try {
        // Extract the user email from the request parameters
        const userEmail = req.params.QueryEmail;

        // Search for data in the query collection based on the user email
        const result = await recommendationCollection.find({ QueryEmail: userEmail }).toArray();

        // Send the search result back to the client
        res.send(result);
      } catch (error) {
        // If an error occurs, send an error response
        console.error('Error searching data by email:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    
// delete query
app.delete('/query/:id', async (req, res) => {
  const id = req.params.id;
  const query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  try {
    const result = await queryCollection.deleteOne(query);
    if (result.deletedCount === 1) {
      res.status(200).json({ success: true, message: "Query deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Query not found." });
    }
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({ success: false, message: "Failed to delete the query." });
  }
});

//delete recommendation

app.delete('/recommendation/:id', async (req, res) => {
  const id = req.params.id;
  const query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  try {
    // Get the recommendationData first
    const recommendationData = await recommendationCollection.findOne(query);
    if (!recommendationData) {
      return res.status(404).json({ success: false, message: "Recommendation not found." });
    }

    const result = await recommendationCollection.deleteOne(query);
    if (result.deletedCount === 1) {
      // Update the recommendation count for the corresponding query
      await queryCollection.updateOne(
        // { _id: new ObjectId(recommendationData.queries_id) },
        { $or: [{ _id: new ObjectId(recommendationData.queries_id) }, { _id: recommendationData.queries_id }] },
        { $inc: { recommendationcount: -1 } } // Decrease count by 1
      );
      res.status(200).json({ success: true, message: "Recommendation deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Recommendation not found." });
    }
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({ success: false, message: "Failed to delete the recommendation." });
  }
});

 

//update query
app.put('/updateQuery/:id', async (req, res) => {
  const id = req.params.id;
  const query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };

  const updatedQuery = req.body;
  const updateQueries = {
      $set: {
          productname: updatedQuery.productname,
          productbrand: updatedQuery.productbrand,
          productimageurl: updatedQuery.productimageurl,
          querytitle: updatedQuery.querytitle,
          boycottingreasondetails: updatedQuery.boycottingreasondetails
      }
  };

  try {
      const result = await queryCollection.updateOne(query, updateQueries);
      if (result.modifiedCount > 0) {
          res.status(200).json({ success: true, message: "Query updated successfully." });
      } else {
          res.status(404).json({ success: false, message: "Query not found." });
      }
  } catch (error) {
      console.error("Error updating query:", error);
      res.status(500).json({ success: false, message: "Failed to update the query." });
  }
});

 

    // Save a recommend data in db

    app.post('/recommendation', async (req, res) => {
      try {
        const recommendationData = req.body;

        // Save the recommendation data to the recommendations collection
        await recommendationCollection.insertOne(recommendationData);

        // Update the recommendation count for the corresponding query
        // await queryCollection.updateOne(
        //   { _id: new ObjectId(recommendationData.queries_id) },
        //   { $inc: { recommendationcount: 1 } }
        // );
        // Update the recommendation count for the corresponding query
        await queryCollection.updateOne(
          { $or: [{ _id: new ObjectId(recommendationData.queries_id) }, { _id: recommendationData.queries_id }] },
          { $inc: { recommendationcount: 1 } }
        );

        res.status(201).json({ message: 'Recommendation added successfully' });
      } catch (error) {
        console.error('Error adding recommendation:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });





    // app.post('/recommendation', async (req, res) => {
    //   const recommendationData = req.body

    //   const result = await recommendationCollection.insertOne(recommendationData)
    //   res.send(result)
    // })

    // Save a query data in db
    app.post('/query', async (req, res) => {
      const queryData = req.body

      const result = await queryCollection.insertOne(queryData)
      res.send(result)
    })


    //   await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('product-pulse-server server is running ')
})

app.listen(port, () => {
  console.log(`product-pulse is running on port: ${port}`)
})