var OnlineUser1SQL = {
    insert: 'INSERT INTO onlineuser1 (UserName,SocketID) VALUES(?,?)',
    queryAll: 'SELECT * FROM onlineuser1',
    getUserbyName: 'SELECT * FROM onlineuser1 WHERE UserName = ? ',
    deleteUserbyName:'DELETE FROM onlineuser1 WHERE UserName=?',
    deleteUserbyID:'DELETE FROM onlineuser1 WHERE SocketID=?',
    getUserbyID:'SELECT * FROM onlineuser1 WHERE SocketID=?',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = OnlineUser1SQL;