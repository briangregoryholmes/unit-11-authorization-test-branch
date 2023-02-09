const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Hint: Why is bcrypt required here?
 */
const SALT_WORK_FACTOR = 10;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
  console.log('Hashing password');
  const hash = await bcrypt.hash(this.password, SALT_WORK_FACTOR);
  this.password = hash;
  next();
});

userSchema.methods.comparePassword = async function (plaintextPassword) {
  console.log('Mongo Middleware Checking Password: ', this.password);
  const correct = await bcrypt.compare(plaintextPassword, this.password);
  return correct;
};

module.exports = mongoose.model('User', userSchema);
