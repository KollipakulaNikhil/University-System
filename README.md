📘 University Course Registration & Timetabling System

A full-stack web application for managing university academic processes, including course registration, timetabling, attendance tracking, grading, and disciplinary actions.
Designed with transactional safety, role-based access, and real-time seat availability.

🚀 Features
👨‍🎓 Students

View available courses & sections

Register for sections (with:

seat availability

timetable clash detection

View personal timetable

View grades

View attendance percentage

Blocked access when suspended

👨‍🏫 Instructors

Manage assigned sections

Create sections (time, room, capacity)

View enrolled students

Enter grades

Mark attendance (Present/Absent/Excused)

Report disciplinary issues

🛡️ Admins

Dashboard with system-wide analytics

Manage programs, courses, sections

Manage users (students, instructors)

Review disciplinary reports

Suspend / revoke suspension

Override enrollment capacity

🏛️ System Logic

The system follows a strict academic workflow:

1️⃣ Admin creates Program & Course
2️⃣ Instructor creates Section (time, room, seat limit)
3️⃣ Student registers
4️⃣ Transaction updates seat count safely
5️⃣ Student gets timetable + grades + attendance

🔐 Role-Based Access Control (RBAC)
Role	Permissions
Admin	Full control of system & academic entities
Instructor	Manages sections, attendance, grades
Student	Registers for sections, views timetable, grades, attendance
🗄️ ER Diagram
erDiagram
    USERS ||--o{ ENROLLMENTS : "enrolls in"
    USERS ||--o{ SECTIONS : "teaches"
    USERS ||--o{ DISCIPLINARY_REPORTS : "receives/reports"
    USERS ||--o{ ATTENDANCE : "has record"
    
    PROGRAMS ||--o{ COURSES : "contains"
    COURSES ||--o{ SECTIONS : "has instances"
    
    SECTIONS ||--o{ ENROLLMENTS : "has students"
    SECTIONS ||--o{ ATTENDANCE : "tracks"
    
    ROOMS ||--o{ SECTIONS : "hosts"
    TIMESLOTS ||--o{ SECTIONS : "schedules"

    USERS {
        int id PK
        string name
        string email
        string password_hash
        enum role "student, instructor, admin"
        timestamp suspended_until
    }
    PROGRAMS {
        int id PK
        string name
        string code
    }
    COURSES {
        string code PK
        string title
        int credits
        int program_id FK
    }
    SECTIONS {
        int id PK
        string course_code FK
        string term
        int section_number
        int instructor_id FK
        int room_id FK
        int timeslot_id FK
        int capacity
        int enrolled
    }
    ENROLLMENTS {
        int id PK
        int student_id FK
        int section_id FK
        enum status "enrolled, dropped, waitlisted"
        string grade
    }
    ROOMS {
        int id PK
        string name
        int capacity
    }
    TIMESLOTS {
        int id PK
        enum day
        time start_time
        time end_time
    }
    DISCIPLINARY_REPORTS {
        int id PK
        int student_id FK
        int instructor_id FK
        text reason
        enum status "pending, resolved, revoked"
        int suspension_days
    }
    ATTENDANCE {
        int id PK
        int student_id FK
        int section_id FK
        date date
        enum status "present, absent, excused"
    }

📌 Use Case Diagram
usecaseDiagram
    actor Admin
    actor Instructor
    actor Student

    Admin --> (Manage Users)
    Admin --> (Create Program)
    Admin --> (Create Course)
    Admin --> (Manage Sections)
    Admin --> (View System Analytics)
    Admin --> (Handle Disciplinary Actions)

    Instructor --> (Create Section)
    Instructor --> (Update Section Capacity)
    Instructor --> (View Enrolled Students)
    Instructor --> (Enter Grades)
    Instructor --> (Mark Attendance)
    Instructor --> (Report Disciplinary Issue)

    Student --> (View Courses & Sections)
    Student --> (Register for Section)
    Student --> (View Timetable)
    Student --> (View Grades)
    Student --> (View Attendance)

🔄 Flowchart: Main Logic (Admin → Instructor → Student)
flowchart TD
    A[Start] --> B[Admin Creates Program]
    B --> C[Admin Creates Course]
    C --> D[Instructor Logs In]
    D --> E[Instructor Creates Section<br>(Room, Time, Capacity)]
    E --> F[Section Published]
    F --> G[Student Logs In]
    G --> H[Student Views Available Sections]

    H --> I{Seat Available?}
    I -->|Yes| J[Check Timetable Clash]
    I -->|No| W[Waitlist Student]

    J --> K{Clash?}
    K -->|No| L[Enroll Student Transaction]
    K -->|Yes| M[Show Conflict Error]

    L --> N[Update Seat Count Atomically]
    N --> O[Create Enrollment Record]
    O --> P[Student Views Timetable]

    W --> P
    M --> H

🔁 Sequence Diagram: Transactional Enrollment
sequenceDiagram
    participant S as Student
    participant API as Enrollment API
    participant DB as MySQL

    S->>API: Request to enroll in section
    API->>DB: BEGIN TRANSACTION
    API->>DB: Check seat availability
    DB-->>API: Seats Available?
    
    alt Seat Available
        API->>DB: Insert into ENROLLMENTS
        API->>DB: Update Sections.enrolled++
        API->>DB: COMMIT
        API-->>S: Enrollment Successful
    else No Seats
        API->>DB: Insert into ENROLLMENTS (waitlisted)
        API->>DB: COMMIT
        API-->>S: Added to Waitlist
    end

🛠️ Tech Stack
Frontend

Next.js (React)

Tailwind CSS

Lucide Icons

Backend

Next.js API Routes

MySQL

TypeScript

NextAuth.js

Deployment

Docker

Docker Compose

🗂️ Project Structure
university-system/
│── src/
│   ├── app/
│   ├── components/
│   ├── api/
│   └── lib/
│── scripts/
│── prisma/ or schema.sql
│── docker-compose.yml
│── README.md

⚙️ Setup Instructions
1️⃣ Install Dependencies
npm install

2️⃣ Create .env
DB_HOST=localhost
DB_USER=university_user
DB_PASSWORD=university_password
DB_NAME=university_db
NEXTAUTH_SECRET=your_super_secret_key
NEXTAUTH_URL=http://localhost:3000

3️⃣ Run MySQL Container
docker-compose up -d

4️⃣ Initialize DB Schema
npx ts-node scripts/init_db.ts
npx ts-node scripts/update_schema.ts
npx ts-node scripts/update_schema_revocation.ts
npx ts-node scripts/update_schema_attendance.ts

5️⃣ Start Application
npm run dev

🔑 Default Logins
Role	Email	Password
Admin	admin@university.com
	admin123
Instructor	instructor@university.com
	password123
Student	student@university.com
	password123
🧪 Testing & Verification

Use:

scripts/


To simulate:

seat limit

enrollment deadlock

waitlist movement

disciplinary checks

attendance updates
