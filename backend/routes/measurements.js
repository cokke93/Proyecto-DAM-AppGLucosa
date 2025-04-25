const express     = require('express');
const Measurement = require('../models/Measurement');
const router      = express.Router();

// New measurement
//    POST /api/measurements
router.post('/', async (req, res) => {
  const { user, type, value, timestamp } = req.body;
  if (!user || value == null) {
    return res.status(400).json({ ok: false, error: 'Falta user o value' });
  }
  try {
    const m = new Measurement({ user, type, value, timestamp });
    await m.save();
    res.json({ ok: true, measurement: m });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 2) Read measurements
//    GET /api/measurements?user=ID&type=glucosa&range=7d
router.get('/', async (req, res) => {
  const { user, type, range = '7d' } = req.query;
  const match = {};
  if (user)  match.user  = user;
  if (type)  match.type  = type;

  // Filter by date range
  if (/^\d+d$/.test(range)) {
    const days = parseInt(range.slice(0, -1), 10);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    match.timestamp = { $gte: dateFrom };
  }

  try {
    const list = await Measurement.find(match).sort({ timestamp: -1 });
    res.json({ ok: true, measurements: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3) Measurement by ID
//    GET /api/measurements/:id
router.get('/:id', async (req, res) => {
  try {
    const m = await Measurement.findById(req.params.id);
    if (!m) return res.status(404).json({ ok: false, error: 'No encontrada' });
    res.json({ ok: true, measurement: m });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4) Update measurement
//    PUT /api/measurements/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Measurement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: 'No encontrada' });
    res.json({ ok: true, measurement: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 5) Delete measurement
//    DELETE /api/measurements/:id
router.delete('/:id', async (req, res) => {
  try {
    const del = await Measurement.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ ok: false, error: 'No encontrada' });
    res.json({ ok: true, message: 'Eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
