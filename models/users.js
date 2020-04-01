const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
  name:{
    type: String,
    require: true
  },
  lastname :{
    type: String,
    require: true
  },
  email :{
    type: String,
    require: true
  },
  password :{
    type: String,
    require: true
  },
  date : {
    type: Date,
    default: Date.now
  }
});

mongoose.model('users',usersSchema);
