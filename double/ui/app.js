//express框架最基本系统的配置
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var indexRouter = require('./routes/index');
var dataRouter = require('./routes/data');
var query = require('./db/db.config');
var OnlineuserSQL = require('./db/onlineuser.sql');
var userSQL = require('./db/user.sql');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3000);
io.on('connection',function (socket) {
  socket.on('welcome', async function (data) {
    var alluser = await query(userSQL.queryAll);
    socket.emit('welcome',alluser);
  });
  socket.on('delete',async function (name){
    var online = await query(OnlineuserSQL.getUserbyName,[name]);
    var isuser = await query(userSQL.getUserbyName,[name]);
    //console.log(online);
    if(isuser.length == 0){
      socket.emit('delete',"该用户不存在！");
    }
    else if(online.length == 0){  //该用户存在，看其是否在线
      var q = await query(userSQL.deleteUserbyName,[name]);
      socket.emit('delete',"删除成功");
    }
    else{
      socket.emit('delete',"删除失败，该用户在线！");
    }
  });
  socket.on('disconnect',async function () {
    var username ="admin";
    await query(OnlineuserSQL.deleteUserbyName,[username]); 
  });
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'123456',
  cookie:{
    maxAge:30*24*60*1000
  },
  resave:true,
  saveUninitialized:true,
}));

app.use('/', indexRouter);
app.use('/data',dataRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
