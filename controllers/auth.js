const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const db = require('../routes/db');
const router = express.Router();

//const router = require('./routes/route');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: true,
  saveUninitialized: true,
}));


module.exports = {
  register: function(username, password, email) {
    return new Promise((resolve, reject) => {
      // Verificar si el usuario ya existe en la base de datos
      db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
          console.error('Error al verificar el usuario:', error);
          reject('Error al verificar el usuario');
        } else {
          if (results.length > 0) {
            resolve({ success: false, message: 'El usuario ya existe. Por favor, elige otro nombre de usuario.' });
          } else {
            // Encriptar la contraseña antes de guardarla en la base de datos
            bcrypt.hash(password, 10, (error, hash) => {
              if (error) {
                console.error('Error al encriptar la contraseña:', error);
                reject('Error al encriptar la contraseña');
              } else {
                // Insertar el nuevo usuario en la base de datos
                db.query('INSERT INTO users (username, password, email, Admin) VALUES (?, ?, ?, false)', [username, hash, email], (error, results) => {
                  if (error) {
                    console.error('Error al registrar el usuario:', error);
                    reject('Error al registrar el usuario');
                  } else {
                    resolve({ success: true, message: '¡Registro exitoso! Ahora puedes iniciar sesión.' });
                  }
                });
              }
            });
          }
        }
      });
    });  
  },

  login: function(username, password, res, req) {
    return new Promise((resolve, reject) => {
      // Buscar el usuario en la base de datos
      db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
          console.error('Error al buscar el usuario:', error);
          reject('Error al buscar el usuario');
        } else {
          if (results.length > 0) {
            const user = results[0];
  
            // Comparar la contraseña ingresada con la almacenada en la base de datos
            bcrypt.compare(password, user.password, (error, isMatch) => {
              if (error) {
                console.error('Error al comparar las contraseñas:', error);
                reject('Error al comparar las contraseñas');
              } else {
                if (isMatch) {
                  // Inicio de sesión exitoso
                  // Establecer una cookie para mantener la sesión activa
                  res.cookie('user', JSON.stringify(user), { httpOnly: true });
                  req.session.isLoggedIn = true;
  
                  // Verificar si el usuario es un administrador
                  if (user.Admin === 1) {
                    user.isAdmin = true;
                  } else {
                    // Si no es un administrador, puedes eliminar la propiedad isAdmin del objeto user
                    delete user.isAdmin;
                  }
  
                  req.session.user = user;
  
                  resolve({ success: true, message: 'Inicio de sesión exitoso' });
                } else {
                  resolve({ success: false, message: 'Contraseña incorrecta' });
                }
              }
            });
          } else {
            resolve({ success: false, message: 'El usuario no existe. Por favor, regístrate.' });
          }
        }
      });
    });
  },
  





  logout: function(res) {
     // Cerrar sesión eliminando la cookie del usuario
    res.clearCookie('user');
  }

};


