const { seedTable } = require("../lib/db");

const COUNTS = {
  teachers: 150,
  students: 2500,
  courses: 300,
  enrollments: 7000,
};

module.exports = {
  key: "education",
  label: "Education (students, teachers, courses, enrollments)",

  build(db, faker, log) {
    db.exec(`
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
        teacher_id INTEGER NOT NULL REFERENCES teachers(id)
      );

      CREATE TABLE enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        semester TEXT NOT NULL,
        grade TEXT,
        enrolled_at TEXT NOT NULL
      );

      CREATE INDEX idx_courses_teacher ON courses(teacher_id);
      CREATE INDEX idx_enrollments_student ON enrollments(student_id);
      CREATE INDEX idx_enrollments_course ON enrollments(course_id);
    `);

    const departments = ["Mathematics", "Computer Science", "Physics", "Literature", "History", "Biology", "Economics", "Art"];

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
      INSERT INTO courses (title, department, credits, teacher_id)
      VALUES (?, ?, ?, ?)
    `);
    log(`Seeding ${COUNTS.courses} courses...`);
    seedTable(db, COUNTS.courses, () => {
      const department = faker.helpers.arrayElement(departments);
      insertCourse.run(
        `${department} ${faker.number.int({ min: 100, max: 499 })}: ${faker.company.buzzNoun()}`,
        department,
        faker.helpers.arrayElement([1, 2, 3, 4]),
        faker.number.int({ min: 1, max: COUNTS.teachers })
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
  },
};
