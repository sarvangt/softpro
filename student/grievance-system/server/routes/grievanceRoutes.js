const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed'))
});

const newTicketId = () => `GRV-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

// Attach the student's name/email to a ticket
const withStudent = (g) => {
  const s = db.users.findOne((u) => u._id === g.student);
  return { ...g, student: s ? { name: s.name, email: s.email } : null };
};

// Student: submit a grievance (optional photo)
router.post('/', auth, requireRole('student'), upload.single('photo'), (req, res) => {
  const { category, title, description } = req.body;
  if (!category || !title || !description) return res.status(400).json({ message: 'Category, title and description are required' });
  const grievance = db.grievances.insert({
    ticketId: newTicketId(),
    student: req.user._id,
    category,
    title: title.trim(),
    description,
    attachmentUrl: req.file ? `/uploads/${req.file.filename}` : '',
    status: 'Pending',
    remarks: '',
    handledBy: null
  });
  res.status(201).json(grievance);
});

// Student: track own tickets
router.get('/mine', auth, requireRole('student'), (req, res) => {
  res.json(db.grievances.find((g) => g.student === req.user._id).sort(newestFirst));
});

// Officer: tickets for own department
router.get('/department', auth, requireRole('officer'), (req, res) => {
  res.json(db.grievances.find((g) => g.category === req.user.department).sort(newestFirst).map(withStudent));
});

// Officer: resolve or reject
router.patch('/:id/status', auth, requireRole('officer'), (req, res) => {
  const { status, remarks } = req.body;
  if (!['Resolved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Status must be Resolved or Rejected' });
  if (!remarks || !remarks.trim()) return res.status(400).json({ message: 'Remarks / reason are required' });
  const grievance = db.grievances.findOne((g) => g._id === req.params.id && g.category === req.user.department);
  if (!grievance) return res.status(404).json({ message: 'Ticket not found in your department' });
  if (grievance.status !== 'Pending') return res.status(409).json({ message: 'Ticket already closed' });
  res.json(db.grievances.update(grievance, { status, remarks: remarks.trim(), handledBy: req.user._id }));
});

// Admin: all tickets
router.get('/all', auth, requireRole('admin'), (req, res) => {
  res.json(db.grievances.find().sort(newestFirst).map(withStudent));
});

module.exports = router;
