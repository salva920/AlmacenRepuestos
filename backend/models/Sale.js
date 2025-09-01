const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleItem'
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'cancelled']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
