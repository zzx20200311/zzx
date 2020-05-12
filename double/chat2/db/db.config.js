const mysql = require('mysql')
//创建连接词
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'chatsystem',
    password: '123456',
    database: 'chatsystem',
    port: 3306,
    timezone:"SYSTEM",
  })
  //保证客户端与服务器之间以同步方式进行
  let query = function (sql, values) {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          reject(err)
        } else {
          connection.query(sql, values, (err, rows) => {
            if (err) {
              reject(err)
            } else {
              resolve(rows)
            }
            connection.release()
          })
        }
      })
    })
  }
  
  module.exports = query