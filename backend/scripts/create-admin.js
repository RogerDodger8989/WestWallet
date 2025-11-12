// Skapa admin-användare direkt i databasen
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb://localhost:27017/westwallet'; // Rätt databas
const email = 'dennis800121@gmail.com';
const password = 'lottasas123';
const role = 'admin';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  isVerified: Boolean,
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const hash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.password = hash;
    existing.role = role;
    existing.isVerified = true;
    await existing.save();
    console.log('Admin uppdaterad:', email);
  } else {
    await User.create({
      email,
      password: hash,
      role,
      isVerified: true,
    });
    console.log('Admin skapad:', email);
  }
  await mongoose.disconnect();
}

createAdmin().catch(console.error);
