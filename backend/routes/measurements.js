const express = require('express');
const Measurement = require('../models/Measurement');
const router = express.Router();

//New measurement
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

// Read measurements
//    GET /api/measurements?user=ID&type=glucosa&range=7d
//    GET /api/measurements?user=ID&type=glucosa&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { user, type, range = '7d', start, end } = req.query;
  const match = {};
  if (user) match.user = user;
  if (type) match.type = type;

  // Si vienen start+end, filtramos entre esas fechas
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    match.timestamp = { $gte: s, $lte: e };
  }
  // Si no, aplicamos el range (7d, 30d, etc)
  else if (/^\d+d$/.test(range)) {
    const days = parseInt(range.slice(0, -1), 10);
    const from = new Date();
    from.setDate(from.getDate() - days);
    match.timestamp = { $gte: from };
  }

  try {
    const list = await Measurement.find(match).sort({ timestamp: 1 });
    res.json({ ok: true, measurements: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//Measurement by ID
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

//Update measurement
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

//Delete measurement
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

// Delete all measurements for a user
//    DELETE /api/measurements?user=ID
router.delete('/', async (req, res) => {
  const { user } = req.query;
  if (!user) {
    return res
      .status(400)
      .json({ ok: false, error: 'Parámetro user obligatorio' });
  }
  try {
    const result = await Measurement.deleteMany({ user });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


module.exports = router;
