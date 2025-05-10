require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const foodRoutes = require('./routes/food');
const reportRoutes = require('./routes/report');

const app = express();

app.use(cors());

app.use(express.json());

//MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión:', err));

//Routes
app.get('/ping', (req, res) => res.send('pong'));
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/report', reportRoutes);

//Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
