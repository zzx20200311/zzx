var OnlineUser2SQL = {
    insert: 'INSERT INTO onlineuser2 (UserName,SocketID) VALUES(?,?)',
    queryAll: 'SELECT * FROM onlineuser2',
    getUserbyName: 'SELECT * FROM onlineuser2 WHERE UserName = ? ',
    deleteUserbyName:'DELETE FROM onlineuser2 WHERE UserName=?',
    deleteUserbyID:'DELETE FROM onlineuser2 WHERE SocketID=?',
    getUserbyID:'SELECT * FROM onlineuser2 WHERE SocketID=?',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = OnlineUser2SQL;