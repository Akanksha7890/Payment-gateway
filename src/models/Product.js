const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    price: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

productSchema.set('toJSON', {
  transform: (_document, result) => {
    delete result._id;
    delete result.updated_at;
    delete result.available;
    return result;
  },
});

module.exports = mongoose.model('Product', productSchema);
