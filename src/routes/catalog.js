const express = require('express');
const router = express.Router();
const Clothing = require('../models/Clothing');

// Route pour récupérer le catalogue
router.get('/catalog', async (req, res) => {
    try {
        const clothingItems = await Clothing.find({});
        res.json(clothingItems);
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).send('Error fetching catalog.');
    }
});

module.exports = router;
