var express = require('express');
var router = express.Router();

router.get('/admin',function(req,res,next){

    //TODO:进一步判断是不是admin
    res.render('admin',{ user_name:req.session.user});
});
module.exports = router;