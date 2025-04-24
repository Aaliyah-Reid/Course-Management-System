package main

/*

3. You are required to have data inserted in your database based on the following
specifications.
a. You must have at least 100,000 students. /
b. You must have at least 200 courses. /
c. No student can do more than 6 courses
d. A student must be enrolled in at least 3 courses.
e. Each course must have at least 10 members.
f. No lecturer can teach more than 5 courses. /
g. A lecturer must teach at least 1 course. /

**/

import (
	"fmt"
	"math/rand"
	"os"
	"strings"

	"github.com/brianvoe/gofakeit/v7"
)

var (
	visited_students  []int
	users             []map[string]any
	visited_lecturers map[int]int
	courses           []map[string]any
	enrol             []map[string]any
)

func generateEnrolments() {
	studentEnrollmentCount := make(map[int]int) // UserID -> count
	// Store enrollments efficiently for checking: CourseID -> map[UserID]bool
	courseEnrollmentCheck := make(map[int]map[int]bool)
	finalEnrollments := []map[string]any{} // List of {CourseCode, UserID} for final SQL

	numStudents := 100000
	numCourses := 200
	minStudentsPerCourse := 10
	minCoursesPerStudent := 3
	maxCoursesPerStudent := 6

	// Initialize courseEnrollmentCheck
	for courseID := 1; courseID <= numCourses; courseID++ {
		courseEnrollmentCheck[courseID] = make(map[int]bool)
	}

	fmt.Println("Phase 1: Ensuring each course has at least", minStudentsPerCourse, "students...")
	// Phase 1: Ensure each course has at least minStudentsPerCourse students
	for courseID := 1; courseID <= numCourses; courseID++ {
		enrollmentCount := 0
		attemptLimit := numStudents * 3 // Safety break

		for len(courseEnrollmentCheck[courseID]) < minStudentsPerCourse {
			if enrollmentCount > attemptLimit {
				fmt.Printf("Warning: Phase 1 attempt limit reached for CourseID %d. Enrolled %d students.\n", courseID, len(courseEnrollmentCheck[courseID]))
				break // Move to the next course
			}
			enrollmentCount++

			studentID := rand.Intn(numStudents) + 1 // UserID from 1 to 100000

			// Check max courses for student
			if studentEnrollmentCount[studentID] >= maxCoursesPerStudent {
				continue // Try another student
			}

			// Check if student is already enrolled in this course
			if _, exists := courseEnrollmentCheck[courseID][studentID]; exists {
				continue // Try another student
			}

			courseEnrollmentCheck[courseID][studentID] = true
			studentEnrollmentCount[studentID]++
			// We'll add to finalEnrollments later after getting CourseCode
		}
		if courseID%20 == 0 { // Print progress
			fmt.Printf("  Processed %d/%d courses for minimum enrollment.\n", courseID, numCourses)
		}
	}
	fmt.Println("Phase 1 Complete.")

	fmt.Println("Phase 2: Ensuring each student has at least", minCoursesPerStudent, "courses...")
	// Phase 2: Ensure each student has at least minCoursesPerStudent courses
	for studentID := 1; studentID <= numStudents; studentID++ {
		enrollmentCount := 0
		attemptLimit := numCourses * 3 // Safety break

		for studentEnrollmentCount[studentID] < minCoursesPerStudent {
			if enrollmentCount > attemptLimit {
				fmt.Printf("Warning: Phase 2 attempt limit reached for StudentID %d. Enrolled in %d courses.\n", studentID, studentEnrollmentCount[studentID])
				break // Move to the next student
			}
			enrollmentCount++

			// Check if student somehow reached max limit (shouldn't happen in this loop)
			if studentEnrollmentCount[studentID] >= maxCoursesPerStudent {
				break
			}

			courseID := rand.Intn(numCourses) + 1 // CourseID from 1 to 200

			// Check if student is already enrolled in this course
			if _, exists := courseEnrollmentCheck[courseID][studentID]; exists {
				continue // Try another course
			}

			// Enroll the student
			courseEnrollmentCheck[courseID][studentID] = true
			studentEnrollmentCount[studentID]++
		}
		if studentID%10000 == 0 { // Print progress
			fmt.Printf("  Processed %d/%d students for minimum enrollment.\n", studentID, numStudents)
		}
	}
	fmt.Println("Phase 2 Complete.")

	fmt.Println("Generating final enrollment list with CourseCodes...")
	// Create the final list for SQL generation, mapping CourseID to CourseCode
	courseIDToCode := make(map[int]string)
	for _, c := range courses { // Use the global 'courses' slice populated earlier
		courseIDToCode[c["CourseID"].(int)] = c["CourseCode"].(string)
	}

	for courseID, students := range courseEnrollmentCheck {
		courseCode, ok := courseIDToCode[courseID]
		if !ok {
			fmt.Printf("Error: Could not find CourseCode for CourseID %d\n", courseID)
			continue
		}
		for studentID := range students {
			finalEnrollments = append(finalEnrollments, map[string]any{"CourseCode": courseCode, "UserID": studentID})
		}
	}

	// Shuffle the final list to make the INSERT order less predictable (optional)
	rand.Shuffle(len(finalEnrollments), func(i, j int) {
		finalEnrollments[i], finalEnrollments[j] = finalEnrollments[j], finalEnrollments[i]
	})

	enrol = finalEnrollments // Assign to the global variable used by generateEnrolQuery
	fmt.Println("Enrollment generation complete. Total enrollments:", len(enrol))
}

func generateEnrolQuery() string {
	if len(enrol) == 0 {
		return "-- No enrolment data generated."
	}

	var builder strings.Builder
	batchSize := 1000 // Insert 1000 rows at a time

	fmt.Printf("Generating Enrol INSERT statements (batch size %d)...\n", batchSize)

	for i, e := range enrol {
		// Start a new INSERT statement at the beginning or after a batch limit
		if i%batchSize == 0 {
			if i > 0 {
				builder.WriteString(";\n") // End previous statement
			}
			builder.WriteString("INSERT INTO Enrol (CourseCode, UserID) VALUES\n")
		} else {
			builder.WriteString(",\n") // Add comma for the next value
		}

		courseCode := e["CourseCode"]
		userID := e["UserID"]
		// Escape strings properly if they could contain special characters (though unlikely here)
		builder.WriteString(fmt.Sprintf("('%s', %d)", courseCode, userID))
	}
	builder.WriteString(";") // End the last statement

	fmt.Println("Enrol INSERT statements generated.")
	return builder.String()
}

func incrementVisitedLectures(key int) {
	visited_lecturers[key] = visited_lecturers[key] + 1
}

func generateUsers() {
	for i := range 100040 {
		users = append(users, map[string]any{
			"UserID":    i + 1,
			"FirstName": gofakeit.FirstName(),
			"LastName":  gofakeit.LastName(),
			"Password":  gofakeit.Password(true, false, true, true, false, 8),
		})
	}
}

func createCourses(adminID int) {

	var lecID int

	for i := range 200 {

		courseName := gofakeit.Noun()
		courseCode := courseName[0:2] + fmt.Sprintf("%v", rand.Intn(1000))

		if i < 40 {
			lecID = i + 100000

		} else {
			lecID = rand.Intn(100039-100000+1) + 100000
			for {
				if visited_lecturers[lecID] < 5 {
					break
				} else {
					lecID = rand.Intn(100039-100000+1) + 100000
				}
			}
		}

		courses = append(courses, map[string]any{
			"CourseCode": courseCode,
			"CourseName": courseName,
			"CourseID":   i + 1,
			"AdminID":    adminID,
			"LecturerID": lecID,
		})
		incrementVisitedLectures(lecID)

	}
}

func generateUserQuery() string {
	query := "INSERT INTO User (UserID , FirstName , LastName , Password) VALUES\n"
	for i := range 100000 {
		UserID := users[i]["UserID"]
		FirstName := users[i]["FirstName"]
		LastName := users[i]["LastName"]
		Password := users[i]["Password"]
		query += fmt.Sprintf("('%v','%v','%v','%v'),\n", UserID, FirstName, LastName, Password)
	}

	return strings.TrimSuffix(query, ",\n") + ";"
}

func generateCourseQuery() string {
	query := "INSERT INTO Courses (CourseID,CourseCode,CourseName,AdminID,LecturerID) VALUES\n"
	for i := range 200 {
		CourseID := courses[i]["CourseID"]
		CourseCode := courses[i]["CourseCode"]
		courseName := courses[i]["CourseName"]
		adminID := courses[i]["AdminID"]
		lec := courses[i]["LecturerID"]

		query += fmt.Sprintf("('%v','%v','%v','%v','%v'),\n", CourseID, CourseCode, courseName, adminID, lec)
	}

	return strings.TrimSuffix(query, ",\n") + ";"
}

func getLectures() {
	visited_lecturers = make(map[int]int)
	for i := range 40 {
		visited_lecturers[i+100000] = 0
	}
}

func writeToFile(filename string, query string) {
	file, err := os.OpenFile(filename, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		// panic(err)
	}

	defer file.Close()
	n, err := file.WriteString(query + "\n")

	if err == nil {
		fmt.Println("Wrote n bytes", n)
	} else {
		fmt.Println(err)
	}

}

func main() {

	out := "inserts.sql"

	gofakeit.Seed(0)
	generateUsers()
	getLectures()
	createCourses(100040)
	generateEnrolments()

	query1 := generateUserQuery()
	query2 := generateCourseQuery()
	query3 := generateEnrolQuery()
	writeToFile(out, query1)
	writeToFile(out, query2)
	writeToFile(out, query3)

}
