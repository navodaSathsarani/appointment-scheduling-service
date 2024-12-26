const express = require('express');
const mongoose = require('mongoose');
const healthCheck = require('express-healthcheck');

const router = express.Router();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
   
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB connection error:', err));

// Schemas and Models
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    availableSlots: { type: [String], required: true }, // Format: ['2023-12-01T10:00', '2023-12-01T11:00']
});

const appointmentSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientName: { type: String, required: true },
    appointmentTime: { type: String, required: true }, // ISO format
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
});

const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Health Check Routes
let healthy = true;
router.use('/unhealthy', (req, res) => {
    healthy = false;
    res.status(200).json({ healthy });
});
router.use('/healthcheck', (req, res, next) => {
    if (healthy) next();
    else next(new Error('unhealthy'));
}, healthCheck());

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
        const { doctorId, patientName, appointmentTime } = req.body;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (!doctor.availableSlots.includes(appointmentTime)) {
            return res.status(400).json({ message: 'Selected time slot is not available' });
        }

        const appointment = new Appointment({ doctorId, patientName, appointmentTime });
        await appointment.save();

        doctor.availableSlots = doctor.availableSlots.filter(slot => slot !== appointmentTime);
        await doctor.save();

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
