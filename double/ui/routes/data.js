var express = require('express');
var router = express.Router();

router.get('/admin',async function(req,res,next){
    res.render('admin',{ user_name:req.session.user});
});
module.exports = router;