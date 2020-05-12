var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var crypto = require('crypto');
var query = require('../db/db.config');
var userSQL = require('../db/user.sql');
var OnlineuserSQL = require('../db/onlineuser.sql');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})
function sha1(data) {
  let hash = crypto.createHash('sha1');
  return hash.update(data).digest('base64');
}
//index对应的后端js实现,render函数渲染view，第二个参数是view视图需要的数据
router.get('/', function (req, res, next) {
  res.render('index', { message: req.session.message });
  req.session.message = null;
});

router.post('/login', urlencodedParser, async function (req, res, next) {
  let userName = req.body.username;
  let password = sha1(req.body.password);
  try {
    let user = await query(userSQL.getUserbyName, [userName])
    if (user.length == 0) { //该用户还未注册
      req.session.message = '用户或密码错误！'
      res.redirect('/')
    } else if ((user == "")||(password != user[0].Password)) {  //该用户已注册但密码输入错误
      req.session.message = '用户或密码错误！'
      res.redirect('/')
    } else if (user[0].Role == 1) { //管理员登录
      //解决用户重复登录的问题
      let q = await query(OnlineuserSQL.getUserbyName,[userName]);
      if(q.length == 0){  //该用户还未登录，在线用户表中未查找到
      req.session.message = '';
      req.session.user = 'admin';
      req.session.admin = true;
      await query(OnlineuserSQL.insert, [userName,0]);
      res.redirect('/data/admin');
      }
      else{
        req.session.message = '该用户已登录，请勿重复登录！';
        res.redirect('/');
      }
    } else {                     //普通用户登录
      //解决用户重复登录的问题
      let q = await query(OnlineuserSQL.getUserbyName,[userName]);
      if(q.length == 0){  //该用户还未登录，在线用户表中未查找到
      req.session.message = '';
      req.session.admin = false;
      req.session.user = req.body.username;
      res.redirect('/user');
      }
      else{ 
        req.session.message = '该用户已登录，请勿重复登录！';
        res.redirect('/')     
      }
    }
  } catch (err) {
    req.session.message = err.message;
    res.redirect('/');
  }
});

router.get('/user', async function (req, res, next) {
   //给每个成功登录的用户随机分配聊天消息转发服务器1、2
  var newUserName = req.session.user;
  var server = Math.floor(Math.random() * 2 + 1);
    try {
      await query(OnlineuserSQL.insert, [newUserName,server])
    } catch (err) {
      req.session.message = err.message;
    }
  res.render('user', { user_name: req.session.user, chat_server: server });
});

router.post('/register', async function (req, res, next) {
  var newUserName = req.body.username;
  var newPassword = sha1(req.body.password)
  console.log(newUserName);
  console.log(newPassword);
  if (newUserName == 'admin') {
    try {
      await query(userSQL.insert, [newUserName, newPassword, 1])
      req.session.message = '管理员' + req.body.username + '注册成功!'
    } catch (err) {
      req.session.message = err.message;
    }
  }
  else {
    //解决用户重复注册的问题
    let q = await query(userSQL.getUserbyName,[newUserName]);
    if(q == 0){ //在用户表中未找到相关信息，可注册
      try {
        await query(userSQL.insert, [newUserName, newPassword, 0])
        req.session.message = '用户' + req.body.username + '注册成功!'
      } catch (err) {
        req.session.message = err.message;
      }
    }
    else{
      req.session.message = "该用户已注册！请直接登录！";
    }
  }
  res.redirect('/');
});
router.get('/logout', async function (req, res, next) {
  req.session.message = "Logout Success!";
  //await query(OnlineuserSQL.deleteUserbyName,[username]);
  req.session.admin = false;
  req.session.user=  "";
  res.redirect('/');
});

module.exports = router;
