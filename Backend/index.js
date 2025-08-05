//initialization
import app from './app.js';
import mongoose from 'mongoose';


const port = 3000;
//Routes
app.get('/',(_req, res) => {
    res.send("This is the Homepage.");

})
//starting the server in the port
app.listen(port, () => {
    console.log(`Server started at Port: ${port}`);
});


const uri = "mongodb+srv://sajanakarki738:test123@cluster0.grwmr1o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);
