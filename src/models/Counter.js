const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

counterSchema.statics.next = async function next(name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return counter.sequence;
};

module.exports = mongoose.model('Counter', counterSchema);
