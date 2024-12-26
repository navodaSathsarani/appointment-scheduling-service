

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const appRoutes = require('./app'); // Import app.js routes
const app = express();
app.use(bodyParser.json());

const PORT =  4001;
const BASE_PATH = '/api/v1/appointment-service';

app.use(BASE_PATH, appRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Appointment service is running on port ${PORT}`);
});
