import { mockSampleQueries, mockTables } from '../data/mockDatabase';

export const AI_GENERATION_STEPS = [
  'Analyzing your question...',
  'Understanding database schema...',
  'Generating SQL...',
];

/**
 * Intelligent mock AI query synthesizer that matches known queries or
 * dynamically constructs SQL & result sets based on prompt keywords.
 */
export function synthesizeSQLFromPrompt(promptText) {
  const normalized = promptText.trim().toLowerCase();

  // 1. Direct match with existing mock queries
  const exactMatch = mockSampleQueries.find(q => 
    q.prompt.toLowerCase() === normalized ||
    normalized.includes(q.prompt.toLowerCase()) ||
    q.prompt.toLowerCase().includes(normalized)
  );

  if (exactMatch && exactMatch.status === 'Success') {
    return {
      sql: exactMatch.sql,
      columns: exactMatch.columns,
      rows: exactMatch.rows,
      rowCount: exactMatch.rowCount,
      executionTime: exactMatch.executionTime,
      status: 'Success',
      errorMessage: null,
    };
  }

  // 2. Intent matching based on keywords
  if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('invalid')) {
    return {
      sql: `SELECT student_name, unmapped_attribute\nFROM students\nWHERE invalid_filter = TRUE;`,
      columns: [],
      rows: [],
      rowCount: 0,
      executionTime: '38 ms',
      status: 'Failed',
      errorMessage: "The generated SQL contains an invalid column reference: 'unmapped_attribute' does not exist in table 'students'.",
    };
  }

  if (normalized.includes('professor') || normalized.includes('teacher') || normalized.includes('faculty')) {
    return {
      sql: `SELECT \n  p.name AS professor_name,\n  p.designation,\n  d.name AS department_name,\n  p.office_room,\n  p.email\nFROM professors p\nLEFT JOIN departments d ON p.department_id = d.id\nORDER BY p.name ASC;`,
      columns: ['professor_name', 'designation', 'department_name', 'office_room', 'email'],
      rows: [
        { professor_name: 'Dr. Amitav Ghosh', designation: 'Professor', department_name: 'Electrical Engineering', office_room: 'EE-310', email: 'a.ghosh@univ.edu' },
        { professor_name: 'Dr. Neha Kapoor', designation: 'Assistant Professor', department_name: 'Data Science & AI', office_room: 'AI-Lab-102', email: 'n.kapoor@univ.edu' },
        { professor_name: 'Dr. Rajesh Iyer', designation: 'Senior Professor', department_name: 'Mathematics & Statistics', office_room: 'Math-204', email: 'r.iyer@univ.edu' },
        { professor_name: 'Dr. Sunita Rao', designation: 'Associate Professor', department_name: 'Computer Science and Engineering', office_room: 'Tech-412', email: 's.rao@univ.edu' },
        { professor_name: 'Dr. Vikram Seth', designation: 'Professor & Department Chair', department_name: 'Computer Science and Engineering', office_room: 'Tech-401', email: 'v.seth@univ.edu' },
      ],
      rowCount: 5,
      executionTime: '88 ms',
      status: 'Success',
      errorMessage: null,
    };
  }

  if (normalized.includes('course') || normalized.includes('class') || normalized.includes('subject')) {
    return {
      sql: `SELECT \n  c.code,\n  c.title,\n  c.credits,\n  d.name AS department\nFROM courses c\nJOIN departments d ON c.department_id = d.id\nORDER BY c.credits DESC, c.code ASC;`,
      columns: ['code', 'title', 'credits', 'department'],
      rows: [
        { code: 'CS101', title: 'Introduction to Computer Science', credits: 4, department: 'Computer Science and Engineering' },
        { code: 'CS201', title: 'Data Structures & Algorithms', credits: 4, department: 'Computer Science and Engineering' },
        { code: 'MATH202', title: 'Linear Algebra & Optimization', credits: 4, department: 'Mathematics & Statistics' },
        { code: 'EE210', title: 'Signals & Digital Logic', credits: 4, department: 'Electrical Engineering' },
        { code: 'CS301', title: 'Database Management Systems', credits: 3, department: 'Computer Science and Engineering' },
        { code: 'AI401', title: 'Deep Learning & Neural Networks', credits: 3, department: 'Data Science & AI' },
      ],
      rowCount: 6,
      executionTime: '104 ms',
      status: 'Success',
      errorMessage: null,
    };
  }

  if (normalized.includes('department')) {
    return {
      sql: `SELECT \n  d.code,\n  d.name AS department_name,\n  d.building,\n  COUNT(s.id) AS total_students\nFROM departments d\nLEFT JOIN students s ON d.id = s.department_id\nGROUP BY d.id, d.code, d.name, d.building\nORDER BY total_students DESC;`,
      columns: ['code', 'department_name', 'building', 'total_students'],
      rows: [
        { code: 'CSE', department_name: 'Computer Science and Engineering', building: 'Alan Turing Hall', total_students: 540 },
        { code: 'DSAI', department_name: 'Data Science & AI', building: 'Neumann Center', total_students: 360 },
        { code: 'MATH', department_name: 'Mathematics & Statistics', building: 'Ramanujan Block', total_students: 280 },
        { code: 'EE', department_name: 'Electrical Engineering', building: 'Tesla Complex', total_students: 240 },
      ],
      rowCount: 4,
      executionTime: '112 ms',
      status: 'Success',
      errorMessage: null,
    };
  }

  if (normalized.includes('enroll') || normalized.includes('grade')) {
    return {
      sql: `SELECT \n  s.name AS student_name,\n  c.code AS course_code,\n  e.semester,\n  e.grade,\n  e.enrollment_date\nFROM enrollments e\nJOIN students s ON e.student_id = s.id\nJOIN courses c ON e.course_id = c.id\nORDER BY e.enrollment_date DESC\nLIMIT 6;`,
      columns: ['student_name', 'course_code', 'semester', 'grade', 'enrollment_date'],
      rows: [
        { student_name: 'Saransh Rana', course_code: 'CS102', semester: 'Fall 2024', grade: 'A+', enrollment_date: '2024-08-01' },
        { student_name: 'Saransh Rana', course_code: 'CS103', semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-01' },
        { student_name: 'Arjun Sharma', course_code: 'CS102', semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-01' },
        { student_name: 'Rahul Verma', course_code: 'MATH202', semester: 'Fall 2024', grade: 'A+', enrollment_date: '2024-08-02' },
        { student_name: 'Priya Singh', course_code: 'CS101', semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-02' },
        { student_name: 'Ananya Gupta', course_code: 'AI401', semester: 'Fall 2024', grade: 'A-', enrollment_date: '2024-08-03' },
      ],
      rowCount: 6,
      executionTime: '135 ms',
      status: 'Success',
      errorMessage: null,
    };
  }

  // Default fallback: student ranking or selection based on query
  return {
    sql: `SELECT \n  id,\n  name,\n  email,\n  age,\n  cgpa\nFROM students\nORDER BY cgpa DESC\nLIMIT 5;`,
    columns: ['id', 'name', 'email', 'age', 'cgpa'],
    rows: [
      { id: 1, name: 'Saransh Rana', email: 'saransh.rana@univ.edu', age: 21, cgpa: '9.40' },
      { id: 2, name: 'Arjun Sharma', email: 'arjun.s@univ.edu', age: 22, cgpa: '9.20' },
      { id: 3, name: 'Rahul Verma', email: 'rahul.v@univ.edu', age: 21, cgpa: '9.10' },
      { id: 4, name: 'Priya Singh', email: 'priya.singh@univ.edu', age: 20, cgpa: '9.00' },
      { id: 5, name: 'Ananya Gupta', email: 'ananya.g@univ.edu', age: 22, cgpa: '8.90' },
    ],
    rowCount: 5,
    executionTime: '118 ms',
    status: 'Success',
    errorMessage: null,
  };
}
