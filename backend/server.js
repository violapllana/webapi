require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const sequelize = require('./db');
const User = require('./models/user');
const contactRoutes = require('./routes/contactRoutes');
const postRoutes = require('./routes/postRoutes');
const ContactForm = require('./models/contactform'); // Modifiko sipas strukturës së projektit
const { createItem, getItems, updateItem, deleteItem } = require('./controller/itemController');
const { createSponsor, getSponsors, updateSponsor, deleteSponsor } = require('./controller/sponsorController');
const { createParticipant, getParticipants, updateParticipant, deleteParticipant } = require('./controller/participantController');
const app = express();
const path = require('path');
const fs = require('fs');
const Post = require('./models/post'); // Importo modelin "Post"
const multer = require('multer');
const router = express.Router();  // Krijohet instanca e router-it

//Performanca e aplikacionit
//Chaching with redis 
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379, // Default Redis port
});

client.on('error', (err) => {
  console.log('Redis error:', err);
});

// Cache middleware to store and retrieve data
const cache = (req, res, next) => {
  const { id } = req.params;
  client.get(id, (err, data) => {
    if (err) throw err;
    if (data != null) {
      return res.json(JSON.parse(data)); // Return cached data
    }
    next(); // Proceed if data not found in cache
  });
};

// Example of caching the response for fetching posts
app.get('/posts/:id', cache, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Cache the result before sending it to the client
    client.setex(id, 3600, JSON.stringify(post)); // Cache for 1 hour (3600 seconds)
    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

//Load Balancing 
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length; // Number of CPU cores

if (cluster.isMaster) {
  // Fork workers based on the number of CPU cores
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Worker processes handle the HTTP requests
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}


// Configure session middleware with secure settings
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Configure Helmet extra security headers
app.use(helmet());

// Configure rate limiting for DDoS protection


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100, // Limiti për numrin e kërkesave
  message: 'Përshpejtimi i kërkesave është i kufizuar!'
});
app.use(limiter);


// Configure body parser and CORS
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');  // or 'cross-origin' based on your scenario
  next();
});

const corsOptions = {
  origin: 'http://localhost:3000', // Lejo kërkesa nga frontend-i
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
};
app.use(cors(corsOptions));

// Middleware shtesë për të vendosur header-a të veçantë
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Lejo cookies në frontend
  next();
});
app.use(express.static('public'));
app.use(bodyParser.json());

// Logging middleware to debug session and user
app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});

// Configure passport for local authentication
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return done(null, false, { message: 'Përdoruesi nuk u gjet.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Fjalëkalimi është i gabuar.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to ensure the user is authenticated
const isAuthenticated = (req, res, next) => {
  const token = req.cookies['ubtsecured'];
  if (!token) {
    return res.status(401).json({ error: 'Kërkohet autentifikimi.' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token i pavlefshëm.' });
    }
    req.user = user;
    next();
  });
};

// Auth route for login
app.post('/login', (req, res, next) => {
  // Kontrollo nëse përdoruesi është tashmë i kyçur
  if (req.isAuthenticated()) {
    return res.status(400).json({ message: 'Jeni tashmë të kyçur!' });
  }

  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Login i dështuar. Provoni përsëri.' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'supersecret', {
        expiresIn: '24h'
      });
      res.cookie('ubtsecured', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
      });
      // Redirect based on role
      if (user.role === 'admin') {
        return res.status(200).json({ message: 'Login i suksesshëm', redirect: '/dashboard', user });
      } else {
        return res.status(200).json({ message: 'Login i suksesshëm', redirect: '/', user });
      }
    });
  })(req, res, next);
});

app.post('/users', isAuthenticated, async (req, res) => {
  const { username, password, role } = req.body; // Sigurohuni që këto fushat të dërgohen

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hash,
      role, // Rol default ose i specifikuar (user/admin)
    });
    res.status(201).json(newUser); // Kthe përdoruesin e krijuar
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Dështoi krijimi i përdoruesit.' });
  }
});
// Route to get the logged-in user's information
app.get('/users', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Për këtë kërkesë kërkohet rol administratori.' });
    }
    const users = await User.findAll(); // Merr të gjithë përdoruesit nga databaza
    res.status(200).json(users); // Kthe listën e përdoruesve
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Dështoi marrja e përdoruesve.' });
  }
});

app.get('/user', isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

app.delete('/users/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Për këtë kërkesë kërkohet rol administratori.' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Përdoruesi nuk u gjet.' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Përdoruesi u fshi me sukses.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Dështoi fshirja e përdoruesit.' });
  }
});
app.put('/users/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Për këtë kërkesë kërkohet rol administratori.' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Përdoruesi nuk u gjet.' });
    }

    if (username) user.username = username;
    if (role) user.role = role;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).json(user); // Return updated user data
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Dështoi përditësimi i përdoruesit.' });
  }
});

// Registration route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash, role: 'user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  res.clearCookie('ubtsecured', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'U çkyçët me sukses.' });
  });
});


// CRUD routes for items
app.post('/items', isAuthenticated, createItem);
app.get('/items', isAuthenticated, getItems);
app.put('/items/:id', isAuthenticated, updateItem);
app.delete('/items/:id', isAuthenticated, deleteItem);

// CRUD për sponsorët
app.post('/sponsors', isAuthenticated, createSponsor);
app.get('/sponsors', isAuthenticated, getSponsors);
app.put('/sponsors/:id', isAuthenticated, updateSponsor);
app.delete('/sponsors/:id', isAuthenticated, deleteSponsor);

// CRUD për pjesëmarrësit 
app.post('/participants', isAuthenticated, createParticipant); 
app.get('/participants', isAuthenticated, getParticipants); 
app.put('/participants/:id', isAuthenticated, updateParticipant); 
app.delete('/participants/:id', isAuthenticated, deleteParticipant); 

app.use('/posts', postRoutes);
app.use(cors());

app.use(express.json()); 
app.use('/contact', contactRoutes);
app.post('/contact', async (req, res) => {
  try {
    const { emri, email, mesazhi } = req.body;
    if (!emri || !email || !mesazhi) {
      return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme.' });
    }

    const newContact = await ContactForm.create({ emri, email, mesazhi });
    res.status(201).json({ message: 'Mesazhi u ruajt me sukses.', contact: newContact });
  } catch (error) {
    console.error('Gabim gjatë ruajtjes së të dhënave:', error);
    res.status(500).json({ error: 'Dështoi ruajtja e mesazhit.' });
  }
});



app.use('/api', router);  // Kjo lidh rrugët e router-it me /api

app.use(express.urlencoded({ extended: true }));

// Kontrollo ekzistencën e dosjes "uploads" dhe krijo nëse mungon
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ruta për të krijuar postime me imazhe
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});


const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Format i skedarit i pavlefshëm!'), false);
    }
    cb(null, true);
  }
});



app.post('/add-post', upload.single('image'), async (req, res) => {
  try {
      const { title, content } = req.body;
      const image = req.file ? req.file.filename : null; // Definoni image nga req.file
      const imageURL = image ? `http://localhost:5000/uploads/${image}` : null;

      console.log('Generated image URL:', imageURL);

      // Ruajtje në databazë
      const newPost = await Post.create({
          title,
          content,
          imageURL, // Shto URL-në në databazë
      });

      res.status(201).json(newPost);
  } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Failed to create post' });
  }
});
app.get('/api/posts', async (req, res) => {
  try {
    // Merrni të gjitha postimet nga databaza
    const posts = await Post.findAll();
    res.json(posts); // Kthejmë postimet nga databaza
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Dështoi marrja e postimeve.' });
  }
});

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Database sync failed:', error));


// Initialize server and ensure database and table creation
const initializeDatabase = async () => {
  try {
    await sequelize.sync();
    app.listen(process.env.PORT, () => {
      console.log(`Serveri po punon në portin ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('Gabim gjatë inicializimit të databazës:', error);
  }
};

initializeDatabase();
