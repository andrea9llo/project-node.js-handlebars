const express = require('express');
const Handlebars = require('handlebars');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const mongoose = require('mongoose');


const {ensureAuthenticated} = require('./helpers/auth');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');


const app = express();

// gestione cartelle risorse statiche
app.use('/css',express.static( __dirname + '/assets/css'));
// app.use('/img',express.static( __dirname + '/assets/img'));


// middleware handlebars
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// When connecting Handlebars to the Express app...
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    // ...implement newly added insecure prototype access
    handlebars: allowInsecurePrototypeAccess(Handlebars)
    })
);
app.set('view engine', 'handlebars');


// integrazione file conf passport
require('./config/passport')(passport);


// connessione a mongoose
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/note',{
  useMongoClient:true,
})
  .then(()=>{
    console.log('db connesso');
  })
  .catch(err=>(err));

// schema e model note
require('./models/note');
const note = mongoose.model('notes');

// schema e model users
require('./models/users');
const Users = mongoose.model('users');


// middleware body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// middleware override
app.use(methodOverride('_method'));

// middleware success
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

// middleware passport
app.use(passport.initialize());
app.use(passport.session());

// middleware msg flash
app.use(flash());

// variabili globali per msg
app.use((req,res,next)=>{
  res.locals.msg_success = req.flash('msg_success');
  res.locals.msg_err = req.flash('msg_err');
  res.locals.error = req.flash('error');
  res.locals.user = req.user;
  next();
});


// utilizzo base middleware
// app.use((req,res,next)=>{
//   req.sal='ciao';
//   next();
// });
// app.get('/',(req,res)=>{
//   res.send(req.sal);
// });

// route index
app.get('/',(req,res)=>{
  const title = 'Benvenuto';
  res.render('index',{title: title});
});

// route  info
app.get('/info',(req,res)=>{
  const body = 'informazioni';
  res.render('info',{body:body});
});

// route list note
app.get('/lista_note',ensureAuthenticated,(req,res)=>{
  note.find({user:req.user.id}).sort({date: 'desc'}).then(note=>{
    res.render('lista_note',{
      note:note
    });
  });
});

// route new note
app.get('/aggiungi_nota',ensureAuthenticated,(req,res)=>{
  res.render('aggiungi_nota');
});

// route login
app.get('/login',(req,res)=>{
  res.render('login');
});

// route login
app.get('/registrazione',(req,res)=>{
  res.render('registrazione');
});

// route update Nota
app.get('/modifica_nota/:id',ensureAuthenticated,(req,res)=>{
  note.findOne({
    _id: req.params.id
  })
  .then(nota=>{
    if(nota.user != req.user.id){
      req.flash('msg_err','Accesso negato');
      res.redirect('/lista_note');
    } else {
      res.render('modifica_nota',{
        nota:nota
      });
    }
  });
});

// gestisco il form per l inserimento note
app.post('/aggiungi_nota',ensureAuthenticated,(req,res)=>{
  // res.send('ok');
  // console.log(req.body);
  let err = [];
  if (!req.body.title) {
    err.push({text:'Riempi questo campo!'});
  }
  if (!req.body.body) {
    err.push({text:'Riempi questo campo!'});
  }
  if (err.length > 0) {
    res.render('aggiungi_nota',{
      err: err,
      title:req.body.title,
      body:req.body.body
    })
  }else {
    const newNote = {
      title:req.body.title,
      body:req.body.body,
      user:req.user.id
    };
    new note(newNote).save()
                      .then(note =>{
                        req.flash('msg_success','Nota aggiunta correttamente');
                        res.redirect('/lista_note');
                      });
  }
});

// gestione form update
app.post('/lista_note/:id',ensureAuthenticated,(req,res)=>{
  note.findOne({
    _id:req.params.id
  })
  .then(nota=>{
    nota.title = req.body.title;
    nota.body = req.body.body;
    nota.save()
    .then(nota=>{
      req.flash('msg_success','Nota modificata correttamente');
      res.redirect('/lista_note');
    });
  });
});

// gestione delete note
app.delete('/lista_note/:id',ensureAuthenticated,(req,res)=>{
  note.remove({
    _id: req.params.id
  })
  .then(nota=>{
    req.flash('msg_success','Nota eliminata correttamente');
    res.redirect('/lista_note');
  });
});

//gestione form registrazione
app.post('/registrazione',(req,res)=>{
  let err = [];
  if (req.body.password != req.body.confirmation_psw) {
    err.push({text: 'password non corrispondenti'});
  }
  if (req.body.password.length < 6) {
    err.push({text: 'la password deve avere almeno 6 caratteri'});
  }
  if (err.length > 0 ) {
    res.render('registrazione',{
      err:err,
      name:req.body.name,
      lastname:req.body.lastname,
      email:req.body.email,
      password:req.body.password,
      password2:req.body.confirmation_psw

    });
  }else {
    Users.findOne({email:req.body.email})
    .then(user =>{
      if (user) {
        req.flash('msg_err','mail già registrata');
        res.render('registrazione');
      }else {
        const newUser = new Users({
          name:req.body.name,
          lastname:req.body.lastname,
          email:req.body.email,
          password:req.body.password
        });
        bcrypt.genSalt(10,(err,salt)=>{
          bcrypt.hash(newUser.password,salt,(err,hash)=>{
            if (err) throw err;
            newUser.password = hash;
            newUser.save().then(user=>{
              req.flash('msg_success','Ti sei registrato');
              res.redirect('/login');
            }).catch(err=>{
              console.log(err);
              return;
            });
          });
        });
      }
    });
  }
});


// gestione form login
app.post('/login',(req,res,next)=>{
  passport.authenticate('local',{
    successRedirect:'/lista_note',
    failureRedirect:'/login',
    failureFlash:true
  })(req,res,next);
});

// gestione logout
app.get('/logout',(req,res)=>{
  req.logout();
  req.flash('msg_success','Sei disconesso');
  res.redirect('/');
})

// porta
const port = 3000;

// connessione
app.listen(port,()=>{
  console.log(`Server attivato sulla porta ${port}`);
});
