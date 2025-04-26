const express   = require('express');
const FoodItem  = require('../models/FoodItem');
const router    = express.Router();

//Find food items
//    GET /api/food?search=manzana&giCategory=low&category=Fruta
router.get('/', async (req, res) => {
  const { search, giCategory, category } = req.query;
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  if (category) {
    filter.category = category;
  }

  try {
    let items = await FoodItem.find(filter);
    //Filter by GI category
    if (giCategory) {
      items = items.filter(f => f.giCategory === giCategory);
    }
    res.json({ ok: true, food: items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//Food item by ID
//    GET /api/food/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, food: item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//Create food item
//    POST /api/food
router.post('/', async (req, res) => {
  const { name, giIndex, category, portion_g } = req.body;
  if (!name || giIndex == null || !category || portion_g == null) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
  }
  try {
    const item = new FoodItem({ name, giIndex, category, portion_g });
    await item.save();
    res.json({ ok: true, food: item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//Update food item
//    PUT /api/food/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, food: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

//Delete food item
//    DELETE /api/food/:id
router.delete('/:id', async (req, res) => {
  try {
    const del = await FoodItem.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ ok: false, error: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
