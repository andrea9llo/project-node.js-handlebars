const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


// schema e model users
require('../models/users');
const Users = mongoose.model('users');

module.exports = function(passport){
  passport.use( new LocalStrategy({usernameField: 'email'},(email,password, done)=>{
    Users.findOne({
      // verifica mail
      email:email
    }).then(user =>{
      if (!user) {
        return done(null,false,{message:'Utente non trovato'});
      }
      // verifica psw
      bcrypt.compare(password,user.password,(err,res)=>{
        if(err) throw(err);
        if (res) {
          return done(null,user);
        } else {
          return done(null,false,{message:'Password non corretta!!!'});
        }
      });
    });
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      Users.findById(id, function(err, user) {
        done(err, user);
      });
    });
  }));
}
