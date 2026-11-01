const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('admin'));

router.get('/users', (req, res) => {
  const users = db.users.find().map(({ password, ...u }) => u);
  res.json(users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post('/users', async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !['student', 'officer', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Name, email, password and a valid role are required' });
  }
  if (role === 'officer' && !department) return res.status(400).json({ message: 'Officers need a department' });
  const mail = email.trim().toLowerCase();
  if (db.users.findOne((u) => u.email === mail)) return res.status(409).json({ message: 'Email already registered' });
  const user = db.users.insert({
    name: name.trim(), email: mail, role,
    password: await bcrypt.hash(password, 10),
    department: role === 'officer' ? department : ''
  });
  res.status(201).json({ id: user._id });
});

router.delete('/users/:id', (req, res) => {
  if (req.user._id === req.params.id) return res.status(400).json({ message: 'You cannot delete yourself' });
  db.users.remove(req.params.id);
  res.json({ ok: true });
});

router.get('/reports', (req, res) => {
  const tally = (rows, key) => {
    const counts = {};
    rows.forEach((r) => { const k = key(r); counts[k] = (counts[k] || 0) + 1; });
    return counts;
  };
  const grievances = db.grievances.find();
  const byStatus = Object.entries(tally(grievances, (g) => g.status)).map(([_id, count]) => ({ _id, count }));
  const byCategory = Object.entries(tally(grievances, (g) => `${g.category}|${g.status}`)).map(([k, count]) => {
    const [category, status] = k.split('|');
    return { _id: { category, status }, count };
  });
  const users = Object.entries(tally(db.users.find(), (u) => u.role)).map(([_id, count]) => ({ _id, count }));
  res.json({ byStatus, byCategory, users });
});

module.exports = router;
