const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title:{
    type: String,
    require: true
  },
  body :{
    type: String,
    require: true
  },
  user :{
    type: String,
    require: true
  },
  date : {
    type: Date,
    default: Date.now
  }
});

mongoose.model('notes',noteSchema);
