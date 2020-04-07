module.exports = {
    "mysqlDS": {
        "host": process.env.MYSQL_HOST,
        "port": process.env.MYSQL_PORT,
        "database": process.env.MYSQL_DATABASE,
        "password": process.env.MYSQL_PASSWORD,
        "name": "mysqlDS",
        "user": process.env.MYSQL_USER,
        "connector": "mysql"
      }
};  