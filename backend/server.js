require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
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

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This record already exists' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
