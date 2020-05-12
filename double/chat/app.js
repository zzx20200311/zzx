var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var bodyParser = require('body-parser');
var query = require('./db/db.config');
var OnlineuserSQL = require('./db/onlineuser.sql');
var DoubleSQL = require('./db/doubleuse.sql');
var DuserSQL = require('./db/duser.sql');
var Onlineuser1SQL = require('./db/onlineuser1.sql');
var Onlineuser2SQL = require('./db/onlineuser2.sql');
var userSQL = require('./db/user.sql');
var ChatHistorySQL = require('./db/chathistory.sql');
const sd = require('silly-datetime');
var iconv = require('iconv-lite');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
////////////////////////////////////////////////////////////////
/*var user ={
  name:"0",
  socketid:"0"
};
var users= new Array();
for(var i=0;i<100;i++){
   users[i]=user;
}*/
////////////////////////////////////////////////////////////////
var app = express();
//************************************event事件监听机制
const EventEmitter = require('events');
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
//**********************************UDPserver实现两个chatserver之间的文字通讯
var udp = require('dgram');
const udp_server = udp.createSocket('udp4');
udp_server.on('close', () => {
  console.log('套接字已关闭');
});
//实现chat_server2转发给chat_server1的文字消息的传递
udp_server.on('message', async function(msg, rinfo) {
  //console.log('recv %s of %d bytes from udp_chat_server2 %s:%d\n', msg, msg.length, rinfo.address, rinfo.port);
  var mes = JSON.parse(msg);
  if(mes.a==1){//服务器1有新用户注册登录
    var all1 = await query(Onlineuser1SQL.queryAll);
    for( var a = 0 ;a<all1.length;a++){
      var tosocket = socket_send(all1[a].SocketID);
      tosocket.emit('add',mes.b);
    }
  }
  if(mes.a==2){//群聊的名称、成员;
    var tagname = mes.c;
    let target = await query(Onlineuser1SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('tran', mes.b);
    tosocket.emit('dadd', mes.d);
  }
  if(mes.a==3){//群聊发消息
    var tagname = mes.b;
    let target = await query(Onlineuser1SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('dchat message', mes.c);
  }
  if(mes.a==0){//原本单聊的部分
  var tagname = mes.a;
  let target = await query(Onlineuser1SQL.getUserbyName, [tagname]);
  var tagid = target[0].SocketID;
  var tosocket = socket_send(tagid);
  tosocket.emit('chat message', mes);
  }
});
udp_server.on('error', (err) => {
  console.log(err);
});
udp_server.on('listening', () => {
  console.log('udp套接字正在监听中...');
});
udp_server.bind('8061');

//********************************TCPserver实现两个chatserver之间的图片、视频、音频通讯
var net = require('net');
var chatserver2_message = "";
var chatserver1_message = "";
var tcp_server = net.createServer(function (socket) {    //当tcp客户端申请连接时触发该事件，并返回socket代表tcp客户端
  console.log('server connected');
  //监听来自tcp客户端chatserver2的图片、视频
  socket.on('data', async function (data) {
    chatserver2_message = chatserver2_message + data.toString();  //多个tcp报文的拼接
    //console.log('recv %d bytes from tcp_chat_server2\n',data.length );
    if (chatserver2_message.substr(chatserver2_message.length - 1, 1) == '}') {  //分多个包（65536bytes）接收，接收结束时，查询目的方并转发
      //console.log(str);
      var mes = JSON.parse(chatserver2_message);
      if(mes.a==0){
      var tagname = mes.c;
      let target = await query(Onlineuser1SQL.getUserbyName, [tagname]);
      var tagid = target[0].SocketID;
      var tosocket = socket_send(tagid);
      tosocket.emit('chat message', mes);
      }
      if(mes.a==3){
        var tagname = mes.b;
        let target = await query(Onlineuser1SQL.getUserbyName, [tagname]);
        var tagid = target[0].SocketID;
        var tosocket = socket_send(tagid);
        tosocket.emit('dchat message', mes.c); 
      }
      chatserver2_message = ""; //每转发完一次都清空全局变量chatserver2_mseeage
    }
  });
  //发送消息给tcp客户端chatserver2
  //自从与chatServer2建立tcp连接后就要监听事件：event，看chatServer1是否有需要转发给chatServer2的消息
  myEmitter.on('event',() => {
    //console.log('an event occurred!');
    socket.write(chatserver1_message);
  });
  socket.on('end', function () {
    console.log('server disconnected');
  });
});
tcp_server.listen(8124, function () { //'listening' listener
  console.log('tcp套接字正在监听中..');
});
//****************************************socket.io实现前端客户与聊天转发服务器chatserver1的文字、图片、视频、音频通信
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3001);
var _ = require('underscore');
var totalonline1 = 0;
//将socket.io 附加到 http server上，当 http server 接收到 upgrade websocket 时就将请求转给 socket.io 处理。
//服务端启动一个io服务，并监听'connection'事件;每次刷新浏览器，套接字id都不同
io.on('connection', async function (socket) { //这里的参数socket对应每个客户client
  totalonline1 ++;
  console.log(socket.id + ' connected,在线人数：' + totalonline1);
  socket.emit('welcome', { id: socket.id });
  socket.on('welcome', async function (pers) {
    var username = pers.name;
    var socketid = pers.socketid;
    var q = await query(OnlineuserSQL.getUserbyName,[username]);
    if(q.length == 0){  //在登陆表中没找到该用户
      await query(OnlineuserSQL.insert,[username,1]);
    }
    await query(Onlineuser1SQL.insert,[username,socketid]);
    console.log("welcome");
  });
  socket.on('friendadd',async function(data){
    var dnum=0;
    var allfriend = await query(userSQL.queryAll);
    var iiii={
      a:"0",
      b:allfriend
    }
    socket.emit('friend',iiii);
    var user=new Array();
    var aaa=0;
    var au={
        a:"1",
        b:user,
    }
    var alldouble = await query(DoubleSQL.queryAll);
    var alluser = await query(DuserSQL.queryAll);
    for(var i=0;i<alluser.length;i++){
      if(alluser[i].Dname==data.name){
        var ii=alluser[i].ID;
        for(var iii=0;iii<alldouble.length;iii++){
          if(alldouble[iii].ID==ii){
             au.b[dnum++]=alldouble[iii].UserName;
          }
        }
      }
    }
    socket.emit('friend2',au);
   /* var all1 = await query(Onlineuser1SQL.queryAll);
    for( var a = 0 ;a<all1.length;a++){
       var tosocket = socket_send(all1[a].SocketID);
       tosocket.emit('add',data.name);
    }
   var abc={
     a:1,
     b:data.name,
   }
   var datastr = JSON.stringify(abc);
   udp_server.send(datastr, 54320, "localhost");*/
  });
  socket.on('onlineadd',async function(data){

  });
  socket.on('history',async function(){
    var q = await query(Onlineuser1SQL.getUserbyID,[socket.id]);
    //console.log(q);
    if(q.length != 0){
      var name = q[0].UserName;
      var allsend = await query(ChatHistorySQL.getUserbyName,[name]);
      var allrev = await query(ChatHistorySQL.getUserbyToName,[name]);
      var all = allsend.concat(allrev);
      for(var i =0;i<all.length;i++){
        var str = iconv.decode(all[i].message,'UTF-8');
        all[i].message = str;
        //console.log(str);
      }
      socket.emit('findhis',all); 
    }
    else{
      socket.emit('findhis',"null");
    }
  });
///////////////////////////////////////////////////////////////////////////
socket.on('start',async function(){
  var allfriend = await query(userSQL.queryAll);
  socket.emit('dstart',allfriend);
});
///////////////////////////////////////////////////////////////////////////
var sname = 0;//单聊单独传过来一个数据为了联系。
socket.on ('sname',function(data){
     sname=data;
});
  socket.on('sayto',async function (data) {
    chatserver1_message = "";
    var toname = data.toname[sname];
    var type = data.type;
    //查询数据库登录表，查看目标用户是否在线
    var online = await query(OnlineuserSQL.getUserbyName,[toname]);
    var updatetimes = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    await query(ChatHistorySQL.insert, [updatetimes,data.name,data.toname[sname],data.message,data.type]);
    if(online.length == 0){
      var b={
        name:"server",
        message:"该用户不在线，请稍后再试！",
      }
      var a={
        b:b,
        c:toname
      }
      socket.emit('chat message', a);
      await query(ChatHistorySQL.insert, [updatetimes,"server",data.name,"该用户不在线，请稍后再试！","text"]);
      //Time,name,toname,Status,message,type
    }
    else{
      var abc={
        a:0,
        b:data,
        c:toname
      }
      var datastr = JSON.stringify(abc);
      let target = await query(Onlineuser1SQL.getUserbyName, [toname]);
      //该用户不在此服务器，则采取二者服务器之间的udp/tcp通道发送数据给chat_server2
      if (target.length == 0) {  
        if (type == "text") { //采用udp通道
          udp_server.send(datastr, 54320, "localhost");//////////////////////////////////注意对应的分解函数让我换了
        }
        else if (type != "none") {  //采用tcp通道
          //chatServer1在有消息要通过TCPserver传递给chatServer2时，触发event事件
          chatserver1_message = datastr;
          myEmitter.emit('event');
        }
      }
      //该用户在此服务器，直接通过socket.io将消息传递给该用户
      else { 
        // nodejs的underscore扩展中的findWhere方法，可以在对象集合中，通过对象的属性值找到该对象并返回。
        //服务器能接收到所有用户发的消息，只要改消息有toname并且可以找到，服务器就能转发给对应用户
        toid = target[0].SocketID;
        var toSocket = socket_send(toid);
        if (type != "none") {
          var s ={
            a:0,
            b:data,
            c:toname
          }
          console.log(s.b.name);
          toSocket.emit('chat message', s);  
        }
      }
    }
  });
  ///////////////////////////////////////////////////////////
  var dname = 0;//单聊单独传过来一个数据为了联系。
  socket.on ('dname',function(data){
       dname=data;
  });
 
  socket.on('dsayto',  async function (data) {
    chatserver1_message = "";
    var toname = data.toname[dname];
    var type = data.type;
    var mess = data.message;
    var send ={
      'name':data.name,
      "mess":mess,
      "toname":toname,
      "type":type,
    }  
    var updatetimes = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    await query(ChatHistorySQL.insert, [updatetimes,data.name,toname,data.message,data.type]);
    var all1 = await query(Onlineuser1SQL.queryAll);
    for(var i=2;i<data.peoplelist[dname][1]+2;i++){
      var tar =0;
      var tb=0;
      var online = await query(OnlineuserSQL.getUserbyName,[data.peoplelist[dname][i]]);
      if(online.length!=0){
      for(var j=0;j<all1.length;j++){
        if(data.peoplelist[dname][i]==all1[j].UserName){
          tar =1;
          tb=j;
          //var tosocket = socket_send(all1[j].SocketID);               
          break;
        }
      }  
      if(tar==0){//不在本服务器
          var d23={
            a:3,
            b:data.peoplelist[dname][i],
            c:send,
          }
        var datastr = JSON.stringify(d23);
        if(type=="text"){//如果是文本文件
        udp_server.send(datastr, 54320, "localhost");
      }
      else if(type!="none"){
          chatserver1_message=datastr;
          myEmitter.emit('event');
          chatserver1_message="";
      }
      }
      if(tar==1){//在本服务器
        var tosocket = socket_send(all1[tb].SocketID);
        tosocket.emit('dchat message', send);
      } 
    }
  }
  });
  ///////////////////////////////////////////////////////////
  var name =0;  
  //var dpeople = new Array();
  socket.on('name',function(data){//通过简单地方式，把群名称发过来
          name = data;
    });
  socket.on('ddouble',async function(data){
    var A=Math.random();
    var B=Math.random();
    var C=Math.random();
    var D=Math.random();
    var E=Math.random();
    var num=A*10000+B*1000+C*100+D*10+E;
    await query(DoubleSQL.insert, [num,name]);
    //await query(DuserSQL.insert, [num,data[1]]);
    for(var i=2;i<data[1]+2;i++){
        var online = await query(OnlineuserSQL.getUserbyName,[data[i]]);
        if(online.length!=0){
          await query(DuserSQL.insert, [num,data[i]]);
      }
    }
  });
  socket.on('double',async function(data){//将该群的成员发送过来，逐一告诉他们要新建框架。    
      var all1 = await query(Onlineuser1SQL.queryAll); 
      for(var i=2;i<data[1]+2;i++){
        var tar =0 ;
        var dd={
          a:data[i],
          b:data  
        };
          var online = await query(OnlineuserSQL.getUserbyName,[data[i]]);
          if(online.length!=0){
          for(var j=0;j<all1.length;j++){
                if(data[i]==all1[j].UserName){//如果此用户是服务器1的用户
                    tar =1;
                    break;                  
                }
              }
              if(tar ==1){
                var tosocket = socket_send(all1[j].SocketID);   //这里将来可能会有问题，你仔细看J                     
                      tosocket.emit('tran',data[0]);
                      tosocket.emit('dadd',dd);
              }
              if(tar==0){//此用户不是服务器1的用户
                  var d21={//发给服务器二的数据
                    a:2,
                    b:data[0],
                    c:"none",
                    d:dd,
                  }
                  d21.c=data[i];
                  var datastr = JSON.stringify(d21);
                  udp_server.send(datastr, 54320, "localhost");
                }
          }
          else{//系统提示该用户不在线  
            var a={
                toname:name,
                mess:"用户"+data[i]+"不在线,未能成功加入群聊！",
                name:"系统提示：",
                type:"text"
            }
            socket.emit('dchat message',a);
          }
        }
   });
  socket.on('doubleperson',async function(data){
    var alldouble = await query(DoubleSQL.queryAll);
    var alluser = await query(DuserSQL.queryAll);
    var user=new Array();
    var b=0;
    var id=0;
    for(var a=0;a<alldouble.length;a++){
       if(alldouble[a].UserName==data){
          id=alldouble[a].ID;
          break;
       }
    }
    for(var i=0;i<alluser.length;i++){
      if(alluser[i].ID==id){
        user[b++]=alluser[i].Dname;
      }
    }
    socket.emit('dperson',user);
  });
  socket.on('disconnect',function (){
    totalonline1 --;
    var logoutuserid = socket.id;
    logout(logoutuserid);
    console.log(socket.id + ' disconnected,在线人数：' + totalonline1);
  })
});
async function logout(userid){
  var fsq = await query(Onlineuser1SQL.getUserbyID,[userid]);
  var username = fsq[0].UserName;
  await query(OnlineuserSQL.deleteUserbyName,[username]); 
  await query(Onlineuser1SQL.deleteUserbyID,[userid]); 
}
//通过socketid查找对应的socket
function socket_send(idd) {
  var toSocket = _.findWhere(io.sockets.sockets, { id: idd });
  return toSocket;
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use('/', indexRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
