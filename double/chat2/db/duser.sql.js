var DuserSQL = {
  insert: 'INSERT INTO Duser (ID,Dname) VALUES(?,?)',
  queryAll: 'SELECT * FROM Duser',
  getUserbyID: 'SELECT * FROM Doubleuse WHERE ID = ? ',
  getUserbyname: 'SELECT * FROM Doubleuse WHERE Dname = ? ',
  //getUserById: 'SELECT * FROM user WHERE ID = ? ',
};
module.exports = DuserSQL;