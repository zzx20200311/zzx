var DoubleuseSQL = {
  insert: 'INSERT INTO Doubleuse (ID,UserName) VALUES(?,?)',
  queryAll: 'SELECT * FROM Doubleuse',
  getUserbyID: 'SELECT * FROM Doubleuse WHERE ID = ? ',
  getUserbyname: 'SELECT * FROM Doubleuse WHERE UserName = ? ',
  //getUserById: 'SELECT * FROM user WHERE ID = ? ',
};
module.exports = DoubleuseSQL;