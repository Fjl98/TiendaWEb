

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./routes/db');
const router = express.Router();
const auth = require('./controllers/auth')
const cookieParser = require('cookie-parser');
const app = express();




dotenv.config();


app.use(cookieParser());
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: true,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});







app.get('/register', (req, res) => {
  res.render('register', { errorMessage: null, successMessage: null });
});

// Manejador de registro
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Llama a la función de registro en auth.js
  auth.register(username, password, email)
    .then((result) => {
      res.render('register', { errorMessage: null, successMessage: result.message });
    })
    .catch((error) => {
      res.render('register', { errorMessage: error, successMessage: null });
    });
});

// Página de inicio de sesión
app.get('/login', (req, res) => {

  // Renderizar la página de inicio de sesión con los mensajes de éxito y error
  res.render('login', { errorMessage: null, successMessage: null });
});





// Ruta para el inicio de sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const { success, message } = await auth.login(username, password, res, req);

    if (success) {
      // Inicio de sesión exitoso
      // Redirige al perfil del usuario
      res.redirect('/profile');
    } else {
      // Inicio de sesión fallido
      // Mostrar mensaje de error en la página de inicio de sesión
      res.render('login', { errorMessage: message });
    }
  } catch (error) {
    // Error al procesar la solicitud de inicio de sesión
    // Mostrar mensaje de error en la página de inicio de sesión
    res.render('login', { errorMessage: 'Error al procesar la solicitud de inicio de sesión' });
  }
});

// Ruta para el cierre de sesión
app.get('/logout', (req, res) => {
  auth.logout(res);
  // Redirige a la página de inicio de sesión u otra página deseada
  res.redirect('/login');
});



// Middleware para verificar la autenticación del usuario
const authMiddleware = (req, res, next) => {
  // Verificar si el usuario está autenticado
  if (req.session.user || req.cookies.user) {
    // El usuario está autenticado, continuar con la siguiente ruta
    next();
  } else {
    // El usuario no está autenticado, redirigir al inicio de sesión
    res.redirect('/login');
  }
};







// Ruta para renderizar la plantilla index.ejs


const adminMiddleware = (req, res, next) => {
  // Verificar si el usuario está autenticado y es un administrador
  if (!req.session.user || req.session.user.Admin !== 1) {
    // Si el usuario no está autenticado o no es un administrador, redirigir a otra página o mostrar un mensaje de error
    res.redirect('/login'); // Redirigir al inicio de sesión, por ejemplo
  } else {
    // El usuario es un administrador, permitir el acceso al panel de administración
    next();
    
  }
};


// Ruta para el perfil del usuario
app.get('/profile', (req, res) => {
  // Verificar si la cookie del usuario está presente
  if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username; // Usa user.username en lugar de user.name
    // Renderizar la página del perfil del usuario con el nombre
    res.render('profile', { username });
  } else {
    // La cookie del usuario no está presente, redirigir al inicio de sesión
    res.redirect('/login');
  }
});



// Ruta para la página de inicio
app.get('/', (req, res) => {
  // Verificar si la cookie del usuario está presente
  if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username;
    // Obtener el estado de autenticación y privilegios de administrador
    const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
    const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
    // Renderizar la página de inicio con el nombre de usuario y los privilegios de administrador
    res.render('index', { username, isAuthenticated, isAdmin });
  } else {
    // La cookie del usuario no está presente
    res.render('index', { username: null, isAuthenticated: false, isAdmin: false });
  }
});







// Ruta para el panel de administración
app.get('/admin', adminMiddleware, (req, res) => {
   // Verificar si la cookie del usuario está presente
   if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username;
    // Obtener el estado de autenticación y privilegios de administrador
    const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
    const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
    // Renderizar la página de inicio con el nombre de usuario y los privilegios de administrador
    res.render('admin', { username, isAuthenticated, isAdmin });
  } else {
    // La cookie del usuario no está presente
    res.render('admin', { username: null, isAuthenticated: false, isAdmin: false });
  }
});


app.get('/productos', (req, res) => {
   // Verificar si la cookie del usuario está presente
   if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username;
    // Obtener el estado de autenticación y privilegios de administrador
    const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
    const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
    // Renderizar la página de inicio con el nombre de usuario y los privilegios de administrador
    res.render('productos', { username, isAuthenticated, isAdmin });
  } else {
    // La cookie del usuario no está presente
    res.render('productos', { username: null, isAuthenticated: false, isAdmin: false });
  }
});

app.get('/galeria', (req, res) => {
   // Verificar si la cookie del usuario está presente
   if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username;
    // Obtener el estado de autenticación y privilegios de administrador
    const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
    const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
    // Renderizar la página de inicio con el nombre de usuario y los privilegios de administrador
    res.render('galeria', { username, isAuthenticated, isAdmin });
  } else {
    // La cookie del usuario no está presente
    res.render('galeria', { username: null, isAuthenticated: false, isAdmin: false });
  }
});

//CRUD USUARIOS

// Mostrar todos los usuarios
router.get('/admin/users', adminMiddleware, (req, res) => {
  db.query('SELECT * FROM users', (error, results) => {
    if (error) {
      console.error('Error al obtener los usuarios:', error);
      res.status(500).send('Error al obtener los usuarios');
    } else {
      res.render('admin', { users: results });
    }
  });
});

// Mostrar un usuario específico
router.get('/admin/users/:id', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      console.error('Error al obtener el usuario:', error);
      res.status(500).send('Error al obtener el usuario');
    } else {
      if (results.length > 0) {
        res.render('user', { user: results[0] });
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    }
  });
});

// Crear un nuevo usuario
router.post('/admin/users', adminMiddleware, (req, res) => {
  const { username, password, email } = req.body;
  // Verificar si el usuario ya existe en la base de datos
  db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error('Error al verificar el usuario:', error);
      res.status(500).send('Error al verificar el usuario');
    } else {
      if (results.length > 0) {
        res.status(409).send('El usuario ya existe. Por favor, elige otro nombre de usuario.');
      } else {
        // Encriptar la contraseña antes de guardarla en la base de datos
        bcrypt.hash(password, 10, (error, hash) => {
          if (error) {
            console.error('Error al encriptar la contraseña:', error);
            res.status(500).send('Error al encriptar la contraseña');
          } else {
            // Insertar el nuevo usuario en la base de datos
            db.query('INSERT INTO users (username, password, email, Admin) VALUES (?, ?, ?, false)', [username, hash, email], (error, results) => {
              if (error) {
                console.error('Error al registrar el usuario:', error);
                res.status(500).send('Error al registrar el usuario');
              } else {
                res.status(201).send('¡Registro exitoso! El usuario ha sido creado.');
              }
            });
          }
        });
      }
    }
  });
});


// Actualizar un usuario existente
router.put('/admin/users/:id', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  const { username, password, email } = req.body;
  // Verificar si el usuario existe en la base de datos
  db.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      console.error('Error al verificar el usuario:', error);
      res.status(500).send('Error al verificar el usuario');
    } else {
      if (results.length > 0) {
              // El usuario existe, actualizar los datos
              const user = results[0];
              // Encriptar la contraseña antes de guardarla en la base de datos
              bcrypt.hash(password, 10, (error, hash) => {
                if (error) {
                  console.error('Error al encriptar la contraseña:', error);
                  res.status(500).send('Error al encriptar la contraseña');
                } else {
                  // Actualizar los datos del usuario en la base de datos
                  db.query('UPDATE users SET username = ?, password = ?, email = ? WHERE id = ?', [username, hash, email, userId], (error, results) => {
                    if (error) {
                      console.error('Error al actualizar el usuario:', error);
                      res.status(500).send('Error al actualizar el usuario');
                    } else {
                      res.status(200).send('Usuario actualizado exitosamente');
                    }
                  });
                }
              });
            } else {
              res.status(404).send('Usuario no encontrado');
            }
          }
        });
      });


      // Eliminar un usuario
router.delete('/admin/users/:id', adminMiddleware, (req, res) => {
  const userId = req.params.id;
  // Verificar si el usuario existe en la base de datos
  db.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      console.error('Error al verificar el usuario:', error);
      res.status(500).send('Error al verificar el usuario');
    } else {
      if (results.length > 0) {
        // El usuario existe, eliminarlo de la base de datos
        db.query('DELETE FROM users WHERE id = ?', [userId], (error, results) => {
          if (error) {
            console.error('Error al eliminar el usuario:', error);
            res.status(500).send('Error al eliminar el usuario');
          } else {
            res.status(200).send('Usuario eliminado exitosamente');
          }
        });
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    }
  });
});

      







      
      // Iniciar el servidor
      app.listen(5000, () => {
        console.log('Servidor escuchando en el puerto 5000.');
      });
      

      module.exports = router;
