var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended:false
})
//index对应的后端js实现,render函数渲染view，第二个参数是view视图需要的数据
router.get('/', function(req, res, next) {
  if(!req.session.message)
  {
    req.session.message = '';
  }
  res.render('index', { message: req.session.message });
});

router.post('/login',urlencodedParser ,function(req,res,next){
  console.log(req.body.username);
  //TODO:需要判断用户是否注册，查询数据库
  if((req.body.username == 'wxy')&&(req.body.password == '123')){
    req.session.user = req.body.username;
    req.session.message = "Login success!";
    res.redirect('/user');
  }
  else if(req.body.username == 'admin') //TODO:连接管理员数据库查询
  {
    req.session.user = req.body.username;
    res.redirect('/data/admin');
  }
  else{
    req.session.message = "Login failed!Please check your username and password!";
    res.redirect('/');
  }

});

router.get('/user',function(req,res,next){
  //TODO:
  res.render('user',{ user_name:req.session.user, message: req.session.message });
});

router.post('/register',function(req,res,next){
  req.session.message = "Register success! Now you can login!";
  //TODO:需要进行用户数据存储，需考虑用户和管理员注册的区别
  res.redirect('/');
});

router.get('/logout',function(req,res,next)
{
  req.session.user = '';
  req.session.message="Logout Success!";
  res.redirect('/');
  //TODO:删除登录用户在线信息
});

module.exports = router;
