// Visa en användare i databasen
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/westwallet'; // Rätt databas
const email = process.argv[2];

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  isVerified: Boolean,
});

const User = mongoose.model('User', userSchema);

async function showUser() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('Ingen användare hittades med e-post:', email);
  } else {
    console.log('Användare:');
    console.log(user);
  }
  await mongoose.disconnect();
}

showUser().catch(console.error);
