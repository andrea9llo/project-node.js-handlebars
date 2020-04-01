module.exports = {
  ensureAuthenticated :function(req,res,next){
    if(req.isAuthenticated()){
      return next();
    }
    req.flash('msg_err', 'accesso negato');
    res.redirect('/');
  }



};
