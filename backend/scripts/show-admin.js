// Visa admin-användaren i databasen
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/westwallet'; // Rätt databas
const email = 'dennis800121@gmail.com';

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  isVerified: Boolean,
});

const User = mongoose.model('User', userSchema);

async function showAdmin() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('Ingen admin-användare hittades med e-post:', email);
  } else {
    console.log('Admin-användare:');
    console.log(user);
  }
  await mongoose.disconnect();
}

showAdmin().catch(console.error);
