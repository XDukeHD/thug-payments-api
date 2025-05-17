const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config.json');
const paymentRoutes = require('./src/routes/paymentRoutes');
const path = require('path');
const fs = require('fs');
const rmtDb = require('./src/models/remote-database');

const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const app = express();

app.use(helmet());
app.use(cors());

app.use(morgan('combined'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || config.server.port;

rmtDb.init()
  .then(() => {
    console.log('Conexão com banco de dados remoto estabelecida com sucesso');
    
    app.listen(PORT, () => {
      console.log(`Payment API server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Falha ao conectar com banco de dados remoto:', err);
    process.exit(1);
  });

module.exports = app;