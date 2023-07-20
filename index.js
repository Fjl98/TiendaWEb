

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
const methodOverride = require('method-override');
const app = express();
const multer = require('multer');



dotenv.config();

app.use(methodOverride('_method'));


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

//const upload = multer({ dest: 'public/img/' });


// Configurar el almacenamiento de archivos con multer
const storage = multer.diskStorage({
  destination: 'public/img/', // Ruta de destino para almacenar los archivos en la carpeta "public/img"
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único con la extensión original del archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    cb(null, uniqueSuffix + extname);
  },
});

const upload = multer({ storage });


// Crear el middleware de carga de archivos

const authMiddleware = (req, res, next) => {
  // Verificar si el usuario está autenticado
  if (req.session.user) {
    // El usuario está autenticado, permitir el acceso
    next();
  } else {
    // El usuario no está autenticado, redirigir al inicio de sesión
    res.redirect('/login');
  }
};



const adminMiddleware = (req, res, next) => {
  // Verificar si el usuario está autenticado y es un administrador
  if (!req.session.user || req.session.user.Admin !== 1) {
    // Si el usuario no está autenticado o no es un administrador, redirigir a otra página o mostrar un mensaje de error

    // Agregar el console.log() aquí
    console.log(req.session.user.Admin);

    res.redirect('/login'); // Redirigir al inicio de sesión, por ejemplo
  } else {
    // El usuario es un administrador, permitir el acceso al panel de administración
    next();
  }
}; 






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
      res.render('login', { errorMessage: message, successMessage: null });
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





// Ruta para el perfil del usuario
app.get('/profile', (req, res) => {
  // Verificar si la cookie del usuario está presente
  if (req.cookies.user) {
    // Obtener los datos del usuario almacenados en la cookie
    const user = JSON.parse(req.cookies.user);
    // Obtener el nombre del usuario
    const username = user.username;
    // Obtener el estado de autenticación y privilegios de administrador
    const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
    const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
    // Obtener los productos reservados del usuario desde la base de datos
    db.query('SELECT * FROM products WHERE reserved = 1', (error, results) => {
      if (error) {
        console.error('Error al obtener los productos reservados:', error);
        res.status(500).send('Error al obtener los productos reservados');
      } else {
        // Renderizar la página del perfil del usuario con el nombre y los productos reservados
        res.render('profile', { username, products: results, isAuthenticated, isAdmin });
      }
    });
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






app.get('/productos', (req, res) => {
  db.query('SELECT * FROM products', (error, results) => {
    if (error) {
      console.error('Error al obtener los productos:', error);
      res.status(500).send('Error al obtener los productos');
    } else {
      // Verificar si la cookie del usuario está presente
      if (req.cookies.user) {
        // Obtener los datos del usuario almacenados en la cookie
        const user = JSON.parse(req.cookies.user);
        // Obtener el nombre del usuario
        const username = user.username;
        // Obtener el estado de autenticación y privilegios de administrador
        const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
        const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
        // Renderizar la página de productos con los productos obtenidos y los datos de usuario
        res.render('productos', { req, products: results, username, isAuthenticated, isAdmin });
      } else {
        // La cookie del usuario no está presente
        res.render('productos', { req, products: results, username: null, isAuthenticated: false, isAdmin: false });
      }
    }
  });
});


// Manejar la reserva de un producto
app.post('/productos/reservar/:id', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }

  const productId = req.params.id;
  const userId = req.session.user.id;

  // Obtener el userId a partir del nombre de usuario
  db.query('SELECT id FROM users WHERE username = ?', [req.session.user.username], (error, results) => {
    if (error) {
      console.error('Error al obtener el userId:', error);
      res.redirect('/productos?reserveError=true');
    } else {
      const userId = results[0].id;

      // Realizar las operaciones necesarias para guardar la reserva en la tabla "reservas"
      db.query('INSERT INTO reservas (productId, userId) VALUES (?, ?)', [productId, userId], (error, results) => {
        if (error) {
          console.error('Error al reservar el producto:', error);
          res.redirect('/productos?reserveError=true');
        } else {
          db.query('UPDATE products SET reserved = 1 WHERE id = ?', [productId], (error, results) => {
            if (error) {
              console.error('Error al actualizar el estado del producto:', error);
            }
            res.redirect(`/productos?reserveSuccess=true&productId=${productId}`);
          });
        }
      });
    }
  });
});

app.post('/productos/eliminar/:id', (req, res) => {
  const productId = req.params.id;
  
  // Realiza las operaciones necesarias para eliminar el producto reservado de la base de datos
  db.query('DELETE FROM reservas WHERE productId = ?', [productId], (error, results) => {
    if (error) {
      console.error('Error al eliminar el producto reservado:', error);
      res.redirect('/profile');
    } else {
      // Redirige al perfil del usuario después de la eliminación exitosa
      res.redirect('/profile');
    }
  });
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













// Obtener los usuarios de la base de datos
function getUsersFromDatabase(callback) {
  db.query('SELECT * FROM users', (error, results) => {
    if (error) {
      console.error('Error al obtener los usuarios:', error);
      callback([]);
    } else {
      callback(results);
    }
  });
}











 // Ruta para el panel de administración
/*  app.get('/admin', adminMiddleware, (req, res) => {
  console.log(req.session.user.Admin);
  // Obtener los usuarios de la base de datos
  getUsersFromDatabase((users) => {
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
      res.render('admin', { username, isAuthenticated, isAdmin, users });
    } else {
      // La cookie del usuario no está presente
      res.render('admin', { username: null, isAuthenticated: false, isAdmin: false, users });
    }
  });
  
}); */


app.get('/admin', adminMiddleware, (req, res) => {
  // Obtener los usuarios de la base de datos
  getUsersFromDatabase((users) => {
    // Obtener los productos de la base de datos
    db.query('SELECT * FROM products', (error, products) => {
      if (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error al obtener los productos');
      } else {
        // Verificar si la cookie del usuario está presente
        if (req.cookies.user) {
          // Obtener los datos del usuario almacenados en la cookie
          const user = JSON.parse(req.cookies.user);
          // Obtener el nombre del usuario
          const username = user.username;
          // Obtener el estado de autenticación y privilegios de administrador
          const isAuthenticated = true; // Si la cookie del usuario está presente, consideramos al usuario como autenticado
          const isAdmin = user.Admin === 1; // Verificar si el usuario tiene el rol de administrador
          // Renderizar la página de inicio con el nombre de usuario, los privilegios de administrador, usuarios y productos
          res.render('admin', { username, isAuthenticated, isAdmin, users, products });
        } else {
          // La cookie del usuario no está presente
          res.render('admin', { username: null, isAuthenticated: false, isAdmin: false, users, products });
        }
      }
    });
  });
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






 //CRUD PRODUCTOS

// Función para reemplazar barras invertidas con barras diagonales y eliminar el segmento "public"
function replaceBackslashesWithForwardSlashesAndRemovePublic(str) {
  const withoutPublic = str.replace(/\\/g, '/').replace('/public', '');
  return withoutPublic.startsWith('/') ? withoutPublic : '/' + withoutPublic; // Asegurar que la ruta comienza con una barra diagonal
}


// Ruta para cargar una imagen
app.post('/admin/upload-image', adminMiddleware, upload.single('image'), (req, res) => {
  // Aquí puedes obtener la ruta de la imagen cargada en req.file.path
  let imagePath = req.file.path;

  // Reemplazar las barras invertidas "\" por barras diagonales "/"
  imagePath = imagePath.replace(/\\/g, '/');

  // Construir la ruta para la base de datos (sin 'public/')
  const imagePathForDB = '/img/' + path.basename(imagePath);

  // Obtener otros datos del producto del cuerpo de la solicitud (formulario)
  const { name, description, price } = req.body;

  // Ahora puedes guardar la ruta de la imagen y otros datos en la base de datos
  db.query(
    'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)',
    [name, description, price, imagePathForDB],
    (error, results) => {
      if (error) {
        console.error('Error al guardar la ruta de la imagen en la base de datos:', error);
        res.status(500).send('Error al guardar la ruta de la imagen en la base de datos');
      } else {
        // Responder con una confirmación de carga exitosa
        res.status(200).send('Imagen cargada y ruta guardada exitosamente en la base de datos');
      }
    }
  );
});


// Ver detalles de un producto específico
app.get('/admin/products/:id', adminMiddleware, (req, res) => {
  const productId = req.params.id;
  // Obtener los detalles del producto desde la base de datos
  db.query('SELECT * FROM products WHERE id = ?', [productId], (error, results) => {
    if (error) {
      console.error('Error al obtener los detalles del producto:', error);
      res.status(500).send('Error al obtener los detalles del producto');
    } else {
      if (results.length > 0) {
        const product = results[0];
        res.json(product); // Enviar los detalles del producto como respuesta en formato JSON
      } else {
        res.status(404).send('Producto no encontrado');
      }
    }
  });
});



// Ruta para crear un nuevo producto
app.post('/admin/products', adminMiddleware, upload.single('image'), (req, res) => {
  const { name, description, price } = req.body;
  const imagePath = req.file ? req.file.path : undefined; // Ruta de la imagen o undefined si no se cargó ninguna imagen

  // Modificar la ruta para que comience con "/img/"
  const imageName = req.file.filename;
  const imagePathInDb = '/img/' + imageName;

  // Insertar el nuevo producto en la base de datos con la ruta modificada
  db.query(
    'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)',
    [name, description, price, imagePathInDb],
    (error, results) => {
      if (error) {
        console.error('Error al crear el nuevo producto:', error);
        res.status(500).send('Error al crear el nuevo producto');
      } else {
        res.redirect('/admin'); // Redirigir a la página de administración después de crear el producto
      }
    }
  );
});


//actualizar datos

app.put('/admin/products/:id', adminMiddleware, upload.single('image'), (req, res) => {
  const productId = req.params.id;
  const { name, description, price } = req.body;
  const image = req.file ? req.file.path : undefined; // Nueva imagen o undefined si no se cargó una nueva imagen

  // Actualizar los datos del producto en la base de datos
  const updateData = [name, description, price];
  let updateQuery = 'UPDATE products SET name = ?, description = ?, price = ?';
  
  // Si se cargó una nueva imagen, agregarla a la consulta de actualización
  if (image) {
    updateData.push(image);
    updateQuery += ', image = ?';
  }

  updateQuery += ' WHERE id = ?';

  // Ejecutar la consulta de actualización
  db.query(updateQuery, [...updateData, productId], (error, results) => {
    if (error) {
      console.error('Error al actualizar el producto:', error);
      res.status(500).send('Error al actualizar el producto');
    } else {
      res.status(200).send('Producto actualizado exitosamente');
    }
  });
});

// Eliminar un producto
app.delete('/admin/products/:id', adminMiddleware, (req, res) => {
  const productId = req.params.id;
  // Eliminar el producto de la base de datos usando el ID
  db.query('DELETE FROM products WHERE id = ?', [productId], (error, results) => {
    if (error) {
      console.error('Error al eliminar el producto:', error);
      res.status(500).send('Error al eliminar el producto');
    } else {
      res.redirect('/admin'); // Redirigir a la página de administración después de eliminar el producto
    }
  });
});









      
      // Iniciar el servidor
      app.listen(5000, () => {
        console.log('Servidor escuchando en el puerto 5000.');
      });
      

      module.exports = router;
      app.use(router);
