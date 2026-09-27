export const initialDatabaseConfig = {
  connected: true,
  name: 'college_db',
  type: 'MySQL',
  version: '8.0.36',
  host: 'localhost',
  port: '3306',
  user: 'root',
  connectedAt: 'Just now',
  totalTables: 12,
  totalColumns: 48,
  totalRelationships: 3,
  totalRows: '14,200',
  size: '18.4 MB',
};

export const mockTables = [
  {
    name: 'students',
    description: 'Undergraduate and postgraduate student roster with CGPA & academic standing',
    rowCount: 1420,
    columnsCount: 7,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'name', type: 'VARCHAR(100)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'email', type: 'VARCHAR(150)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'age', type: 'INT', isPrimary: false, isForeign: false, nullable: true, defaultVal: null },
      { name: 'cgpa', type: 'DECIMAL(3,2)', isPrimary: false, isForeign: false, nullable: false, defaultVal: '0.00' },
      { name: 'department_id', type: 'INT', isPrimary: false, isForeign: true, references: 'departments.id', nullable: false, defaultVal: null },
      { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false, nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
    ],
    sampleData: [
      { id: 1, name: 'Saransh Rana', email: 'saransh.rana@univ.edu', age: 21, cgpa: '9.40', department_id: 1, created_at: '2023-08-15 09:30:00' },
      { id: 2, name: 'Arjun Sharma', email: 'arjun.s@univ.edu', age: 22, cgpa: '9.20', department_id: 1, created_at: '2023-08-15 09:35:12' },
      { id: 3, name: 'Rahul Verma', email: 'rahul.v@univ.edu', age: 21, cgpa: '9.10', department_id: 2, created_at: '2023-08-15 09:41:05' },
      { id: 4, name: 'Priya Singh', email: 'priya.singh@univ.edu', age: 20, cgpa: '9.00', department_id: 1, created_at: '2023-08-15 10:02:44' },
      { id: 5, name: 'Ananya Gupta', email: 'ananya.g@univ.edu', age: 22, cgpa: '8.90', department_id: 3, created_at: '2023-08-15 10:15:30' },
      { id: 6, name: 'Devansh Patel', email: 'd.patel@univ.edu', age: 21, cgpa: '8.75', department_id: 2, created_at: '2023-08-15 10:30:19' },
      { id: 7, name: 'Ishaan Nair', email: 'i.nair@univ.edu', age: 23, cgpa: '8.60', department_id: 4, created_at: '2023-08-15 11:05:00' },
      { id: 8, name: 'Kavya Reddy', email: 'kavya.r@univ.edu', age: 20, cgpa: '8.50', department_id: 1, created_at: '2023-08-15 11:20:18' },
    ]
  },
  {
    name: 'courses',
    description: 'Course catalog across departments with credit allocations and syllabi',
    rowCount: 64,
    columnsCount: 5,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'code', type: 'VARCHAR(12)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'title', type: 'VARCHAR(120)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'credits', type: 'INT', isPrimary: false, isForeign: false, nullable: false, defaultVal: '3' },
      { name: 'department_id', type: 'INT', isPrimary: false, isForeign: true, references: 'departments.id', nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 101, code: 'CS101', title: 'Introduction to Computer Science', credits: 4, department_id: 1 },
      { id: 102, code: 'CS201', title: 'Data Structures & Algorithms', credits: 4, department_id: 1 },
      { id: 103, code: 'CS301', title: 'Database Management Systems', credits: 3, department_id: 1 },
      { id: 104, code: 'MATH202', title: 'Linear Algebra & Optimization', credits: 4, department_id: 2 },
      { id: 105, code: 'AI401', title: 'Deep Learning & Neural Networks', credits: 3, department_id: 4 },
      { id: 106, code: 'EE210', title: 'Signals & Digital Logic', credits: 4, department_id: 3 },
    ]
  },
  {
    name: 'enrollments',
    description: 'Student-to-course semester registrations, grade scores, and completion state',
    rowCount: 3890,
    columnsCount: 6,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'student_id', type: 'INT', isPrimary: false, isForeign: true, references: 'students.id', nullable: false, defaultVal: null },
      { name: 'course_id', type: 'INT', isPrimary: false, isForeign: true, references: 'courses.id', nullable: false, defaultVal: null },
      { name: 'semester', type: 'VARCHAR(20)', isPrimary: false, isForeign: false, nullable: false, defaultVal: "'Fall 2024'" },
      { name: 'grade', type: 'VARCHAR(4)', isPrimary: false, isForeign: false, nullable: true, defaultVal: null },
      { name: 'enrollment_date', type: 'DATE', isPrimary: false, isForeign: false, nullable: false, defaultVal: 'CURRENT_DATE' },
    ],
    sampleData: [
      { id: 1001, student_id: 1, course_id: 102, semester: 'Fall 2024', grade: 'A+', enrollment_date: '2024-08-01' },
      { id: 1002, student_id: 1, course_id: 103, semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-01' },
      { id: 1003, student_id: 2, course_id: 102, semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-01' },
      { id: 1004, student_id: 3, course_id: 104, semester: 'Fall 2024', grade: 'A+', enrollment_date: '2024-08-02' },
      { id: 1005, student_id: 4, course_id: 101, semester: 'Fall 2024', grade: 'A', enrollment_date: '2024-08-02' },
      { id: 1006, student_id: 5, course_id: 105, semester: 'Fall 2024', grade: 'A-', enrollment_date: '2024-08-03' },
    ]
  },
  {
    name: 'professors',
    description: 'Faculty members, designations, research focus, and assigned office rooms',
    rowCount: 38,
    columnsCount: 6,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'name', type: 'VARCHAR(100)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'email', type: 'VARCHAR(120)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'department_id', type: 'INT', isPrimary: false, isForeign: true, references: 'departments.id', nullable: false, defaultVal: null },
      { name: 'designation', type: 'VARCHAR(60)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'office_room', type: 'VARCHAR(20)', isPrimary: false, isForeign: false, nullable: true, defaultVal: null },
    ],
    sampleData: [
      { id: 1, name: 'Dr. Vikram Seth', email: 'v.seth@univ.edu', department_id: 1, designation: 'Professor & Department Chair', office_room: 'Tech-401' },
      { id: 2, name: 'Dr. Sunita Rao', email: 's.rao@univ.edu', department_id: 1, designation: 'Associate Professor', office_room: 'Tech-412' },
      { id: 3, name: 'Dr. Rajesh Iyer', email: 'r.iyer@univ.edu', department_id: 2, designation: 'Senior Professor', office_room: 'Math-204' },
      { id: 4, name: 'Dr. Neha Kapoor', email: 'n.kapoor@univ.edu', department_id: 4, designation: 'Assistant Professor', office_room: 'AI-Lab-102' },
      { id: 5, name: 'Dr. Amitav Ghosh', email: 'a.ghosh@univ.edu', department_id: 3, designation: 'Professor', office_room: 'EE-310' },
    ]
  },
  {
    name: 'departments',
    description: 'Academic departments, faculty divisions, and administrative buildings',
    rowCount: 6,
    columnsCount: 4,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'name', type: 'VARCHAR(80)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'code', type: 'VARCHAR(10)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'building', type: 'VARCHAR(60)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 1, name: 'Computer Science and Engineering', code: 'CSE', building: 'Alan Turing Hall' },
      { id: 2, name: 'Mathematics & Statistics', code: 'MATH', building: 'Ramanujan Block' },
      { id: 3, name: 'Electrical Engineering', code: 'EE', building: 'Tesla Complex' },
      { id: 4, name: 'Data Science & AI', code: 'DSAI', building: 'Neumann Center' },
      { id: 5, name: 'Mechanical Engineering', code: 'ME', building: 'Newton Pavilion' },
      { id: 6, name: 'Humanities & Social Sciences', code: 'HSS', building: 'Tagore Bhavan' },
    ]
  },
  {
    name: 'classrooms',
    description: 'Physical lecture halls, seminar rooms, capacity limits, and projector facilities',
    rowCount: 45,
    columnsCount: 4,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'room_number', type: 'VARCHAR(20)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'capacity', type: 'INT', isPrimary: false, isForeign: false, nullable: false, defaultVal: '60' },
      { name: 'has_projector', type: 'TINYINT(1)', isPrimary: false, isForeign: false, nullable: false, defaultVal: '1' },
    ],
    sampleData: [
      { id: 1, room_number: 'ATH-101', capacity: 120, has_projector: 1 },
      { id: 2, room_number: 'ATH-102', capacity: 80, has_projector: 1 },
      { id: 3, room_number: 'RAM-201', capacity: 60, has_projector: 0 },
    ]
  },
  {
    name: 'schedules',
    description: 'Weekly timetable slots linking courses, instructors, and assigned rooms',
    rowCount: 180,
    columnsCount: 5,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'course_id', type: 'INT', isPrimary: false, isForeign: true, references: 'courses.id', nullable: false, defaultVal: null },
      { name: 'day_of_week', type: 'VARCHAR(10)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'start_time', type: 'TIME', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'classroom_id', type: 'INT', isPrimary: false, isForeign: true, references: 'classrooms.id', nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 1, course_id: 101, day_of_week: 'Monday', start_time: '09:00:00', classroom_id: 1 },
      { id: 2, course_id: 102, day_of_week: 'Tuesday', start_time: '11:00:00', classroom_id: 2 },
    ]
  },
  {
    name: 'attendance',
    description: 'Daily lecture attendance logs tracked through university card swipes',
    rowCount: 24500,
    columnsCount: 4,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'enrollment_id', type: 'INT', isPrimary: false, isForeign: true, references: 'enrollments.id', nullable: false, defaultVal: null },
      { name: 'date', type: 'DATE', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'status', type: 'VARCHAR(10)', isPrimary: false, isForeign: false, nullable: false, defaultVal: "'PRESENT'" },
    ],
    sampleData: [
      { id: 1, enrollment_id: 1001, date: '2024-09-02', status: 'PRESENT' },
      { id: 2, enrollment_id: 1001, date: '2024-09-04', status: 'PRESENT' },
    ]
  },
  {
    name: 'assignments',
    description: 'Problem sets, coding projects, midterms, and submission deadlines',
    rowCount: 320,
    columnsCount: 5,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'course_id', type: 'INT', isPrimary: false, isForeign: true, references: 'courses.id', nullable: false, defaultVal: null },
      { name: 'title', type: 'VARCHAR(150)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'max_score', type: 'INT', isPrimary: false, isForeign: false, nullable: false, defaultVal: '100' },
      { name: 'due_date', type: 'DATETIME', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 1, course_id: 102, title: 'Assignment 1: Red-Black Trees', max_score: 100, due_date: '2024-09-20 23:59:00' },
      { id: 2, course_id: 103, title: 'Project 1: SQL Schema Design', max_score: 100, due_date: '2024-09-25 23:59:00' },
    ]
  },
  {
    name: 'submissions',
    description: 'Student assignment submissions, submission timestamps, and awarded scores',
    rowCount: 4800,
    columnsCount: 5,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'assignment_id', type: 'INT', isPrimary: false, isForeign: true, references: 'assignments.id', nullable: false, defaultVal: null },
      { name: 'student_id', type: 'INT', isPrimary: false, isForeign: true, references: 'students.id', nullable: false, defaultVal: null },
      { name: 'score', type: 'DECIMAL(5,2)', isPrimary: false, isForeign: false, nullable: true, defaultVal: null },
      { name: 'submitted_at', type: 'DATETIME', isPrimary: false, isForeign: false, nullable: false, defaultVal: 'CURRENT_TIMESTAMP' },
    ],
    sampleData: [
      { id: 1, assignment_id: 1, student_id: 1, score: '98.50', submitted_at: '2024-09-19 14:22:10' },
      { id: 2, assignment_id: 1, student_id: 2, score: '95.00', submitted_at: '2024-09-19 18:45:00' },
    ]
  },
  {
    name: 'prerequisites',
    description: 'Mandatory prerequisite mappings between prerequisite courses and target subjects',
    rowCount: 42,
    columnsCount: 3,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'course_id', type: 'INT', isPrimary: false, isForeign: true, references: 'courses.id', nullable: false, defaultVal: null },
      { name: 'prereq_course_id', type: 'INT', isPrimary: false, isForeign: true, references: 'courses.id', nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 1, course_id: 102, prereq_course_id: 101 },
      { id: 2, course_id: 105, prereq_course_id: 104 },
    ]
  },
  {
    name: 'grading_scales',
    description: 'Letter grade threshold boundaries, grade points (GP), and graduation honores',
    rowCount: 10,
    columnsCount: 4,
    columns: [
      { name: 'id', type: 'INT', isPrimary: true, isForeign: false, nullable: false, defaultVal: 'AUTO_INCREMENT' },
      { name: 'grade_letter', type: 'VARCHAR(4)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'min_percentage', type: 'DECIMAL(4,1)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
      { name: 'grade_point', type: 'DECIMAL(3,1)', isPrimary: false, isForeign: false, nullable: false, defaultVal: null },
    ],
    sampleData: [
      { id: 1, grade_letter: 'A+', min_percentage: '90.0', grade_point: '10.0' },
      { id: 2, grade_letter: 'A', min_percentage: '80.0', grade_point: '9.0' },
      { id: 3, grade_letter: 'B+', min_percentage: '70.0', grade_point: '8.0' },
    ]
  }
];

export const mockSampleQueries = [
  {
    id: 'q-1',
    prompt: 'Show the top 5 students by CGPA',
    sql: `SELECT \n  s.name AS student_name,\n  s.cgpa,\n  d.name AS department\nFROM students s\nJOIN departments d ON s.department_id = d.id\nORDER BY s.cgpa DESC\nLIMIT 5;`,
    executionTime: '124 ms',
    rowCount: 5,
    status: 'Success',
    columns: ['student_name', 'cgpa', 'department'],
    rows: [
      { student_name: 'Saransh Rana', cgpa: '9.40', department: 'Computer Science and Engineering' },
      { student_name: 'Arjun Sharma', cgpa: '9.20', department: 'Computer Science and Engineering' },
      { student_name: 'Rahul Verma', cgpa: '9.10', department: 'Mathematics & Statistics' },
      { student_name: 'Priya Singh', cgpa: '9.00', department: 'Computer Science and Engineering' },
      { student_name: 'Ananya Gupta', cgpa: '8.90', department: 'Electrical Engineering' }
    ],
    timestamp: '2 min ago'
  },
  {
    id: 'q-2',
    prompt: 'Students with CGPA above 9.0',
    sql: `SELECT \n  id,\n  name,\n  email,\n  cgpa\nFROM students\nWHERE cgpa >= 9.0\nORDER BY cgpa DESC;`,
    executionTime: '98 ms',
    rowCount: 4,
    status: 'Success',
    columns: ['id', 'name', 'email', 'cgpa'],
    rows: [
      { id: 1, name: 'Saransh Rana', email: 'saransh.rana@univ.edu', cgpa: '9.40' },
      { id: 2, name: 'Arjun Sharma', email: 'arjun.s@univ.edu', cgpa: '9.20' },
      { id: 3, name: 'Rahul Verma', email: 'rahul.v@univ.edu', cgpa: '9.10' },
      { id: 4, name: 'Priya Singh', email: 'priya.singh@univ.edu', cgpa: '9.00' }
    ],
    timestamp: '15 min ago'
  },
  {
    id: 'q-3',
    prompt: 'Course enrollment statistics by course code',
    sql: `SELECT \n  c.code AS course_code,\n  c.title AS course_name,\n  COUNT(e.id) AS total_enrolled\nFROM courses c\nLEFT JOIN enrollments e ON c.id = e.course_id\nGROUP BY c.id, c.code, c.title\nORDER BY total_enrolled DESC;`,
    executionTime: '156 ms',
    rowCount: 5,
    status: 'Success',
    columns: ['course_code', 'course_name', 'total_enrolled'],
    rows: [
      { course_code: 'CS101', course_name: 'Introduction to Computer Science', total_enrolled: 420 },
      { course_code: 'CS201', course_name: 'Data Structures & Algorithms', total_enrolled: 385 },
      { course_code: 'MATH202', course_name: 'Linear Algebra & Optimization', total_enrolled: 310 },
      { course_code: 'CS301', course_name: 'Database Management Systems', total_enrolled: 290 },
      { course_code: 'AI401', course_name: 'Deep Learning & Neural Networks', total_enrolled: 215 }
    ],
    timestamp: '1 hour ago'
  },
  {
    id: 'q-4',
    prompt: 'Professors in Computer Science department',
    sql: `SELECT \n  p.name AS faculty_name,\n  p.designation,\n  p.office_room,\n  p.email\nFROM professors p\nJOIN departments d ON p.department_id = d.id\nWHERE d.code = 'CSE'\nORDER BY p.name ASC;`,
    executionTime: '82 ms',
    rowCount: 2,
    status: 'Success',
    columns: ['faculty_name', 'designation', 'office_room', 'email'],
    rows: [
      { faculty_name: 'Dr. Sunita Rao', designation: 'Associate Professor', office_room: 'Tech-412', email: 's.rao@univ.edu' },
      { faculty_name: 'Dr. Vikram Seth', designation: 'Professor & Department Chair', office_room: 'Tech-401', email: 'v.seth@univ.edu' }
    ],
    timestamp: '3 hours ago'
  },
  {
    id: 'q-5',
    prompt: 'Monthly student enrollment breakdown',
    sql: `SELECT \n  DATE_FORMAT(e.enrollment_date, '%Y-%m') AS enrollment_month,\n  COUNT(e.id) AS student_count\nFROM enrollments e\nGROUP BY enrollment_month\nORDER BY enrollment_month DESC;`,
    executionTime: '141 ms',
    rowCount: 3,
    status: 'Success',
    columns: ['enrollment_month', 'student_count'],
    rows: [
      { enrollment_month: '2024-08', student_count: 2140 },
      { enrollment_month: '2024-07', student_count: 1420 },
      { enrollment_month: '2024-06', student_count: 330 }
    ],
    timestamp: 'Yesterday'
  },
  {
    id: 'q-6',
    prompt: 'Query active student GPA ranking across non-existent column',
    sql: `SELECT name, non_existent_score \nFROM students \nWHERE status = 'ACTIVE';`,
    executionTime: '45 ms',
    rowCount: 0,
    status: 'Failed',
    errorMessage: "Unknown column 'non_existent_score' in 'field list'. Available columns in 'students': id, name, email, age, cgpa, department_id, created_at.",
    columns: [],
    rows: [],
    timestamp: 'Yesterday'
  }
];
