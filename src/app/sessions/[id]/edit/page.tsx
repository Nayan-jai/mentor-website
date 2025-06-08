"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED";
}

export default function EditSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<Session | null>(null);

  useEffect(() => {
    fetchSession();
  }, [params.id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      setError("Failed to load session. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    // Validate date and time
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    const now = new Date();

    if (startDateTime < now) {
      setError("Start time must be in the future");
      setSaving(false);
      return;
    }

    if (endDateTime <= startDateTime) {
      setError("End time must be after start time");
      setSaving(false);
      return;
    }

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update session");
      }

      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!session || session.user.role !== "MENTOR") {
    return (
      <div className="create-session-container">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto create-session-form p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-red-600 mb-4">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <i className="fas fa-exclamation-circle text-2xl sm:text-3xl"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">Access Denied</h2>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                You must be a mentor to edit sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="create-session-container">
        <div className="flex justify-center items-center h-64">
          <i className="fas fa-spinner fa-spin text-4xl text-accent-color"></i>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="create-session-container">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto create-session-form p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-red-600 mb-4">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <i className="fas fa-exclamation-circle text-2xl sm:text-3xl"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">Session Not Found</h2>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                The session you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-session-container">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-heading-color mb-2">
              Edit Session
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-md">
              Update the details of your mentoring session
            </p>
          </div>

          {error && (
            <div className="create-session-error">
              <div className="flex items-center justify-center">
                <i className="fas fa-exclamation-circle mr-3 text-lg sm:text-xl"></i>
                <p className="font-medium text-sm sm:text-base">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-session-form p-6 sm:p-8">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <label htmlFor="title" className="create-session-label">
                  Session Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="create-session-input"
                  placeholder="Enter session title"
                  minLength={3}
                  maxLength={100}
                  defaultValue={sessionData.title}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="create-session-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  className="create-session-input resize-none"
                  placeholder="Enter session description"
                  minLength={10}
                  maxLength={500}
                  defaultValue={sessionData.description}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="create-session-label">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="create-session-input"
                  defaultValue={new Date(sessionData.startTime).toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="create-session-label">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className="create-session-input"
                    defaultValue={new Date(sessionData.startTime).toLocaleTimeString("en-US", { hour12: false })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endTime" className="create-session-label">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className="create-session-input"
                    defaultValue={new Date(sessionData.endTime).toLocaleTimeString("en-US", { hour12: false })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="create-session-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="create-session-button"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      <span className="hidden sm:inline">Saving Changes...</span>
                      <span className="sm:hidden">Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 