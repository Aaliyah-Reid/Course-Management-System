import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { Participant } from '../../../types/course'; // Assuming Participant type exists

interface CourseParticipantsProps {
  courseCode: string;
}

const CourseParticipants: React.FC<CourseParticipantsProps> = ({ courseCode }) => {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!courseCode) return;

    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/course_members/${courseCode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // The API returns { lecturer: { lecturerid: string, ... }, students: [{ studentid: string, firstname: string, lastname: string }, ...] }
        // We need to combine these into a single Participant array
        const fetchedParticipants: Participant[] = [];
        if (data.lecturer && data.lecturer.lecturerid) {
          // Assuming lecturer details are available or can be fetched if needed
          // For now, creating a placeholder if full details aren't in this response
          fetchedParticipants.push({
            id: data.lecturer.lecturerid.toString(), 
            firstName: data.lecturer.firstname || 'Lecturer', // Placeholder if name not directly available
            lastName: data.lecturer.lastname || '',
            role: 'lecturer',
          });
        }
        if (data.students && Array.isArray(data.students)) {
          data.students.forEach((student: any) => {
            fetchedParticipants.push({
              id: student.studentid.toString(),
              firstName: student.firstname,
              lastName: student.lastname,
              role: 'student',
            });
          });
        }
        setParticipants(fetchedParticipants);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch participants');
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [courseCode]);

  if (isLoading) {
    return <div className="text-center py-4 text-theme-text">Loading participants...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }
  
  if (participants.length === 0) {
    return <div className="text-center py-4 text-theme-text">No participants found for this course.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden shadow-md ring-1 ring-theme-primary/10 sm:rounded-lg">
        <table className="min-w-full divide-y divide-theme-primary/30">
          <thead className="bg-theme-primary/5">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-theme-text sm:pl-6">Name</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-primary/20 bg-theme-background">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-theme-accent/10 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-theme-accent" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-theme-text">
                        {participant.firstName} {participant.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                  <span className="capitalize">{participant.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseParticipants;