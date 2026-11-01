require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/grievances', require('./routes/grievanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve the built React app in production
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|uploads).*/, (req, res, next) =>
  res.sendFile(path.join(dist, 'index.html'), (err) => err && next())
);

app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase();
  if (db.users.findOne((u) => u.email === email)) return;
  db.users.insert({
    name: 'System Admin',
    email,
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    role: 'admin',
    department: ''
  });
  console.log(`Seeded admin ${email}`);
}

seedAdmin();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
