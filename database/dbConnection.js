const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: process.env.PORT,
})

connection.connect((error) => {
    error ? console.log('Algo Salio mal ', error) : console.log('Conexión Exitosa');
})

module.exports = connection