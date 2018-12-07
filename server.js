const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI,{useMongoClient:true})
var Schema = mongoose.Schema
var usersSchema = new Schema({username: {type: String, required: true}})

var exercisesSchema = new Schema({userId: {type: String, required: true},
                            description: {type: String, required: true},
                            duration: {type: Number, required: true},
                            date: Date })

var users = mongoose.model('Users', usersSchema)
var exercises = mongoose.model('Exercises', exercisesSchema)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

//verify and create new user
app.post("/api/exercise/new-user", function(req, res){
  userAdd(req.body.username, function(data){
    res.json(data)
  })
})
var userAdd = function(username, done){
  var exists= true;
  if(username){
    users.find({username: username}).exec(function(err, data){
      if(err) throw err
      if(data.length > 0){
        done("username already taken")
      }else{
        var user = new users({username: username});
        user.save(function(err, data){
        if (err) throw err
        done(data)
        })
       }
    })
  }
}
app.post("/api/exercise/add", function(req, res){
  exerciseAdd(req.body, function(data){
    res.json(data)
  })
})
var exerciseAdd = function(body, done){
  var exercise
  if(body.date){
    exercise = new exercises({userId: body.userId, description: body.description, duration: body.duration, date: body.date})
  } else {
    exercise = new exercises({userId: body.userId, description: body.description, duration: body.duration})
  }
  
  exercise.save(function(err, data){
    if(err) throw err
    done(data)
  })
  
}
app.get("/api/exercise/log", function(req, res){
  exerciseLogsGet(req.query, function(data){
    res.json(data)
  })
})

var exerciseLogsGet = function(query, done){
  if(query.userId){
    
    if(query.from && query.to && query.limit){
      exercises.find({userId: query.userId, date: {$gte: new Date(query.from), $lte: new Date(query.to)}}).limit(Number(query.limit)).exec(function(err, data){
        if(err) throw err
        done(data)
      })
      
    } else if(query.from && query.to && query.from != "" && query.to != ""){
      exercises.find({userId: query.userId, date: {$gte: new Date(query.from), $lte: new Date(query.to)}}).exec(function(err, data){
        if(err) throw err
        done(data)
      })
      
    } else if(query.from && query.limit && query.from != "" && query.limit != ""){
      exercises.find({userId: query.userId, date: {$gte: new Date(query.from)}}).limit(Number(query.limit)).exec(function(err, data){
        if(err) throw err
        done(data)
      })
      
    } else if(query.limit && query.limit != ""){
      exercises.find({userId: query.userId}).limit(Number(query.limit)).exec(function(err, data){
        if(err) throw err
        done(data)
      })
    } else {
      exercises.find({userId: query.userId}, function(err, data){
        if(err) throw err
        done(data)
      })
    }
    
    
  }
}
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
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
