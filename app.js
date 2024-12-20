// Appointment Scheduling Service

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://navodasathsarani:chQf3ctN1Xwx7H6s@health-sync-mongo-db.okigg.mongodb.net/health-db?retryWrites=true&w=majority&appName=health-sync-mongo-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB connection error:', err));

// Define Doctor and Appointment Schemas and Models
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    availableSlots: { type: [String], required: true } // Format: ['2023-12-01T10:00', '2023-12-01T11:00']
});

const appointmentSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientName: { type: String, required: true },
    appointmentTime: { type: String, required: true }, // ISO format
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Routes

// Add a new doctor
app.post('/doctors', async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json({ message: 'Doctor added successfully', doctor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all doctors
app.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule an appointment
app.post('/appointments', async (req, res) => {
    try {
        const { doctorId, patientName, appointmentTime } = req.body;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (!doctor.availableSlots.includes(appointmentTime)) {
            return res.status(400).json({ message: 'Selected time slot is not available' });
        }

        // Create the appointment
        const appointment = new Appointment({ doctorId, patientName, appointmentTime });
        await appointment.save();

        // Remove the booked slot from the doctor's available slots
        doctor.availableSlots = doctor.availableSlots.filter(slot => slot !== appointmentTime);
        await doctor.save();

        res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all appointments
app.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().populate('doctorId');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an appointment status
app.put('/appointments/:id', async (req, res) => {
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
app.delete('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Restore the time slot back to the doctor's available slots
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

// Start the server
app.listen(PORT, () => {
    console.log(`Appointment Scheduling Service is running on port ${PORT}`);
});
