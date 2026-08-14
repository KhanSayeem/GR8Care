const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./config/env');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const documentTemplateRoutes = require('./routes/documentTemplateRoutes');
const educationRoutes = require('./routes/educationRoutes');
const fundingRoutes = require('./routes/fundingRoutes');
const instantRequestRoutes = require('./routes/instantRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const providerRoutes = require('./routes/providerRoutes');
const shiftNoteRoutes = require('./routes/shiftNoteRoutes');
const userRoutes = require('./routes/userRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/document-templates', documentTemplateRoutes);
app.use('/education', educationRoutes);
app.use('/funding', fundingRoutes);
app.use('/notifications', notificationRoutes);
app.use('/providers', providerRoutes);
app.use('/requests', instantRequestRoutes);
app.use('/shift-notes', shiftNoteRoutes);
app.use('/users', userRoutes);
app.use('/voice', voiceRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
