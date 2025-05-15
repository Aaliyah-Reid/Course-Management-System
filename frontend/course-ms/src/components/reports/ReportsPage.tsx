import React, { useEffect, useState } from "react";
import axios from "axios";

type Course = {
    CourseCode: string;
    CourseName: string;
    student_count: number;
};

type Student = {
    StudentID: number;
    FirstName: string;
    LastName: string;
    course_count: number;
};

type Lecturer = {
    LecturerID: number;
    FirstName: string;
    LastName: string;
    course_count: number;
};

type TopStudent = {
    StudentID: number;
    FirstName: string;
    LastName: string;
    average_score: number;
};

type Reports = {
    popularCourses: Course[];
    activeStudents: Student[];
    busyLecturers: Lecturer[];
    topCourses: Course[];
    topStudents: TopStudent[];
};

const ReportsPage = () => {
    const [reports, setReports] = useState<Reports>({
        popularCourses: [],
        activeStudents: [],
        busyLecturers: [],
        topCourses: [],
        topStudents: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const responses = await Promise.all([
                    axios.get('/reports/popular_courses'),
                    axios.get('http://127.0.0.1:6000/reports/active_students'),
                    axios.get('/reports/busy_lecturers'),
                    axios.get('/reports/top_courses'),
                    axios.get('/reports/top_students')
                ]);

                console.log("API Responses:", responses.map(res => res.data));

                setReports({
                    popularCourses: responses[0].data.PopularCourses || [],
                    activeStudents: responses[1].data.ActiveStudents || [],
                    busyLecturers: responses[2].data.BusyLecturers || [],
                    topCourses: responses[3].data.TopEnrolledCourses || [],
                    topStudents: responses[4].data.TopStudents || []
                });

                setLoading(false);
            } catch (err) {
                console.error("Error fetching reports:", err);
                setError("Failed to load reports. Please try again later.");
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return <div className="text-center mt-10 text-gray-500">Loading reports...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Reports Dashboard</h1>

            <section className="mb-6">
                <h2 className="text-xl font-semibold">Popular Courses</h2>
                <div className="space-y-2">
                    {reports.popularCourses.length ? reports.popularCourses.map(course => (
                        <div key={course.CourseCode} className="border p-3 rounded shadow-sm bg-white">
                            <p className="font-medium">{course.CourseName}</p>
                            <p className="text-sm text-gray-600">{course.student_count} students</p>
                        </div>
                    )) : <p className="text-gray-500">No data available.</p>}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold">Active Students</h2>
                <div className="space-y-2">
                    {reports.activeStudents.length ? reports.activeStudents.map(student => (
                        <div key={student.StudentID} className="border p-3 rounded shadow-sm bg-white">
                            <p className="font-medium">{student.FirstName} {student.LastName}</p>
                            <p className="text-sm text-gray-600">{student.course_count} courses</p>
                        </div>
                    )) : <p className="text-gray-500">No data available.</p>}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold">Busy Lecturers</h2>
                <div className="space-y-2">
                    {reports.busyLecturers.length ? reports.busyLecturers.map(lecturer => (
                        <div key={lecturer.LecturerID} className="border p-3 rounded shadow-sm bg-white">
                            <p className="font-medium">{lecturer.FirstName} {lecturer.LastName}</p>
                            <p className="text-sm text-gray-600">{lecturer.course_count} courses</p>
                        </div>
                    )) : <p className="text-gray-500">No data available.</p>}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold">Top 10 Most Enrolled Courses</h2>
                <div className="space-y-2">
                    {reports.topCourses.length ? reports.topCourses.map(course => (
                        <div key={course.CourseCode} className="border p-3 rounded shadow-sm bg-white">
                            <p className="font-medium">{course.CourseName}</p>
                            <p className="text-sm text-gray-600">{course.student_count} students</p>
                        </div>
                    )) : <p className="text-gray-500">No data available.</p>}
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold">Top 10 Students by Average Score</h2>
                <div className="space-y-2">
                    {reports.topStudents.length ? reports.topStudents.map(student => (
                        <div key={student.StudentID} className="border p-3 rounded shadow-sm bg-white">
                            <p className="font-medium">{student.FirstName} {student.LastName}</p>
                            <p className="text-sm text-gray-600">Average Score: {student.average_score.toFixed(2)}</p>
                        </div>
                    )) : <p className="text-gray-500">No data available.</p>}
                </div>
            </section>
        </div>
    );
};

export default ReportsPage;
