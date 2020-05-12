var friname = new Array();
var socket = io.connect('http://localhost:3000');
socket.emit('welcome', "hello");
socket.on("welcome",function(data){
    var table = document.getElementById("sbsb");
    for(var i =0;i<data.length;i++){
        var tr1 = document.createElement("tr");
        var th1 = document.createElement("th");
        th1.innerText = data[i].UserName;
        var th2 = document.createElement("th");
        th2.innerText = data[i].Password;
        var th3 = document.createElement("th");
        var but = document.createElement("button");
        but.setAttribute("onclick","deletea("+i+")");
        but.innerText = "删除";
        th3.appendChild(but);
        tr1.appendChild(th1);
        tr1.appendChild(th2);
        tr1.appendChild(th3);
        table.appendChild(tr1);
        friname.push(data[i].UserName);
    }
});
function deletea(r){
    socket.emit("delete",friname[r]);
    socket.on("delete",function(mess){
        alert(mess);
    });
}
function logout(){
    socket.close();
    window.location.href = '/logout';
}