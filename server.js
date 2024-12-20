const app = require('./app');

const PORT = process.env.PORT || 40001;

app.listen(PORT, () => {
  console.log(`Patient Record Service is running on port ${PORT}`);
});