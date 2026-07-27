const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const staffRoutes = require('./routes/staffRoutes');

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://10.88.122.100:5173"].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

