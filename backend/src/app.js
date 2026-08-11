const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const educationRoutes = require('./routes/educationRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/education', educationRoutes);
app.use('/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
