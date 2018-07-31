const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  User.create({ username: req.body.username }, (err, user) => {
    res.json(user);
  });
});

app.post('/api/exercise/add', (req, res) => {
  User.findById(req.body.userId, (err, user) => {
    Exercise.create({
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date: new Date(req.body.date),
    }, (err, exercise) => {
      res.json(exercise);
    });
  });
});

app.get('/api/exercise/log', (req, res) => {
  if (!req.query.userId) {
    res.status = 400;
    res.end();
  }
  User.findById(req.query.userId, (err, user) => {
    if (err) {
      res.status = 400;
      return res.end();
    }
    let query = Exercise.find({ username: user.username });
    if (req.query.from !== undefined) {
      query = query.where('date').ge(req.query.from);
    }
    if (req.query.to !== undefined) {
      query = query.where('date').le(req.query.to);
    }
    if (req.query.limit !== undefined) {
      query = query.limit(req.query.limit);
    }
    query.exec((err, exercises) => {
      res.json(exercises);
    });
  });
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
