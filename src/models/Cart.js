const mongoose = require('mongoose');

// Create Cart Schema
const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    items: [{
        clothingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
        size: { type: String, required: true },
        quantity: { type: Number, default: 1 },
    }]
});

// Create Cart Model
const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;
