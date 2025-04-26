require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const foodRoutes = require('./routes/food');

const app = express();
app.use(express.json());

//Connection to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error de conexión:', err));

///////////////////////////////////////////////Routes
app.get('/ping', (req, res) => {
  res.send('pong');
});

//Users

//Auth 
app.use('/api/auth', authRoutes);

//Measurements
app.use('/api/measurements', measurementRoutes);

//Food
app.use('/api/food', foodRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
