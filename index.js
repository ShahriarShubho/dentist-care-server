const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload());
app.use(express.static("doctors"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfpqs.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const appointmentsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("appointments");
  const doctorsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("doctors");

  app.post("/addAppointments", (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorsCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { appointmentDate: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }

      appointmentsCollection.find(filter).toArray((err, documents) => {
        console.log(documents);
        res.send(documents);
      });
    });
  });

  app.post('/isDoctors', (req, res) => {
    const email = req.body.email
    doctorsCollection.find({ email: email})
    .toArray((err, docs) =>{
      res.send(docs.length > 0)
    })

  })

  app.get("/allPatient", (req, res) => {
    appointmentsCollection.find({}).toArray((err, result) => {
      res.send(result);
    });
  });

  app.post("/addDoctors", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;

    file.mv(`${__dirname}/doctors/${file.name}`, (err) => {
      if (err) {
        res.status(500).send({ msg: err.message });
      }
      doctorsCollection
        .insertOne({ name, email, image: file.name })
        .then((result) => {
          res.send(result.insertedCount > 0);
        });
      // return res.send({name : file.name, path : `/${file.name}`})
    });
  });

  app.get("/doctors", (req, res) => {
    doctorsCollection.find({}).toArray((err, result) => {
      res.send(result);
    });
  });
});

app.listen(port);
