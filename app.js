
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.connect('mongodb+srv://navodasathsarani:chQf3ctN1Xwx7H6s@health-sync-mongo-db.okigg.mongodb.net/health-db?retryWrites=true&w=majority&appName=health-sync-mongo-db', {
}).then(() => console.log('Connected to MongoDB server')).catch(err => console.error('MongoDB connection error:', err));
const router = express.Router();
router.use(bodyParser.json());

// Schemas and Models
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    availableSlots: { type: [String], required: true }, // Format: ['2023-12-01T10:00', '2023-12-01T11:00']
});

const appointmentSchema = new mongoose.Schema(
    {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
      patientName: { type: String, required: true },
      appointmentTime: { type: String, required: true }, // ISO format
      status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
      specialty: { type: String, required: true },
      symptoms: { type: [String], default: [] },
      conditions: { type: [String], default: [] },
    },
    { timestamps: true } 
  );

const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

let healthy = true;

// Set unhealthy status
router.use('/unhealthy', (req, res) => {
    healthy = false;
    res.status(200).json({ healthy });
});

// Liveness Check
router.use('/healthcheck', (req, res, next) => {
    if (healthy) {
        res.status(200).json({ status: 'healthy' });
    } else {
        next(new Error('Service is unhealthy'));
    }
});

// Readiness Check
router.use('/readiness', (req, res) => {
    res.status(200).json({ ready: true });
});
// Routes


// Readiness Check
router.use('/readiness', (req, res) => {
    res.status(200).json({ ready: true });
});

// Routes

// Add a new doctor
router.post('/doctors', async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json({ message: 'Doctor added successfully', doctor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule an appointment
router.post('/appointments', async (req, res) => {
    try {
        const { doctorId, patientName, appointmentTime, specialty, symptoms, conditions } = req.body;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
    
        const appointment = new Appointment({
            doctorId,
            patientName,
            appointmentTime,
            specialty,
            symptoms: symptoms || [], 
            conditions: conditions || [] 
        });
        await appointment.save();
    
        res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
    
});

// Get all appointments
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().populate('doctorId');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an appointment status
router.put('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.status(200).json({ message: 'Appointment updated successfully', appointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel an appointment
router.delete('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const doctor = await Doctor.findById(appointment.doctorId);
        if (doctor) {
            doctor.availableSlots.push(appointment.appointmentTime);
            await doctor.save();
        }

        res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
