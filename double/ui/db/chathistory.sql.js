var ChatHistorySQL = {
    insert: 'INSERT INTO ChatHistory (Time,name,toname,message,type) VALUES(?,?,?,?,?)',
    queryAll: 'SELECT * FROM ChatHistorySQL',
    getUserbyName: 'SELECT * FROM ChatHistorySQL WHERE name = ? ',
    getUserbyToName: 'SELECT * FROM ChatHistorySQL WHERE toname = ? ',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = ChatHistorySQL;