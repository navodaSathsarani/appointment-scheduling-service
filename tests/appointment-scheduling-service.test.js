const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Appointment Scheduling Service Tests', () => {
    beforeAll(async () => {
        // Ensure MongoDB is connected
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }
        await mongoose.connect("mongodb+srv://navodasathsarani:chQf3ctN1Xwx7H6s@health-sync-mongo-db.okigg.mongodb.net/health-db?retryWrites=true&w=majority&appName=health-sync-mongo-db"
, { });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    jest.setTimeout(10000);

    it('should add a new doctor', async () => {
        const response = await request(app)
            .post('/api/v1/appointment-service/doctors')
            .send({ name: 'Dr. Strange', specialization: 'Magic', availableSlots: ['2023-12-01T10:00'] });

        console.log('Add Doctor Response:', response.body); // Debugging log
        expect(response.statusCode).toBe(201);
        expect(response.body.doctor.name).toBe('Dr. Strange');
    });

    it('should schedule an appointment', async () => {
        const doctorResponse = await request(app)
            .post('/api/v1/appointment-service/doctors')
            .send({ name: 'Dr. Who', specialization: 'Time Travel', availableSlots: ['2023-12-01T12:00'] });

        console.log('Doctor Response:', doctorResponse.body); // Debugging log

        const doctorId = doctorResponse.body?.doctor?._id;
        expect(doctorId).toBeDefined(); // Ensure doctor ID is available

        const response = await request(app)
            .post('/api/v1/appointment-service/appointments')
            .send({ doctorId, patientName: 'John Doe', appointmentTime: '2023-12-01T12:00' });

        console.log('Schedule Appointment Response:', response.body); // Debugging log
        expect(response.statusCode).toBe(201);
        expect(response.body.appointment.patientName).toBe('John Doe');
    });

    it('should cancel an appointment', async () => {
        const doctorResponse = await request(app)
            .post('/api/v1/appointment-service/doctors')
            .send({ name: 'Dr. Watson', specialization: 'Investigation', availableSlots: ['2023-12-02T10:00'] });

        const doctorId = doctorResponse.body?.doctor?._id;
        expect(doctorId).toBeDefined(); // Ensure doctor ID is available

        const appointmentResponse = await request(app)
            .post('/api/v1/appointment-service/appointments')
            .send({ doctorId, patientName: 'Jane Doe', appointmentTime: '2023-12-02T10:00' });

        const appointmentId = appointmentResponse.body?.appointment?._id;
        expect(appointmentId).toBeDefined(); // Ensure appointment ID is available

        const response = await request(app)
            .delete(`/api/v1/appointment-service/appointments/${appointmentId}`);

        console.log('Cancel Appointment Response:', response.body); // Debugging log
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Appointment cancelled successfully');
    });
});
