var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcrypt');
var axios = require('axios');
var jwt = require('jsonwebtoken');

MongoClient.connect('mongodb://localhost:27017/reach_your_read', { useUnifiedTopology: true }, function (err, client) {
  if (err) throw err

  const db = client.db('reach_your_read')

  router.post('/users/new', (req, res) => {
    console.log(req.body)
    var isAdmin = false;
    if(req.body.email == 'minatsilvester@gmail.com'){
      isAdmin = true;
    }
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if(err) throw err;

      db.collection('users').findOne({email: req.body.email}, (err, item) => {
        if(err) throw err;

        if(item != null){
          return res.status(400).send({message: "Account Already exists, Please sign in"})
        }
        else{
          db.collection('users').find({}).toArray((err, item) => {
            var user_id = item.length + 1
            const initialUserData = {
              user_id: user_id,
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              email: req.body.email,
              gender: req.body.gender,
              skills: [],
              reading_history: [],
              recommendations: [],
              password: hash,
              first_time_logger: true,
              admin: isAdmin,
            }
            db.collection('users').insertOne(initialUserData, (err, item) => {
              if(err){
                throw err;
                res.send({error: "user_not_inserted"})
              }
              else{
                res.send({confirm: "true"})
              }
            })
          })
        }
      })
    })
  })

  router.post('/sessions/new', (req, res) => {
    console.log(req.body)
    db.collection('users').findOne({email: req.body.email}, (err, item) => {
      if (err){
        console.log(error)
        throw err;
      }
      else if(item == null){
        return res.status(400).send({message: "User Not Found, Plase Sign Up"})
      }
      bcrypt.compare(req.body.password, item.password, (err, decrytedPasswordMatch) => {
        if (err) throw err;
        if(!decrytedPasswordMatch){
          return res.status(400).send({message: "Bad Email/Password"})
        }
        var token = jwt.sign({id: item.id, email: item.email}, 'top-secret')
        const data = {
                      user_id: item.user_id,
                      first_name: item.first_name,
                      last_name: item.last_name,
                      email: item.email,
                      first_time_logger: item.first_time_logger,
                      admin: item.admin,
                      authToken: token,
                    }
        res.send(data)
      })
    })
  })

  router.post('/sessions/current_user', (req, res) => {
    console.log(req.body)
    var decodedFromToken = jwt.verify(req.body.jwt, 'top-secret')
    console.log(decodedFromToken)
    db.collection('users').findOne({email: decodedFromToken.email}, (err, item) => {
      if(err) throw err;
      const data = {
        user_id: item.user_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        gender: item.gender,
        first_time_logger: item.first_time_logger,
        admin: item.admin,
        recommendations: item.recommendations,
        reading_history: item.reading_history,
        skills: item.skills,

        authToken: req.body.jwt,
      }
      res.send(data)
    })
  })

  router.get('/update/get_all_skill', (req, res) => {
    db.collection('available_skills').findOne({name: "available_skills"}, (err, item) => {
      if(err) throw err;
      console.log(item)
      res.send(item)
    })
  })

  router.get('/py_test', (req, res) => {
    axios.post("http://localhost:8000/myapi/idealweight", {skills: ["elixir", "python"], reading_history: [], feed_urls: ["https://medium.com/feed/@minat_silvester"]})
    .then((response) => {
      console.log(response)
      return res.send({message: response.data})
    })
    .catch((e) => {
      console.log("error")
      return res.send({error: e})
    })
  })

  router.post('/update/update_user', (req, res) => {
    console.log(req.body)
    var recommendations = {}
    var i;
    for(i=0;i<req.body.skills.length;i++)
      recommendations[req.body.skills[i]]= [];
    db.collection('users').updateOne({email: req.body.email}, {$set: {first_time_logger: false, skills: req.body.skills, recommendations: recommendations}}, (err, item) => {
      if(err) throw err
      res.send({confirm: true})
    })
  })

  router.get('/', function(req, res, next) {
    res.send("Yeah it is big")
  })

})



module.exports = router;
