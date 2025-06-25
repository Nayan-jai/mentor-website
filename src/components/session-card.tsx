import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Session {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  mentor: {
    name: string | null;
    email: string;
  };
}

export function SessionCard({ session }: { session: Session }) {
  const { data: sessionData } = useSession();
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBookSession = async () => {
    if (!sessionData?.user) {
      setError("Please log in to book a session");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/sessions/${session.id}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to book session");
      }

      const data = await response.json();
      setBookingSuccess(data.meetLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book session. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {bookingSuccess && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Booking Successful!</strong>
          <p className="mt-2">
            Your Google Meet link:{" "}
            <a
              href={bookingSuccess}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {bookingSuccess}
            </a>
          </p>
          <button
            onClick={() => setBookingSuccess(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{session.title}</h2>
        <span
          className={`px-2 py-1 rounded text-sm ${
            session.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {session.isAvailable ? "AVAILABLE" : "BOOKED"}
        </span>
      </div>

      <p className="text-gray-600 mb-4">{session.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <i className="fas fa-calendar-alt w-5"></i>
          <span>{new Date(session.startTime).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-clock w-5"></i>
          <span>
            {new Date(session.startTime).toLocaleTimeString()} -{" "}
            {new Date(session.endTime).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-user w-5"></i>
          <span>{session.mentor.name || 'Anonymous jsoMentor'}</span>
        </div>
      </div>

      {session.isAvailable && sessionData?.user?.role === "STUDENT" && (
        <button
          onClick={handleBookSession}
          disabled={isLoading}
          className="w-full bg-accent-color text-white py-2 px-4 rounded hover:bg-accent-color-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Booking...
            </>
          ) : (
            <>
              <i className="fas fa-calendar-check mr-2"></i>
              Book Now
            </>
          )}
        </button>
      )}

      {sessionData?.user?.role === "MENTOR" && session.mentor.email === sessionData.user.email && (
        <Link
          href={`/sessions/${session.id}/edit`}
          className="block w-full bg-accent-color text-white py-2 px-4 rounded hover:bg-accent-color-dark transition-colors text-center mt-2"
        >
          <i className="fas fa-edit mr-2"></i>
          Edit Session
        </Link>
      )}
    </div>
  );
} 