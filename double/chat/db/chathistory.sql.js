var ChatHistorySQL = {
    insert: 'INSERT INTO ChatHistory (Time,name,toname,message,type) VALUES(?,?,?,?,?)',
    queryAll: 'SELECT * FROM ChatHistory',
    getUserbyName: 'SELECT * FROM ChatHistory WHERE name = ? ',
    getUserbyToName: 'SELECT * FROM ChatHistory WHERE toname = ? ',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = ChatHistorySQL;