//base de datos
const mysql = require('mysql');
require('dotenv').config();
//conectamos y ponemos los datos necesarios de la base de datod de donde esta alojada
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
//mensajes por si da error o es satisfacctorio
connection.connect((error) => {
  if (error) {
    console.error('Error de conexión a la base de datos:', error);
  } else {
    console.log('Conexión exitosa a la base de datos.');
  }
});
//la exportacion de los datos para usaelo en otraspaginas
module.exports = connection;
