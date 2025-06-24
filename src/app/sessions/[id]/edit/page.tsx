"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SessionData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
}

export default function EditSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<SessionData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
  });

  useEffect(() => {
    if (params.id) {
        fetchSession();
    }
  }, [params.id]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Session not found.");
        } else {
          throw new Error("Failed to fetch session");
        }
        return;
      }
      const data = await response.json();
      setSessionData({
          title: data.title,
          description: data.description,
          date: new Date(data.startTime).toISOString().split("T")[0],
          startTime: new Date(data.startTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(data.endTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }),
          meetingLink: data.meetingLink || "",
      });
    } catch (err) {
      setError("Failed to load session. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { title, description, date, startTime, endTime, meetingLink } = sessionData;

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

    const payload = {
      title,
      description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      meetingLink,
    };

    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update session");
      }

      router.push("/dashboard/mentor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete session");
      }

      router.push("/dashboard/mentor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!session || session.user.role !== "MENTOR") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pt-24">
        <Card className="max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="items-center text-center pb-4">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-full mb-6 shadow-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Access Denied</CardTitle>
                <CardDescription className="text-lg mt-2">You must be a mentor to edit sessions.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pt-24">
        <div className="text-center">
          <div className="relative">
            <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700 animate-pulse">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionData.title) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pt-24">
        <Card className="max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="items-center text-center pb-4">
                 <div className="bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-full mb-6 shadow-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Session Not Found</CardTitle>
                <CardDescription className="text-lg mt-2">{error}</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pt-24">
        <Card className="w-full max-w-5xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-4 rounded-full mr-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Edit Session</CardTitle>
                </div>
                <CardDescription className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Update the details of your mentoring session. All changes will be applied immediately.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-8">
                {error && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg mb-8 shadow-md" role="alert">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="font-bold text-lg">Error</p>
                            <p className="text-base">{error}</p>
                          </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="title" className="text-lg font-semibold text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Session Title
                        </Label>
                        <Input
                            type="text"
                            id="title"
                            name="title"
                            required
                            placeholder="e.g., React Hooks Deep Dive, Advanced TypeScript Patterns"
                            minLength={3}
                            maxLength={100}
                            value={sessionData.title}
                            onChange={handleChange}
                            className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-lg font-semibold text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            rows={3}
                            placeholder="Describe what the session will cover, learning objectives, and any prerequisites..."
                            minLength={10}
                            maxLength={5}
                            value={sessionData.description}
                            onChange={handleChange}
                            className="text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="date" className="text-lg font-semibold text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Date
                        </Label>
                        <Input
                            type="date"
                            id="date"
                            name="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={sessionData.date}
                            onChange={handleChange}
                            className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="startTime" className="text-lg font-semibold text-gray-700 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start Time
                            </Label>
                            <Input
                                type="time"
                                id="startTime"
                                name="startTime"
                                required
                                value={sessionData.startTime}
                                onChange={handleChange}
                                className="h-12 text-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="endTime" className="text-lg font-semibold text-gray-700 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              End Time
                            </Label>
                            <Input
                                type="time"
                                id="endTime"
                                name="endTime"
                                required
                                value={sessionData.endTime}
                                onChange={handleChange}
                                className="h-12 text-lg border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="meetingLink" className="text-lg font-semibold text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Meeting Link
                        </Label>
                        <Input
                            type="url"
                            id="meetingLink"
                            name="meetingLink"
                            placeholder="https://meet.google.com/xyz-abc-def or other meeting link"
                            value={sessionData.meetingLink}
                            onChange={handleChange}
                            className="h-12 text-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                        />
                    </div>
                     <CardFooter className="px-0 pt-8">
                        <div className="w-full space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => router.back()}
                              className="flex-1 h-12 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                              disabled={saving}
                            >
                              {saving ? (
                                  <>
                                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Saving Changes...
                                  </>
                              ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                  </>
                              )}
                            </Button>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4">
                            <Button 
                              type="button" 
                              variant="destructive"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Session
                            </Button>
                          </div>
                        </div>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-0 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-full mb-6 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-red-600">Delete Session</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Are you sure you want to delete this session? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-12 text-lg font-semibold"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete Session"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
    </div>
  );
} 