const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the app instance

describe('Appointment Scheduling Service Integration Tests', () => {
  beforeAll(async () => {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      'mongodb+srv://navodasathsarani:chQf3ctN1Xwx7H6s@health-sync-mongo-db.okigg.mongodb.net/health-db?retryWrites=true&w=majority&appName=health-sync-mongo-db',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to MongoDB');
  });

  afterAll(async () => {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  });

  jest.setTimeout(10000); // Increase timeout to 10 seconds

  let doctorId;

  it('should add a new doctor', async () => {
    const response = await request(app)
      .post('/doctors')
      .send({
        name: 'Dr. John Doe',
        specialization: 'Cardiology',
        availableSlots: ['2024-12-21T10:00', '2024-12-21T11:00'],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.doctor.name).toBe('Dr. John Doe');
    doctorId = response.body.doctor._id; // Save the doctorId for later tests
  });

  it('should retrieve all doctors', async () => {
    const response = await request(app).get('/doctors');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should schedule a new appointment', async () => {
    const response = await request(app)
      .post('/appointments')
      .send({
        doctorId,
        patientName: 'Jane Smith',
        appointmentTime: '2024-12-21T10:00',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.appointment.patientName).toBe('Jane Smith');
    expect(response.body.appointment.appointmentTime).toBe('2024-12-21T10:00');
  });

  it('should retrieve all appointments', async () => {
    const response = await request(app).get('/appointments');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should update an appointment status', async () => {
    const appointmentResponse = await request(app)
      .post('/appointments')
      .send({
        doctorId,
        patientName: 'Update Test',
        appointmentTime: '2024-12-21T11:00',
      });

    const appointmentId = appointmentResponse.body.appointment._id;

    const updateResponse = await request(app)
      .put(`/appointments/${appointmentId}`)
      .send({
        status: 'Completed',
      });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.appointment.status).toBe('Completed');
  });

//   it('should cancel an appointment and restore the slot', async () => {
//     const appointmentResponse = await request(app)
//       .post('/appointments')
//       .send({
//         doctorId,
//         patientName: 'Cancel Test',
//         appointmentTime: '2024-12-21T10:00',
//       });

//     const appointmentId = appointmentResponse.body.appointment._id;

//     const cancelResponse = await request(app).delete(`/appointments/${appointmentId}`);
//     expect(cancelResponse.statusCode).toBe(200);
//     expect(cancelResponse.body.message).toBe('Appointment cancelled successfully');

//     // Verify that the slot is restored
//     const doctorResponse = await request(app).get('/doctors');
//     const updatedDoctor = doctorResponse.body.find((doc) => doc._id === doctorId);
//     expect(updatedDoctor.availableSlots).toContain('2024-12-21T10:00');
//   });
});
