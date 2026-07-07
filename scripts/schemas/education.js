const { seedTable } = require("../lib/db");

const COUNTS = {
  classrooms: 40,
  teachers: 150,
  students: 2500,
  courses: 300,
  enrollments: 7000,
  assignments: 1200,
  attendance: 10000,
};

module.exports = {
  key: "education",
  label: "Education (students, teachers, courses, enrollments, assignments, attendance)",

  build(db, faker, log) {
    db.exec(`
      CREATE TABLE classrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_code TEXT NOT NULL UNIQUE,
        building TEXT NOT NULL,
        capacity INTEGER NOT NULL
      );

      CREATE TABLE teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL,
        hired_at TEXT NOT NULL
      );

      CREATE TABLE students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        date_of_birth TEXT NOT NULL,
        enrolled_at TEXT NOT NULL,
        gpa REAL NOT NULL
      );

      CREATE TABLE courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        credits INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id),
        classroom_id INTEGER NOT NULL REFERENCES classrooms(id)
      );

      CREATE TABLE enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        semester TEXT NOT NULL,
        grade TEXT,
        enrolled_at TEXT NOT NULL
      );

      CREATE TABLE assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL REFERENCES courses(id),
        title TEXT NOT NULL,
        due_at TEXT NOT NULL,
        max_score INTEGER NOT NULL
      );

      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
        attended_on TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE INDEX idx_courses_teacher ON courses(teacher_id);
      CREATE INDEX idx_courses_classroom ON courses(classroom_id);
      CREATE INDEX idx_enrollments_student ON enrollments(student_id);
      CREATE INDEX idx_enrollments_course ON enrollments(course_id);
      CREATE INDEX idx_assignments_course ON assignments(course_id);
      CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);
    `);

    const departments = ["Mathematics", "Computer Science", "Physics", "Literature", "History", "Biology", "Economics", "Art"];
    const buildings = ["North Hall", "South Hall", "Science Building", "Arts Center", "Main Building"];

    const insertClassroom = db.prepare(`
      INSERT INTO classrooms (room_code, building, capacity) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.classrooms} classrooms...`);
    seedTable(db, COUNTS.classrooms, (i) => {
      insertClassroom.run(
        `RM-${100 + i}`,
        faker.helpers.arrayElement(buildings),
        faker.helpers.arrayElement([20, 30, 40, 60, 100])
      );
    });

    const insertTeacher = db.prepare(`
      INSERT INTO teachers (first_name, last_name, email, department, hired_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.teachers} teachers...`);
    seedTable(db, COUNTS.teachers, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertTeacher.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.helpers.arrayElement(departments),
        faker.date.past({ years: 10 }).toISOString()
      );
    });

    const insertStudent = db.prepare(`
      INSERT INTO students (first_name, last_name, email, date_of_birth, enrolled_at, gpa)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.students} students...`);
    seedTable(db, COUNTS.students, (i) => {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      insertStudent.run(
        first,
        last,
        faker.internet.email({ firstName: first, lastName: last }) + `.${i}`,
        faker.date.birthdate({ min: 17, max: 24, mode: "age" }).toISOString(),
        faker.date.past({ years: 4 }).toISOString(),
        Number(faker.number.float({ min: 1.5, max: 4.0, fractionDigits: 2 }))
      );
    });

    const insertCourse = db.prepare(`
      INSERT INTO courses (title, department, credits, teacher_id, classroom_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.courses} courses...`);
    seedTable(db, COUNTS.courses, () => {
      const department = faker.helpers.arrayElement(departments);
      insertCourse.run(
        `${department} ${faker.number.int({ min: 100, max: 499 })}: ${faker.company.buzzNoun()}`,
        department,
        faker.helpers.arrayElement([1, 2, 3, 4]),
        faker.number.int({ min: 1, max: COUNTS.teachers }),
        faker.number.int({ min: 1, max: COUNTS.classrooms })
      );
    });

    const semesters = ["Fall 2023", "Spring 2024", "Fall 2024", "Spring 2025", "Fall 2025"];
    const grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "F", null];
    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (student_id, course_id, semester, grade, enrolled_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.enrollments} enrollments...`);
    seedTable(db, COUNTS.enrollments, () => {
      insertEnrollment.run(
        faker.number.int({ min: 1, max: COUNTS.students }),
        faker.number.int({ min: 1, max: COUNTS.courses }),
        faker.helpers.arrayElement(semesters),
        faker.helpers.arrayElement(grades),
        faker.date.past({ years: 2 }).toISOString()
      );
    });

    const insertAssignment = db.prepare(`
      INSERT INTO assignments (course_id, title, due_at, max_score) VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.assignments} assignments...`);
    seedTable(db, COUNTS.assignments, () => {
      insertAssignment.run(
        faker.number.int({ min: 1, max: COUNTS.courses }),
        `${faker.company.buzzVerb()} ${faker.company.buzzNoun()} Assignment`,
        faker.date.past({ years: 2 }).toISOString(),
        faker.helpers.arrayElement([50, 100, 100, 100, 20])
      );
    });

    const attendanceStatuses = ["present", "absent", "late", "excused"];
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (enrollment_id, attended_on, status) VALUES (?, ?, ?)
    `);
    log(`Seeding ${COUNTS.attendance} attendance records...`);
    seedTable(db, COUNTS.attendance, () => {
      insertAttendance.run(
        faker.number.int({ min: 1, max: COUNTS.enrollments }),
        faker.date.past({ years: 1 }).toISOString(),
        faker.helpers.arrayElement(attendanceStatuses)
      );
    });
  },
};
