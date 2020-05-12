var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var query = require('./db/db.config');
var OnlineuserSQL = require('./db/onlineuser.sql');
var Onlineuser1SQL = require('./db/onlineuser1.sql');
var DoubleSQL = require('./db/doubleuse.sql');
var DuserSQL = require('./db/duser.sql');
var Onlineuser2SQL = require('./db/onlineuser2.sql');
var ChatHistorySQL = require('./db/chathistory.sql');
var userSQL = require('./db/user.sql');
const sd = require('silly-datetime');
var app = express();
var bodyParser = require('body-parser');
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
//////////////////////////////////////////////
//***********************************udp套接字连接两个服务器,实现两个服务器之间的文字传递
var udp = require('dgram');
var clientSocket = udp.createSocket('udp4');
//实现chat_server1转发给chat_server2的消息的传递
clientSocket.on('message', async function (msg, rinfo) {
  //console.log('recv %s of %d bytes from chat_server1 %s:%d\n', msg, msg.length, rinfo.address, rinfo.port);
  var mes = JSON.parse(msg);
  console.log(mes.a);
  if(mes.a==1){//服务器1有新用户注册登录
    var all2 = await query(Onlineuser2SQL.queryAll);
    for( var a = 0 ;a<all2.length;a++){
      var tosocket = socket_send(all2[a].SocketID);
      tosocket.emit('add',mes.b);
    }
  }
  if(mes.a==2){//群聊的名称、成员
    var tagname = mes.c;
    let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('tran', mes.b);
    tosocket.emit('dadd', mes.d);
  }
  if(mes.a==3){//群聊发消息
    var tagname = mes.b;
    let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('dchat message', mes.c);
  }
  if(mes.a==0) {//原本单聊的部分
  var tagname = mes.c;
  let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
  var tagid = target[0].SocketID;
  var tosocket = socket_send(tagid);
  tosocket.emit('chat message', mes);
  }
});
clientSocket.on('error', function (err) {
  console.log('error, msg - %s, stack - %s\n', err.message, err.stack);
});
clientSocket.bind(54320);
//**********************************tcp套接字实现两个聊天传输服务器chatServer的图片、视频、音频传输
var net = require("net");
var chatserver1_message = "";
var client = net.connect({ port: 8124 }, function () {
  console.log('tcp套接字已连接');
});
//监听TCP服务器chatserver1转发给TCP客户端chatserver2的信息data(chat_message1)
client.on('data', async function (data) { 
  //console.log('recv %d bytes from tcp_chat_server1\n',data.length );
  chatserver1_message = chatserver1_message + data.toString();  //多个包拼接
  if (chatserver1_message.substr(chatserver1_message.length - 1, 1) == '}') {  //接收结束
    //console.log(chatserver1_message);
    var mes = JSON.parse(chatserver1_message);
    if(mes.a==0){
    var tagname = mes.c;
    let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('chat message', mes);
    }
    if(mes.a==3){
      var tagname = mes.b;
      let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
      var tagid = target[0].SocketID;
      var tosocket = socket_send(tagid);
      tosocket.emit('dchat message', mes.c); 
    }
    chatserver1_message = ""; //每转发完一次都清空全局变量chatserver1_mseeage
  }
});
client.on('end', function () {
  console.log('client disconnected');
});

//*********************************socket.io实现前端客户与聊天转发服务器chatserver2的文字、图片、视频、音频转发
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3002);
var _ = require('underscore');
var totalonline2 = 0;
//将socket.io 附加到 http server上，当 http server 接收到 upgrade websocket 时就将请求转给 socket.io 处理。
//服务端启动一个io服务，并监听'connection'事件;每次刷新浏览器，套接字id都不同
io.on('connection', function (socket) { //这里的参数socket对应每个客户client
  totalonline2 ++;
  console.log(socket.id + ' connected,在线人数：' + totalonline2);
  socket.emit('welcome', { id: socket.id });
  socket.on('welcome', async function (pers) {
    var username = pers.name;
    var socketid = pers.socketid;
    var q = await query(OnlineuserSQL.getUserbyName,[username]);
    if(q.length == 0){
      await query(OnlineuserSQL.insert,[username,2]);
    }
    await query(Onlineuser2SQL.insert,[username,socketid]);
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
  /*  var all2 = await query(Onlineuser2SQL.queryAll);
    for( var a = 0 ;a<all2.length;a++){
      var tosocket = socket_send(all2[a].SocketID);
      tosocket.emit('add',data.name);
    }
    var abc={
      a:1,
      b:data.name,
    }
    var strdata = JSON.stringify(abc);
    clientSocket.send(strdata, 8061, "localhost");*/
  });
  socket.on('history',async function(){
    var q = await query(Onlineuser2SQL.getUserbyID,[socket.id]);
    console.log(q);
    if(q.length != 0){
      var name = q[0].UserName;
      var allsend = await query(ChatHistorySQL.getUserbyName,[name]);
      var allrev = await query(ChatHistorySQL.getUserbyToName,[name]);
      var all = allsend.concat(allrev);
      for(var i =0;i<all.length;i++){
        var str = iconv.decode(all[i].message,'UTF-8');   //将message从Array Buffer缓冲区读出为字符串
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
  socket.on('sayto', async function (data) {
    //console.log(data);
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
    }
    else{
      var abc={
        a:0,
        b:data,
        c:toname
      }
      //判读目标用户是否在此服务器，在线返回其socketid，不在则返回0
      let target = await query(Onlineuser2SQL.getUserbyName, [toname]);
      //目的用户不在此服务器，则采取二者服务器之间的udp/tcp通道发送数据给chat_server1
      if (target.length == 0) {

        var strdata = JSON.stringify(abc);
        if (type == "text") { //文本消息采用udp传输
          clientSocket.send(strdata, 8061, "localhost");
        }
        else if (type != "none") { //图片、视频、音频采用tcp传输
           //tcp客户端（chat_server2）转发消息给tcp服务端（chat_server1），由于是Tcp客户端，所以不用触发事件即可发送给tcp服务端
          client.write(strdata);
        }
      }
       //目的用户在此服务器，直接将消息传递给该用户
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
    if (type != "none") {
      var send ={
        'name':data.name,
        "mess":mess,
        "toname":toname,
        "type":type,
      } 
    var updatetimes = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    await query(ChatHistorySQL.insert, [updatetimes,data.name,data.toname[dname],data.message,data.type]);
    var all2 = await query(Onlineuser2SQL.queryAll);
    for(var i=2;i<data.peoplelist[dname][1]+2;i++){
      var tar =0;
      var tb=0;
      var online = await query(OnlineuserSQL.getUserbyName,[data.peoplelist[dname][i]]);
      if(online.length!=0){
      for(var j=0;j<all2.length;j++){
        if(data.peoplelist[dname][i]==all2[j].UserName){
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
        clientSocket.send(datastr, 8061, "localhost");
        }
        else if(type!="none"){
          client.write(datastr);
      }
      }
      if(tar==1){//在本服务器
        var tosocket = socket_send(all2[tb].SocketID);
        tosocket.emit('dchat message', send);
      } 
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
     // await query(DuserSQL.insert, [num,data[1]]);
      for(var i=2;i<data[1]+2;i++){
          var online = await query(OnlineuserSQL.getUserbyName,[data[i]]);
          if(online.length!=0){
            await query(DuserSQL.insert, [num,data[i]]);
        }
      }
    });
    socket.on('double',async function(data){//将该群的成员发送过来，逐一告诉他们要新建框架。
      var all2 = await query(Onlineuser2SQL.queryAll); 
      for(var i=2;i<data[1]+2;i++){
        var tar =0 ;
        var dd={
          a:data[i],
          b:data  
        };
          var online = await query(OnlineuserSQL.getUserbyName,[data[i]]);
          if(online.length!=0){
          for(var j=0;j<all2.length;j++){
                if(data[i]==all2[j].UserName){//如果此用户是服务器1的用户
                    tar =1;
                    break;                  
                }
              }
              if(tar ==1){
                var tosocket = socket_send(all2[j].SocketID);                        
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
                  clientSocket.send(datastr, 8061, "localhost");
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
  //每个 socket 还会触发一个特殊的 disconnect 事件
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
  socket.on('disconnect', function () {
    totalonline2--;
    var logoutuserid = socket.id;
    logout(logoutuserid);
    console.log(socket.id + ' disconnected,在线人数：' + totalonline2);
  })
});
async function logout(userid){
  var fsq = await query(Onlineuser2SQL.getUserbyID,[userid]);
  if(fsq.length != 0){
    var username = fsq[0].UserName;
    await query(OnlineuserSQL.deleteUserbyName,[username]); 
    await query(Onlineuser2SQL.deleteUserbyID,[userid]); 
  }
}
//通过socketid查询对应的socket
function socket_send(idd) {
  var toSocket = _.findWhere(io.sockets.sockets, { id: idd });
  return toSocket;
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
