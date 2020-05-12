var UserSQL = {
    insert: 'INSERT INTO user (UserName, Password, Role) VALUES(?,?,?)',
    queryAll: 'SELECT * FROM user',
    getUserbyName: 'SELECT * FROM user WHERE UserName = ? ',
    deleteUserbyName:'DELETE FROM user WHERE UserName = ?',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = UserSQL;