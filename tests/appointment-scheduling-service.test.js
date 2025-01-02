
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const appointmentRoutes = require('../app'); // Adjust path based on your directory structure

const app = express();
app.use(express.json());
app.use('/api/v1/appointment-service', appointmentRoutes);

beforeAll(async () => {
    // Connect to a test MongoDB database
    const TEST_DB_URI = "mongodb+srv://navodasathsarani:chQf3ctN1Xwx7H6s@health-sync-mongo-db.okigg.mongodb.net/health-db?retryWrites=true&w=majority&appName=health-sync-mongo-db";
    await mongoose.connect(TEST_DB_URI, { });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Appointment API Endpoints', () => {
  let createdDoctorId;
  let createdAppointmentId;

  test('POST /api/v1/appointment-service/doctors - Add a new doctor', async () => {
      const response = await request(app)
          .post('/api/v1/appointment-service/doctors')
          .send({
              name: 'Dr. Strange',
              specialization: 'Magic',
              availableSlots: ['2023-12-01T10:00', '2023-12-01T11:00']
          });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'Doctor added successfully');
      expect(response.body.doctor).toHaveProperty('_id');
      expect(response.body.doctor.name).toBe('Dr. Strange');
      createdDoctorId = response.body.doctor._id; // Save doctor ID for later tests
  });

  test('POST /api/v1/appointment-service/appointments - Schedule an appointment', async () => {
    const response = await request(app)
        .post('/api/v1/appointment-service/appointments')
        .send({
            doctorId: createdDoctorId,
            patientName: 'John Doe',
            appointmentTime: '2023-12-01T10:00',
            specialty: 'Cardiology',
            symptoms: ['Chest pain', 'Shortness of breath'],
            conditions: ['Hypertension']
        });

    // Assertions
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Appointment scheduled successfully');
    expect(response.body.appointment).toHaveProperty('_id');
    expect(response.body.appointment.patientName).toBe('John Doe');
    expect(response.body.appointment.specialty).toBe('Cardiology');
    expect(response.body.appointment.symptoms).toEqual(['Chest pain', 'Shortness of breath']);
    expect(response.body.appointment.conditions).toEqual(['Hypertension']);

    // Save appointment ID for later tests
    createdAppointmentId = response.body.appointment._id;
});


  test('GET /api/v1/appointment-service/appointments - Get all appointments', async () => {
      const response = await request(app).get('/api/v1/appointment-service/appointments');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
  });

  

  test('PUT /api/v1/appointment-service/appointments/:id - Update an appointment', async () => {
      const response = await request(app)
          .put(`/api/v1/appointment-service/appointments/${createdAppointmentId}`)
          .send({
              appointmentTime: '2023-12-01T11:00'
          });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Appointment updated successfully');
      expect(response.body.appointment).toHaveProperty('appointmentTime', '2023-12-01T11:00');
  });

  test('DELETE /api/v1/appointment-service/appointments/:id - Cancel an appointment', async () => {
      const response = await request(app).delete(`/api/v1/appointment-service/appointments/${createdAppointmentId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Appointment cancelled successfully');
  });
});
