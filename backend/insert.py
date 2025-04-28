from faker import Faker
import random
import time
import hashlib
import os

fake = Faker()

sql_statements = []

def escape_string(value: str) -> str:
    return value.replace("'", "''")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

UWI_COURSES = [
    ("ACCT1002", "Introduction to Financial Accounting"),
    ("ACCT1003", "Introduction to Cost and Management Accounting"),
    ("ACCT1005", "Financial Accounting"),
    ("ACCT2014", "Financial Accounting I"),
    ("ACCT2015", "Financial Accounting II"),
    ("ACCT2017", "Management Accounting I"),
    ("ACCT2018", "Government Accounting"),
    ("ACCT2019", "Introductory Accounting for Managers"),
    ("ACCT2025", "Fraud Examination"),
    ("ACCT3015", "Accounting Information Systems"),
    ("ACCT3039", "Management Accounting II"),
    ("ACCT3040", "Advanced Accounting Theory"),
    ("ACCT3041", "Advanced Financial Accounting"),
    ("ACCT3043", "Auditing I"),
    ("ACCT3044", "Auditing II"),
    ("AGCP3012", "Tropical Food Crops"),
    ("AGEX3001", "Island Food Systems"),
    ("AGSL3001", "Irrigation and Drainage Technology"),
    ("ANTH455", "Study Abroad: Topics in Cultural Anthropology"),
    ("BIOC1015", "Introduction to Biochemistry"),
    ("BIOL0051", "Preliminary Biology I"),
    ("BIOL0052", "Preliminary Biology II"),
    ("BIOL1020", "Diversity of Life I"),
    ("BIOL1025", "Diversity of Life II"),
    ("BIOL1030", "Cell Biology"),
    ("BIOL3070", "Caribbean Island Ecology and Biogeography"),
    ("BOTN338", "Environmental Biogeography"),
    ("CHEM0615", "Preliminary Chemistry IA"),
    ("CHEM0625", "Preliminary Chemistry IB"),
    ("CHEM1110", "Introductory Chemistry I"),
    ("CHEM1120", "Introductory Chemistry II"),
    ("CHEM1125", "Introduction to Experimental Chemistry"),
    ("CHEM1130", "Introduction to Organic Chemistry"),
    ("CHEM1901", "Introductory Chemistry A"),
    ("CHEM1902", "Introductory Chemistry B"),
    ("CHEM2010", "Chemical Analysis A"),
    ("CHEM2110", "Inorganic Chemistry A"),
    ("CHEM2210", "Organic Chemistry A"),
    ("CHEM2310", "Physical Chemistry A"),
    ("CHEM3110", "Inorganic Chemistry B"),
    ("CHEM3210", "Organic Chemistry B"),
    ("CHEM3310", "Physical Chemistry B"),
    ("CHIN1001", "Chinese Language 1A"),
    ("CHIN1002", "Chinese Language 1B"),
    ("CHIN2001", "Chinese Language 2A"),
    ("CHIN2002", "Chinese Language 2B"),
    ("CHIN2214", "Survey of Chinese Culture"),
    ("CHIN3001", "Chinese Language 3A"),
    ("CLTR1100", "Introduction to Cultural Studies"),
    ("COCR2001", "Athletics"),
    ("COCR2002", "Basketball"),
    ("COCR2003", "Cricket"),
    ("COCR2004", "Football"),
    ("COCR2005", "Netball"),
    ("COCR2006", "Volleyball"),
    ("COCR2050", "University Choral Singing"),
    ("COCR2052", "Using Photography to Document University Life"),
    ("COCR2060", "Alcohol and Other Drugs of Abuse"),
    ("COCR2070", "Student Entrepreneurial Empowerment Development (SEED)"),
    ("COCR2071", "Basic Peer Helping"),
    ("COCR2100", "Sea Turtle Project"),
    ("COMP0001", "Preliminary Computer Science I"),
    ("COMP0002", "Preliminary Computer Science II"),
    ("COMP1126", "Introduction to Computing I"),
    ("COMP1127", "Introduction to Computing II"),
    ("COMP1161", "Introduction to Object-Oriented Programming"),
    ("COMP1170", "Object-Oriented Programming"),
    ("COMP1180", "Mathematics for Computer Science I"),
    ("COMP1205", "Computer Programming I"),
    ("COMP1210", "Mathematics for Computing / Computing and Society"),
    ("COMP1215", "Introduction to Computing"),
    ("COMP1220", "Computing and Society"),
    ("COMP2130", "Systems Programming"),
    ("COMP2140", "Software Engineering"),
    ("COMP2171", "Object Oriented Design & Programming"),
    ("COMP2190", "Net-Centric Computing"),
    ("COMP2201", "Discrete Mathematics for Computer Science"),
    ("COMP2211", "Analysis of Algorithms"),
    ("COMP2340", "Computer Systems Organisation"),
    ("COMP3101", "Operating Systems"),
    ("COMP3161", "Database Management Systems"),
    ("COMP3191", "Principles of Programming Languages"),
    ("COMP3220", "Principles of Artificial Intelligence"),
    ("COMP3801", "Modern Computer Security"),
    ("COMS1101", "Introduction to Human Communication I"),
    ("DBST1000", "Understanding Persons with Disabilities"),
    ("DBST2000", "Disability, Law and Society"),
    ("ECON0001", "Mathematics for Social Sciences"),
    ("ECON1000", "Principles of Economics I"),
    ("ECON1001", "Introduction to Microeconomics"),
    ("ECON1002", "Introduction to Macroeconomics"),
    ("ECON1003", "Mathematics for Social Sciences I"),
    ("ECON1004", "Mathematics for Social Sciences II"),
    ("ECON1005", "Introductory Statistics"),
    ("ELET1200", "Basic Electronics"),
    ("ELET1205", "Digital Electronics I"),
    ("ELET1210", "Introduction to Electrical Circuits"),
    ("ELET1215", "Digital Electronics II"),
    ("ELET1220", "Basic Circuit Analysis"),
    ("ENRM2002", "Energy Resources and Sustainability"),
    ("ENSC1000", "Introduction to Environmental Science"),
    ("ENSC1005", "Oceans and Climate"),
    ("FOUN1201", "Science, Medicine and Technology in Society"),
    ("FREN0101", "Beginners' French"),
    ("GEND1001", "Introduction to Gender: Theoretical Concepts and Sources of Knowledge"),
    ("GEND1103", "Theoretical Concepts & Sources of Knowledge"),
    ("GEND2001", "Gender in Caribbean Culture I"),
    ("GEND2002", "Gender in Caribbean Culture II"),
    ("GEND2004", "Sexuality, Power and Illicit Desire"),
    ("GEND2013", "Introduction to Men and Masculinities in the Caribbean"),
    ("GEND3031", "Sex, Gender and Society: Sociological Perspectives"),
    ("GEND3039", "Gender and Development with Reference to Caribbean Society"),
    ("GEND3701", "Gender Analysis and Theories of Development: Implications for Policy and Planning"),
    ("GEOG1231", "Earth Environments I: Geomorphology and Soils"),
    ("GEOG3116", "Geographies of the Caribbean"),
    ("GOVT0100", "Pre-Calculus for Social Sciences"),
    ("GOVT1000", "Introduction to Political Institutions & Analysis"),
    ("GOVT1001", "Introduction to Political Philosophy"),
    ("GOVT2001", "Caribbean Political Philosophy"),
    ("GOVT2004", "Sports, Politics and Society"),
    ("GOVT2009", "Introduction to African Politics"),
    ("GOVT2010", "Politics of the Caribbean / Delinquency and Juvenile Justice"),
    ("GOVT2012", "Introduction to Public Policy Analysis"),
    ("GOVT2017", "Issues in Contemporary Caribbean Politics"),
    ("GOVT3009", "Contemporary Issues in Caribbean Politics"),
    ("GOVT3014", "Theories of International Politics"),
    ("GOVT3035", "Comparative Public Policy"),
    ("HIST1003", "History of the Caribbean 1500-1900"),
    ("HIST1601", "The Atlantic World 1400-1600"),
    ("HIST1703", "Introduction to History"),
    ("HIST2006", "Conquest, Colonization and Resistance in the Caribbean, 1600 - the end of slavery"),
    ("HIST2007", "Freedom, Decolonization and Independence in the Caribbean since 1804"),
    ("HIST2101", "History of Latin America 1810-1910"),
    ("HIST2201", "History of the USA to 1865"),
    ("HIST2202", "History of the USA since 1865"),
    ("HIST2901", "Heritage Management & Tourism in the Caribbean"),
    ("HIST3008", "Race and Ethnicity in the British Caribbean since 1838"),
    ("HOTL2016", "Computer Applications"),
    ("HOTL2021", "Management Accounting I"),
    ("LANG3001", "Business French"),
    ("LANG3003", "Business Spanish"),
    ("LAW1010", "Law and Legal Systems"),
    ("LAW1020", "Constitutional Law"),
    ("LAW1110", "Criminal Law"),
    ("LAW1230", "Legal Methods, Research & Writing"),
    ("MATH0100", "Pre-Calculus"),
    ("MATH0110", "Calculus and Analytical Geometry"),
    ("MATH1141", "Introductory Linear Algebra & Analytical Geometry"),
    ("MATH1142", "Calculus I"),
    ("MATH1151", "Calculus II"),
    ("MATH1152", "Introduction to Formal Mathematics / Sets and Number Systems"),
    ("MATH1190", "Calculus A"),
    ("MATH1195", "Calculus B"),
    ("MATH1230", "Introductory Applied Statistics I"),
    ("MATH1235", "Introductory Calculus"),
    ("MATH2274", "Probability Theory 1"),
    ("MATH2401", "Elements of Mathematical Analysis"),
    ("MATH2403", "Multivariable Calculus"),
    ("MATH2404", "Introduction to Probability Theory"),
    ("MATH2410", "A First Course in Linear Algebra"),
    ("MATH2411", "Introduction to Abstract Algebra"),
    ("MATH2420", "Ordinary Differential Equations"),
    ("MATH3400", "Complex Variables"),
    ("MATH3412", "Advanced Abstract Algebra"),
    ("MATH3421", "Partial Differential Equations"),
    ("MATH3423", "Research Project in Mathematics"),
    ("METE1110", "Introduction to Oceans and Climate"),
    ("METE1125", "Meteorological Observations, Instruments and Basic Analysis"),
    ("METE1130", "Introduction to Physical Meteorology"),
    ("METE1135", "Introduction to Dynamic Meteorology"),
    ("METE1305", "Introduction to Climate Change"),
    ("MGMT1000", "Introduction to Management"),
    ("MGMT1001", "Introduction to Management"),
    ("MGMT2003", "Property and Facilities Management"),
    ("MGMT2005", "Microcomputer Applications for Business"),
    ("MGMT2006", "Management Information Systems I"),
    ("MGMT2008", "Organisational Behaviour"),
    ("MGMT2012", "Quantitative Methods"),
    ("MGMT2013", "Introduction to International Business"),
    ("MGMT2020", "Managerial Economics"),
    ("MGMT2021", "Business Law I"),
    ("MGMT2023", "Financial Management I"),
    ("MGMT2026", "Production and Operations Management"),
    ("MGMT2027", "Management in Government I"),
    ("MGMT2028", "Management in Government II"),
    ("MGMT2224", "Introduction to Entrepreneurship"),
    ("MGMT3004", "Management of Quality"),
    ("MGMT3005", "Attractions Development and Management"),
    ("MGMT3006", "Hotel and Restaurant Management Seminar"),
    ("MGMT3011", "Management Information Systems II"),
    ("MGMT3017", "Human Resources Management"),
    ("MGMT3018", "Industrial Relations"),
    ("MGMT3022", "Organisational Development"),
    ("MGMT3024", "Business Communications"),
    ("MGMT3031", "Business Strategy and Policy"),
    ("MGMT3033", "Business, Government and Society"),
    ("MGMT3037", "International Business Management"),
    ("MGMT3038", "Cross-National Management"),
    ("MGMT3045", "Business Law II"),
    ("MGMT3048", "Financial Management II"),
    ("MGMT3049", "Financial Institutions and Markets"),
    ("MGMT3050", "Investments and Analysis"),
    ("MGMT3053", "International Financial Management"),
    ("MGMT3055", "Applied Topics in Finance"),
    ("MGMT3056", "Project Management"),
    ("MGMT3058", "New Venture Management"),
    ("MGMT3061", "Team Building and Management"),
    ("MGMT3062", "Compensation Management"),
    ("MGMT3063", "Labour and Employment Law"),
    ("MGMT3073", "Managing Development"),
    ("MGMT3075", "Public Enterprise Management"),
    ("MGMT3076", "Managing Financial Institutions"),
    ("MGMT3077", "Managing Innovations"),
    ("MGMT3078", "Policy Analysis"),
    ("MGMT3089", "Social Entrepreneurship for Sustainable Development"),
    ("MGMT3090", "Entrepreneurial Finance"),
    ("MGMT3091", "Creativity and Innovation Management for Entrepreneurship"),
    ("MGMT3096", "Taxations and Tax Management"),
    ("MGMT3097", "Big Data Analytics"),
    ("MKTG2001", "Principles of Marketing"),
    ("MKTG3000", "Marketing Management"),
    ("MKTG3001", "International Marketing Management"),
    ("MKTG3002", "Marketing Research"),
    ("MKTG3009", "Services Marketing"),
    ("MKTG3010", "Integrated Marketing Communication"),
    ("MKTG3016", "Digital Marketing"),
    ("MKTG3070", "Consumer Behaviour"),
    ("OHSF040", "Managing Safety"),
    ("OOL6001", "Graduate Introduction to Online Learning"),
    ("PHIL1901", "Business Ethics"),
    ("PHIL1902", "Ethics for the Human Services"),
    ("PHIL2028", "Sports Ethics"),
    ("PHYS0070", "Preliminary Physics I"),
    ("PHYS0071", "Preliminary Physics II"),
    ("PHYS1200", "Physics I: Mechanics"),
    ("PHYS1205", "Physics II: Waves and Optics"),
    ("PHYS1210", "Physics III: Thermodynamics, Electricity & Magnetism"),
    ("PHYS1220", "Physics IV: Modern Physics"),
    ("PHYS1411", "Mechanics"),
    ("PHYS1412", "Thermal Physics & Properties of Matter"),
    ("PHYS1421", "Optics and Waves"),
    ("PHYS1422", "Electricity and Magnetism"),
    ("PHYS2401", "Mathematical Methods in Physics I"),
    ("PHYS2402", "Quantum Mechanics I"),
    ("PHYS2403", "Classical Mechanics"),
    ("PHYS2404", "Electricity & Magnetism I"),
    ("PROC010", "Introduction to Procurement"),
    ("PROC020", "The Economics of Procurement"),
    ("PROC030", "The Procurement Cycle"),
    ("PROC040", "Asset, Inventory and Records Management"),
    ("PROC050", "Procurement Risk Management"),
    ("PSYC1000", "Introduction to Psychology"),
    ("PSYC1001", "Introduction to Social Psychology"),
    ("PSYC1004", "Introduction to Organisational Psychology"),
    ("PSYC2000", "Social Psychology"),
    ("PSYC2002", "Abnormal Psychology"),
    ("PSYC2003", "Physiological Psychology"),
    ("PSYC2004", "Personality Theory"),
    ("PSYC2008", "Cognitive Psychology"),
    ("PSYC2012", "Developmental Psychology"),
    ("PSYC3001", "Social Cognition"),
    ("PSYC3008", "Elements of Counselling and Psychotherapy"),
    ("PSYC3011", "Research Project in Psychology"),
    ("PSYC3023", "Contemporary Issues in Social Psychology"),
    ("SOCI1001", "Introduction to Social Research"),
    ("SOCI1002", "Introduction to Sociology I"),
    ("SOCI1003", "Sociology and Development"),
    ("SOCI1005", "Introductory Statistics for the Behavioural Sciences"),
    ("SOCI1006", "Introduction to Anthropology"),
    ("SOCI2000", "Classical Social Theory"),
    ("SOCI2001", "Modern Social Theory"),
    ("SOCI2003", "Sociology of a Diasporic Community"),
    ("SPAN0101", "Beginners' Spanish"),
    ("STAT1001", "Statistics for the Social Sciences"),
    ("STAT2001", "Inferential Statistics"),
    ("STAT2002", "Discrete Probability Theory"),
    ("STAT2003", "Linear Models"),
    ("STAT2004", "Multivariate Methods"),
    ("STAT3001", "Regression Analysis"),
    ("STAT3002", "Time Series"),
    ("SWEN1000", "Introduction to Software Engineering"),
    ("SWEN1001", "Data Structures"),
    ("SWEN1002", "Computer Organisation & Architecture"),
    ("SWEN1003", "Object Oriented Programming"),
    ("SWEN1004", "Discrete Mathematics"),
    ("SWEN1005", "Web Programming and Technologies I"),
    ("SWEN1006", "Calculus I"),
    ("SWEN1007", "Calculus II"),
    ("SWEN1008", "Introduction to Requirements Engineering"),
    ("SWEN1009", "Programming Methodology"),
    ("TOUR2000", "Introduction to Travel, Tourism and Hospitality"),
    ("TOUR2001", "Caribbean Tourism"),
    ("TOUR2002", "Transportation and Travel"),
    ("TOUR2003", "Tourism Planning and Development II"),
    ("TOUR2004", "Research Methods for Business"),
    ("TOUR3000", "Tourism Management"),
    ("TOUR3001", "Sustainable Tourism"),
    ("TOUR3002", "Tourism Marketing")
]

def generate_users(num_students=100000, num_lecturers=200, num_admins=50):
    student_id = 620100000
    lecturer_id = 300000000
    admin_id = 100000000
    student_ids = []
    lecturer_ids = []
    admin_ids = []

    for _ in range(num_students):
        fname = escape_string(fake.first_name())
        lname = escape_string(fake.last_name())
        password = hash_password(f"student_{student_id}_{fake.uuid4()}")
        sql_statements.append(
            f"INSERT INTO User (UserID, FirstName, LastName, Password, UserType) VALUES ({student_id}, '{fname}', '{lname}', '{password}', 'student');"
        )
        sql_statements.append(f"INSERT INTO Student (StudentID) VALUES ({student_id});")
        student_ids.append(student_id)
        student_id += 1

    for _ in range(num_lecturers):
        fname = escape_string(fake.first_name())
        lname = escape_string(fake.last_name())
        password = hash_password(f"lecturer_{lecturer_id}_{fake.uuid4()}")
        sql_statements.append(
            f"INSERT INTO User (UserID, FirstName, LastName, Password, UserType) VALUES ({lecturer_id}, '{fname}', '{lname}', '{password}', 'lecturer');"
        )
        sql_statements.append(f"INSERT INTO Lecturer (LecturerID) VALUES ({lecturer_id});")
        lecturer_ids.append(lecturer_id)
        lecturer_id += 1

    for _ in range(num_admins):
        fname = escape_string(fake.first_name())
        lname = escape_string(fake.last_name())
        password = hash_password(f"admin_{admin_id}_{fake.uuid4()}")
        sql_statements.append(
            f"INSERT INTO User (UserID, FirstName, LastName, Password, UserType) VALUES ({admin_id}, '{fname}', '{lname}', '{password}', 'admin');"
        )
        sql_statements.append(f"INSERT INTO Admin (AdminID) VALUES ({admin_id});")
        admin_ids.append(admin_id)
        admin_id += 1
    return student_ids, lecturer_ids, admin_ids

def generate_courses(lecturer_ids, admin_ids):
    course_entries = []
    course_codes = []
    used_codes = set()
    idx = 0
    total_courses = len(UWI_COURSES)
    lecturer_course_count = {lid: 0 for lid in lecturer_ids}
    lecturer_list = lecturer_ids * 5
    random.shuffle(lecturer_list)
    lecturer_assigned = set()

    for i in range(total_courses):
        code, name = UWI_COURSES[i]

        # Assign a lecturer with < 5 courses, and ensure all lecturers get at least 1 course
        while True:
            lecturer_id = lecturer_list[idx % len(lecturer_list)]
            if lecturer_course_count[lecturer_id] < 5:
                break
            idx += 1
        lecturer_course_count[lecturer_id] += 1
        lecturer_assigned.add(lecturer_id)
        admin_id = random.choice(admin_ids)
        sql_statements.append(
            f"INSERT INTO Course (CourseCode, CourseName, LecturerID, AdminID) VALUES ('{code[:20]}', '{escape_string(name)}', {lecturer_id}, {admin_id});"
        )
        course_entries.append((code[:20], lecturer_id))
        course_codes.append(code[:20])
        used_codes.add(code[:20])
        idx += 1

    # Ensure every lecturer has at least 1 course
    for lecturer_id in lecturer_ids:
        if lecturer_id not in lecturer_assigned:

            # Assign to a random course that has a lecturer with more than 1 course
            for i, (code, assigned_lecturer) in enumerate(course_entries):
                if lecturer_course_count[assigned_lecturer] > 1:

                    # Reassign this course to the unassigned lecturer
                    sql_statements.append(
                        f"UPDATE Course SET LecturerID = {lecturer_id} WHERE CourseCode = '{code}';"
                    )
                    lecturer_course_count[assigned_lecturer] -= 1
                    lecturer_course_count[lecturer_id] += 1
                    course_entries[i] = (code, lecturer_id)
                    lecturer_assigned.add(lecturer_id)
                    break
    return course_entries

def enrol_students(student_ids, course_codes):

    # Each student: 3-6 courses; each course: at least 10 members
    student_courses = {sid: set() for sid in student_ids}
    course_members = {code: set() for code in course_codes}
    all_students = student_ids.copy()
    random.shuffle(all_students)
    student_idx = 0

    # Step 1: Ensure each course has at least 10 members
    for code in course_codes:
        assigned = set()
        while len(assigned) < 10:
            sid = all_students[student_idx % len(all_students)]
            if len(student_courses[sid]) < 6:
                assigned.add(sid)
                student_courses[sid].add(code)
                course_members[code].add(sid)
            student_idx += 1
        for sid in assigned:
            sql_statements.append(f"INSERT INTO Enrol (CourseCode, UserID) VALUES ('{code}', {sid});")

    # Step 2: Ensure each student has at least 3 courses
    for sid in student_ids:
        needed = 3 - len(student_courses[sid])
        if needed > 0:
            available = [c for c in course_codes if c not in student_courses[sid] and len(course_members[c]) < len(student_ids)]
            chosen = random.sample(available, min(needed, len(available)))
            for code in chosen:
                if len(student_courses[sid]) < 6:
                    sql_statements.append(f"INSERT INTO Enrol (CourseCode, UserID) VALUES ('{code}', {sid});")
                    student_courses[sid].add(code)
                    course_members[code].add(sid)
                    
    # Step 3: Optionally, randomly assign up to 6 courses per student
    for sid in student_ids:
        current = len(student_courses[sid])
        max_extra = 6 - current
        if max_extra > 0:
            available = [c for c in course_codes if c not in student_courses[sid] and len(course_members[c]) < len(student_ids)]
            extra = random.randint(0, max_extra)
            chosen = random.sample(available, min(extra, len(available)))
            for code in chosen:
                sql_statements.append(f"INSERT INTO Enrol (CourseCode, UserID) VALUES ('{code}', {sid});")
                student_courses[sid].add(code)
                course_members[code].add(sid)

def generate_assignments(course_codes, num_assignments_per_course=3):
    assignment_ids = []
    for code in course_codes:
        for _ in range(num_assignments_per_course):
            content = escape_string(fake.sentence(nb_words=10))
            due_date = fake.date_time_between(start_date="+1d", end_date="+60d").strftime('%Y-%m-%d %H:%M:%S')
            sql_statements.append(
                f"INSERT INTO Assignment (CourseCode, Content, DueDate) VALUES ('{code}', '{content}', '{due_date}');"
            )
            assignment_ids.append((code, len(assignment_ids)+1))
    return assignment_ids

def generate_calendar_events(course_codes, lecturer_ids, num_events_per_course=2):
    for code in course_codes:
        for _ in range(num_events_per_course):
            event_name = escape_string(fake.catch_phrase())
            event_date = fake.date_time_between(start_date="+1d", end_date="+60d").strftime('%Y-%m-%d %H:%M:%S')
            created_by = random.choice(lecturer_ids)
            sql_statements.append(
                f"INSERT INTO CalendarEvents (CourseCode, EventName, EventDate, CreatedBy) VALUES ('{code}', '{event_name}', '{event_date}', {created_by});"
            )

def generate_discussion_forums(course_codes, num_forums_per_course=1):
    forum_ids = []
    for code in course_codes:
        for _ in range(num_forums_per_course):
            forum_name = escape_string(fake.bs().capitalize())
            sql_statements.append(
                f"INSERT INTO DiscussionForum (CourseCode, ForumName) VALUES ('{code}', '{forum_name}');"
            )
            forum_ids.append((code, len(forum_ids)+1))
    return forum_ids

def generate_discussion_threads(forum_ids, lecturer_ids, student_ids, num_threads_per_forum=2):
    thread_ids = []
    thread_counter = 1
    for (course_code, forum_id) in forum_ids:
        for _ in range(num_threads_per_forum):
            title = escape_string(fake.sentence(nb_words=6))
            content = escape_string(fake.paragraph(nb_sentences=2))
            created_by = random.choice(lecturer_ids + student_ids)
            created_at = fake.date_time_between(start_date="-30d", end_date="now").strftime('%Y-%m-%d %H:%M:%S')
            updated_at = created_at
            sql_statements.append(
                f"INSERT INTO DiscussionThread (ForumID, ThreadTitle, Content, CreatedBy, CreatedAt, UpdatedAt) VALUES ({forum_id}, '{title}', '{content}', {created_by}, '{created_at}', '{updated_at}');"
            )
            thread_ids.append((forum_id, thread_counter))
            thread_counter += 1
    return thread_ids

def generate_thread_votes(thread_ids, user_ids, min_votes=0, max_votes=10):
    for (_, thread_id) in thread_ids:
        n_votes = random.randint(min_votes, max_votes)
        voters = random.sample(user_ids, min(n_votes, len(user_ids)))
        for uid in voters:
            vote = random.choice([1, -1])
            sql_statements.append(
                f"INSERT INTO ThreadVote (ThreadID, UserID, Vote) VALUES ({thread_id}, {uid}, {vote});"
            )

def generate_replies(thread_ids, lecturer_ids, student_ids, num_replies_per_thread=3):
    reply_ids = []
    reply_counter = 1
    for (forum_id, thread_id) in thread_ids:
        parent_ids = [None]
        for _ in range(num_replies_per_thread):
            content = escape_string(fake.sentence(nb_words=12))
            created_by = random.choice(lecturer_ids + student_ids)
            parent_reply_id = random.choice(parent_ids)
            parent_str = "NULL" if parent_reply_id is None else str(parent_reply_id)
            sql_statements.append(
                f"INSERT INTO Reply (ThreadID, ParentReplyID, Content, CreatedBy) VALUES ({thread_id}, {parent_str}, '{content}', {created_by});"
            )
            reply_ids.append((thread_id, reply_counter))
            parent_ids.append(reply_counter)
            reply_counter += 1
    return reply_ids

def generate_reply_votes(reply_ids, user_ids, min_votes=0, max_votes=5):
    for (_, reply_id) in reply_ids:
        n_votes = random.randint(min_votes, max_votes)
        voters = random.sample(user_ids, min(n_votes, len(user_ids)))
        for uid in voters:
            vote = random.choice([1, -1])
            sql_statements.append(
                f"INSERT INTO ReplyVote (ReplyID, UserID, Vote) VALUES ({reply_id}, {uid}, {vote});"
            )

def generate_sections(course_codes, num_sections_per_course=2):
    section_ids = []
    for code in course_codes:
        for _ in range(num_sections_per_course):
            title = escape_string(fake.catch_phrase())
            sql_statements.append(
                f"INSERT INTO Section (CourseCode, SectionTitle) VALUES ('{code}', '{title}');"
            )
            section_ids.append((code, len(section_ids)+1))
    return section_ids

def generate_section_items(section_ids, num_items_per_section=2):
    for (course_code, section_id) in section_ids:
        for _ in range(num_items_per_section):
            item_title = escape_string(fake.sentence(nb_words=4))
            link = fake.url() if random.random() < 0.5 else ''
            filename = fake.file_name(extension='pdf') if random.random() < 0.5 else ''
            description = escape_string(fake.sentence(nb_words=8))
            sql_statements.append(
                f"INSERT INTO SectionItem (SectionID, ItemTitle, Link, Filename, Description) VALUES ({section_id}, '{item_title}', '{link}', '{filename}', '{description}');"
            )

def generate_submissions(student_ids, assignment_ids):
    submission_ids = []
    submission_counter = 1
    for (course_code, assignment_id) in assignment_ids:
        n = random.randint(10, 30)
        submitters = random.sample(student_ids, n)
        for sid in submitters:
            content = escape_string(fake.paragraph(nb_sentences=2))
            upload_date = fake.date_time_between(start_date="-10d", end_date="now").strftime('%Y-%m-%d %H:%M:%S')
            sql_statements.append(
                f"INSERT INTO Submission (StudentID, AssignmentID, SubmissionContent, UploadDate) VALUES ({sid}, {assignment_id}, '{content}', '{upload_date}');"
            )
            submission_ids.append((assignment_id, submission_counter, sid))
            submission_counter += 1
    return submission_ids

def generate_grades(submission_ids, lecturer_ids):
    for (assignment_id, submission_id, sid) in submission_ids:
        lecturer_id = random.choice(lecturer_ids)
        score = round(random.uniform(50, 100), 2)
        sql_statements.append(
            f"INSERT INTO Grade (SubmissionID, LecturerID, Score) VALUES ({submission_id}, {lecturer_id}, {score});"
        )

def write_views(f):
    f.write("""
-- View: Courses with 50 or more students
CREATE OR REPLACE VIEW CoursesWith50OrMoreStudents AS
SELECT c.CourseCode, c.CourseName, COUNT(e.UserID) AS StudentCount
FROM Course c
JOIN Enrol e ON c.CourseCode = e.CourseCode
GROUP BY c.CourseCode, c.CourseName
HAVING COUNT(e.UserID) >= 50;
""")

    f.write("""
-- View: Students with 5 or more courses
CREATE OR REPLACE VIEW StudentsWith5OrMoreCourses AS
SELECT u.UserID, u.FirstName, u.LastName, COUNT(e.CourseCode) AS CourseCount
FROM User u
JOIN Enrol e ON u.UserID = e.UserID
WHERE u.UserType = 'student'
GROUP BY u.UserID, u.FirstName, u.LastName
HAVING COUNT(e.CourseCode) >= 5;
""")

    f.write("""
-- View: Lecturers teaching 3 or more courses
CREATE OR REPLACE VIEW LecturersWith3OrMoreCourses AS
SELECT u.UserID AS LecturerID, u.FirstName, u.LastName, COUNT(c.CourseCode) AS CourseCount
FROM User u
JOIN Course c ON u.UserID = c.LecturerID
WHERE u.UserType = 'lecturer'
GROUP BY u.UserID, u.FirstName, u.LastName
HAVING COUNT(c.CourseCode) >= 3;
""")

    f.write("""
-- View: 10 most enrolled courses
CREATE OR REPLACE VIEW Top10MostEnrolledCourses AS
SELECT c.CourseCode, c.CourseName, COUNT(e.UserID) AS StudentCount
FROM Course c
JOIN Enrol e ON c.CourseCode = e.CourseCode
GROUP BY c.CourseCode, c.CourseName
ORDER BY StudentCount DESC
LIMIT 10;
""")

    f.write("""
-- View: Top 10 students with highest overall averages
CREATE OR REPLACE VIEW Top10StudentsByAverage AS
SELECT u.UserID, u.FirstName, u.LastName, AVG(g.Score) AS AverageScore
FROM User u
JOIN Submission s ON u.UserID = s.StudentID
JOIN Grade g ON s.SubmissionID = g.SubmissionID
WHERE u.UserType = 'student'
GROUP BY u.UserID, u.FirstName, u.LastName
HAVING COUNT(g.Score) > 0
ORDER BY AverageScore DESC
LIMIT 10;
""")

def main():
    start = time.time()
    print("Generating users...")
    student_ids, lecturer_ids, admin_ids = generate_users()
    print("Generating courses...")
    course_entries = generate_courses(lecturer_ids, admin_ids)
    course_codes = [code for code, _ in course_entries]
    print("Enrolling students...")
    enrol_students(student_ids, course_codes)
    print("Generating assignments...")
    assignment_ids = generate_assignments(course_codes)
    print("Generating calendar events...")
    generate_calendar_events(course_codes, lecturer_ids)
    print("Generating discussion forums...")
    forum_ids = generate_discussion_forums(course_codes)
    print("Generating discussion threads...")
    thread_ids = generate_discussion_threads(forum_ids, lecturer_ids, student_ids)
    print("Generating replies...")
    reply_ids = generate_replies(thread_ids, lecturer_ids, student_ids)
    print("Generating thread votes...")
    generate_thread_votes(thread_ids, lecturer_ids + student_ids)
    print("Generating reply votes...")
    generate_reply_votes(reply_ids, lecturer_ids + student_ids)
    print("Generating sections...")
    section_ids = generate_sections(course_codes)
    print("Generating section items...")
    generate_section_items(section_ids)
    print("Generating submissions...")
    submission_ids = generate_submissions(student_ids, assignment_ids)
    print("Generating grades...")
    generate_grades(submission_ids, lecturer_ids)

    sql_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'insert.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        for stmt in sql_statements:
            f.write(stmt + '\n')
        write_views(f)
    print(f"Done in {time.time() - start:.2f}s. SQL written to {sql_path}.")

if __name__ == "__main__":
    main()