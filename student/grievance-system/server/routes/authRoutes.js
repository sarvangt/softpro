const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, department: u.department });

// Public registration is for students only; officers/admins are created by an admin.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
  const mail = email.trim().toLowerCase();
  if (db.users.findOne((u) => u.email === mail)) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const user = db.users.insert({
    name: name.trim(), email: mail, password: await bcrypt.hash(password, 10), role: 'student', department: ''
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const mail = (email || '').trim().toLowerCase();
  const user = db.users.findOne((u) => u.email === mail);
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
