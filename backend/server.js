
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'https://school-system-upgj.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/students', require('./routes/students'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/requirements', require('./routes/requirements'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/arrivals', require('./routes/arrivals'));
app.use('/api/accommodation', require('./routes/accommodation'));

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('Origin not allowed by CORS:')) {
    return res.status(403).json({ message: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'This record already exists'
    });
  }

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);

  res.status(500).json({
    message: 'Something went wrong on the server'
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
