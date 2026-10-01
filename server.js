const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const bookingSchema = new mongoose.Schema({
  ref: String, parentName: String, phone: String, email: String,
  childName: String, childClass: String, ticketType: String, 
  numTickets: Number, amount: Number, paymentMethod: String,
  momoRef: String, paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// API: Save Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.json({ ref: newBooking.ref, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// --- NEW: API to Get All Bookings for Admin ---
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// --- NEW: Secret Admin Page Route ---
app.get('/admin', (req, res) => {
  // This is your secret password to access the page
  if (req.query.secret !== 'oaklands2026') {
    return res.status(403).send('<h1 style="text-align:center; margin-top:50px; color:red;">Access Denied</h1>');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
