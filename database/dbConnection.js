const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mercadopereferico',
    port: 3306,
})

connection.connect((error) => {
    error ? console.log('Algo Salio mal ', error) : console.log('Conexión Exitosa');
})

module.exports = connection