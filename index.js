const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p7e2hae.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
      const serviceCollection = client.db('docotors_portal').collection('services');
      const bookingCollection = client.db('docotors_portal').collection('bookings');
      const userCollection = client.db('docotors_portal').collection('users');

      /*
      
      */

      app.get('/service', async (req, res) =>{
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });

      app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = {email: email};
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        res.send(result);
      })

      app.get('/available', async (req, res) => {
        const date = req.query.date;
        // Step 1: Get All services;

        const services = await serviceCollection.find().toArray();

        // Step 2: get the bookings of that day
        const query = {date: date};
        const bookings = await bookingCollection.find(query).toArray();

        // Step 3: for each service
        services.forEach(service => {
          // step 4: find the bookings for the service
          const serviceBookings = bookings.filter(book => book.treatment === service.name);
          // Step 5: select slots for the service Bookings
          const bookedSlots = serviceBookings.map(book => book.slot);
          // Step 6: select those slots that are not in bookedSlots
          const available = service.slots.filter(slot => !bookedSlots.includes(slot));
          //  Step 7: set available to slots to make it easier
          service.slots = available;
        });

        res.send(services);
      });

      app.get('/booking', async (req, res) => {
        const patient = req.query.patient;
        const query = {patient: patient};
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
      })

      app.post('/booking', async (req, res) => {
        const booking = req.body;
        const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient};
        const exists = await bookingCollection.findOne(query);
        if (exists) {
          return res.send({success: false, booking: exists})
        }
        const result = await bookingCollection.insertOne(booking);
        return res.send({success: true, result})
      })

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Doctors portal listening on port ${port}`)
})