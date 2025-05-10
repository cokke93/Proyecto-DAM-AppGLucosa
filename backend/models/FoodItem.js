const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  giIndex: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Fruta',
      'Cereal',
      'Panadería',
      'Lácteo',
      'Vegetal',
      'Legumbre',
      'Tubérculo',
      'Bebida',
      'Endulzante'
    ]
  },
  portion_g: {
    type: Number,
    required: true,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//Clasification by GI
foodSchema.virtual('giCategory').get(function () {
  if (this.giIndex <= 55) return 'low';
  if (this.giIndex <= 69) return 'medium';
  return 'high';
});

module.exports = mongoose.model('FoodItem', foodSchema);
