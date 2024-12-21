require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const collection = require('./config');  // Assuming this imports the User model
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const catalogRouter = require('./routes/catalog');
const cartRouter = require('./routes/cart');
const CatalogItem = require('./models/CatalogItem');  // Assuming this is your Catalog Item model
const Cart = require('./models/Cart');  // Assuming this is your Cart model
const Clothing = require('./models/Clothing'); // Import Clothing model

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: true
}));

// Routes for Catalog and Cart
app.use('/api', catalogRouter);
app.use('/api', cartRouter);

// Serve static files (like images) from the 'public' directory
app.use(express.static('public')); 

// Routes
app.get('/', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));
// Catalog page
app.get('/catalog', async (req, res) => {
  try {
    // Ensure the user is logged in
    if (!req.session.userId) {
      return res.redirect('/'); // Redirect to login page if not logged in
    }

    // Fetch catalog items (assuming you have a Clothing model)
    const items = await Clothing.find(); // Assuming Clothing is the model for catalog items
    res.render('catalog', { items }); // Pass items to the EJS view
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).send('An error occurred while loading the catalog.');
  }
});

// Add item to cart
/*app.post('/cart/add', async (req, res) => {
    const { clothingId, size, userId } = req.body;
    try {
        const item = await CatalogItem.findById(clothingId);
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // Add item to cart (implement logic to save in DB or session)
        const cartItem = {
            userId,
            clothingId: item._id,
            name: item.name,
            size,
            price: item.price,
            image: item.image
        };

        // Assuming you save the cart in a Cart model
        await Cart.create(cartItem);

        res.redirect('/cart');
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).send('Error adding item to cart');
    }
});*/


// Add item to cart
app.post('/cart/add', async (req, res) => {
  const { clothingId, size } = req.body;
  const userId = req.session.userId; // Get userId from session

  try {
      if (!userId) {
          return res.status(401).send('You must be logged in to add to the cart.');
      }

      // Find the item in the catalog
      const item = await Clothing.findById(clothingId);
      if (!item) {
          return res.status(404).send('Item not found.');
      }

      // Find the cart for this user
      let cart = await Cart.findOne({ userId });

      if (!cart) {
          // If no cart exists, create a new one
          cart = new Cart({ userId, items: [] });
      }

      // Check if the item already exists in the cart
      const existingItem = cart.items.find(
          item => item.clothingId.toString() === clothingId && item.size === size
      );

      if (existingItem) {
          existingItem.quantity += 1; // Increment quantity if item exists
      } else {
          cart.items.push({ clothingId, size, quantity: 1 });
      }

      // Save the updated cart
      await cart.save();

      res.redirect('/cart'); // Redirect to the cart page
  } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).send('Error adding item to cart.');
  }
});


// View Cart Route
// View Cart Route
app.get('/cart', async (req, res) => {
  const userId = req.session.userId; // Get userId from session
  try {
    if (!userId) {
      return res.redirect('/'); // Redirect to login page if not logged in
    }

    // Fetch the cart for this user
    const cart = await Cart.findOne({ userId }).populate('items.clothingId');
    if (!cart) {
      return res.status(404).send('Cart not found.');
    }

    res.render('cart', { cartItems: cart.items }); // Pass cart items to the view
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).send('Error loading cart');
  }
});

// Home page (requires login)
/*app.get('/home', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.redirect('/'); // Redirect to login if not authenticated
      }
  
      // Fetch user details
      const user = await collection.findById(req.session.userId);
      if (!user) {
        return res.status(404).send('User not found.');
      }
  
      res.render('home', { username: user.name, photo: user.photo });
    } catch (error) {
      console.error('Error fetching home page:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
});*/

// Home page (requires login)
app.get('/home', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/'); // Redirect to login if not authenticated
    }

    // Fetch user details
    const user = await collection.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Render the home page with user data (username and photo)
    res.render('home', { username: user.name, photo: user.photo });
  } catch (error) {
    console.error('Error fetching home page:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});


// Signup route
app.post('/signup', async (req, res) => {
    try {
      const { username, email, password, confirmPassword, gender } = req.body;
  
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.send('Passwords do not match. Please try again.');
      }
  
      // Check if the email is already used
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.send('Email already in use. Please choose a different email.');
      }
  
      // Check if the username is already taken
      const existingUsername = await collection.findOne({ name: username });
      if (existingUsername) {
        return res.send('Username already exists. Please choose a different username.');
      }
  
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Insert the new user into the database
      await collection.create({
        name: username,
        email: email,
        password: hashedPassword,
        gender: gender,
      });
  
      res.send('User registered successfully.');
    } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
});

// Login route
/*app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await collection.findOne({ name: username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send('Invalid username or password.');
    }

    req.session.userId = user._id; // Store user ID in session
    res.redirect('/home');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});*/

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await collection.findOne({ name: username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send('Invalid username or password.');
    }

    req.session.userId = user._id; // Store user ID in session
    res.redirect('/catalog'); // Redirect to catalog page after login
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});

app.get('/collections', async (req, res) => {
  try {
    // Fetch all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Extract collection names
    const collectionNames = collections.map((col) => col.name);

    // Send collection names as JSON response
    res.json(collectionNames);
  } catch (error) {
    console.error('Error fetching collections:', error);
    // Send error response if there is an issue
    res.status(500).send('Error fetching collections');
  }
});
// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Create upload directory if not exists
if (!fs.existsSync('./public/uploads')) fs.mkdirSync('./public/uploads');

// Photo upload route
app.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.session.userId) return res.status(400).send('You must be logged in to upload a photo.');

    const user = await collection.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found.');

    user.photo = `/uploads/${req.file.filename}`;
    await user.save();

    res.send('Photo uploaded successfully!');
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).send('Error uploading photo.');
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
