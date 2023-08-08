const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DATABASE,
})

connection.connect((error) => {
    error ? console.log('Algo Salio mal ', error) : console.log('Conexión Exitosa');
})

module.exports = connection