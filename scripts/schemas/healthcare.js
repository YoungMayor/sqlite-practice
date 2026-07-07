const { seedTable } = require("../lib/db");

const COUNTS = {
  hospitals: 25,
  doctors: 400,
  patients: 4000,
  appointments: 12000,
  prescriptions: 8000,
};

module.exports = {
  key: "healthcare",
  label: "Healthcare (hospitals, doctors, patients, appointments, prescriptions)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        beds INTEGER NOT NULL
      );

      CREATE TABLE doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        years_experience INTEGER NOT NULL
      );

      CREATE TABLE patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        date_of_birth TEXT NOT NULL,
        blood_type TEXT NOT NULL,
        registered_at TEXT NOT NULL
      );

      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        doctor_id INTEGER NOT NULL REFERENCES doctors(id),
        scheduled_at TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT NOT NULL
      );

      CREATE TABLE prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id),
        medication TEXT NOT NULL,
        dosage TEXT NOT NULL,
        duration_days INTEGER NOT NULL
      );

      CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
      CREATE INDEX idx_appointments_patient ON appointments(patient_id);
      CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
      CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
    `);

    const insertHospital = db.prepare(`
      INSERT INTO hospitals (name, city, country, beds) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.hospitals} hospitals...`);
    seedTable(db, COUNTS.hospitals, () => {
      insertHospital.run(
        `${faker.location.city()} ${faker.helpers.arrayElement(["General Hospital", "Medical Center", "Regional Clinic", "Memorial Hospital"])}`,
        faker.location.city(),
        faker.location.country(),
        faker.number.int({ min: 50, max: 800 })
      );
    });

    const specialties = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology", "Oncology", "General Practice", "Psychiatry", "Radiology"];
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (hospital_id, first_name, last_name, specialty, email, years_experience)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.doctors} doctors...`);
    seedTable(db, COUNTS.doctors, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertDoctor.run(
        faker.number.int({ min: 1, max: COUNTS.hospitals }),
        first,
        last,
        faker.helpers.arrayElement(specialties),
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.number.int({ min: 1, max: 35 })
      );
    });

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const insertPatient = db.prepare(`
      INSERT INTO patients (first_name, last_name, email, date_of_birth, blood_type, registered_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.patients} patients...`);
    seedTable(db, COUNTS.patients, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertPatient.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.date.birthdate({ min: 0, max: 95, mode: "age" }).toISOString(),
        faker.helpers.arrayElement(bloodTypes),
        faker.date.past({ years: 6 }).toISOString()
      );
    });

    const statuses = ["scheduled", "completed", "cancelled", "no-show"];
    const reasons = ["Routine checkup", "Follow-up visit", "New symptoms", "Vaccination", "Lab results review", "Emergency consultation"];
    const insertAppointment = db.prepare(`
      INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.appointments} appointments...`);
    seedTable(db, COUNTS.appointments, () => {
      insertAppointment.run(
        faker.number.int({ min: 1, max: COUNTS.patients }),
        faker.number.int({ min: 1, max: COUNTS.doctors }),
        faker.date.past({ years: 2 }).toISOString(),
        faker.helpers.arrayElement(statuses),
        faker.helpers.arrayElement(reasons)
      );
    });

    const medications = ["Amoxicillin", "Ibuprofen", "Lisinopril", "Metformin", "Atorvastatin", "Omeprazole", "Albuterol", "Sertraline"];
    const insertPrescription = db.prepare(`
      INSERT INTO prescriptions (appointment_id, medication, dosage, duration_days)
      VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.prescriptions} prescriptions...`);
    seedTable(db, COUNTS.prescriptions, () => {
      insertPrescription.run(
        faker.number.int({ min: 1, max: COUNTS.appointments }),
        faker.helpers.arrayElement(medications),
        `${faker.helpers.arrayElement([5, 10, 20, 25, 50])}mg`,
        faker.helpers.arrayElement([3, 5, 7, 10, 14, 30])
      );
    });
  },
};
