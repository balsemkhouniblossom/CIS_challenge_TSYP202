const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Database connection
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('DB connected!'))
    .catch(error => console.error('Database connection error:', error));

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files (like CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the dashboard
app.get('/', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        res.render('dashboard', { collections: collectionNames });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).send('Error fetching collections');
    }
});

// Route to display items from a collection
app.get('/collection/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const collection = mongoose.connection.db.collection(name);
        const items = await collection.find().toArray();

        res.render('collection', { name, items });
    } catch (error) {
        console.error(`Error fetching data from ${name}:`, error);
        res.status(500).send(`Error fetching data from ${name}`);
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
