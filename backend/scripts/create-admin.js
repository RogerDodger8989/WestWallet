// Skapa admin-användare direkt i databasen
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb://localhost:27017/westwallet'; // Rätt databas
const email = 'dennis800121@gmail.com';
const password = 'lottasas123';
const role = 'admin';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  preferences: { type: Object, default: {} },
  trialStart: { type: Date, default: Date.now },
  trialDaysLeft: { type: Number, default: 30 },
  isPaid: { type: Boolean, default: false },
  paymentMethod: { type: String, default: null },
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  // Radera eventuell gammal admin-användare
  await User.deleteMany({ email });
  const hash = await bcrypt.hash(password, 10);
  await User.create({
    email,
    passwordHash: hash,
    role,
    isVerified: true,
    isDeleted: false,
    preferences: {},
    trialStart: new Date(),
    trialDaysLeft: 30,
    isPaid: false,
    paymentMethod: null,
  });
  console.log('Admin skapad:', email);
  await mongoose.disconnect();
}

createAdmin().catch(console.error);
