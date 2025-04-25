require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();
app.use(express.json());

//Connection to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error de conexión:', err));

//Routes
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/test-user', async (req, res) => {
  try {
    const newUser = new User({
      email: 'test@example.com',
      password: 'plainPassword',
      name: 'Usuario Test'
    });
    await newUser.save();
    res.json({ ok: true, user: newUser });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
