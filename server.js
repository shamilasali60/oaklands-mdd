const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// 2. Database Schema
const bookingSchema = new mongoose.Schema({
  ref: String, parentName: String, phone: String, email: String,
  childName: String, childClass: String, ticketType: String, 
  numTickets: Number, amount: Number, paymentMethod: String,
  momoRef: String, paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// 3. API: Save Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.json({ ref: newBooking.ref, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// 4. API: Get All Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// 5. NEW API: Delete a Booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// 6. THE ADMIN ROUTE
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 7. Serve the main website files
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
