"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Trash2, 
  X, 
  User, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface Booking {
  id: string;
  mentee: { id: string; name: string | null; email: string };
}

interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  mentor: { id: string; name: string | null; email: string };
  bookings: Booking[];
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
    
    setDeletingSession(sessionId);
    try {
      await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
      await fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setDeletingSession(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancelingBooking(bookingId);
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
      await fetchSessions();
    } catch (error) {
      console.error("Error canceling booking:", error);
    } finally {
      setCancelingBooking(null);
    }
  };

  const getSessionStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return { status: "upcoming", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (now >= start && now <= end) return { status: "ongoing", color: "bg-green-100 text-green-800 border-green-200" };
    return { status: "completed", color: "bg-gray-100 text-gray-800 border-gray-200" };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading sessions...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Sessions & Bookings</h1>
          <p className="text-gray-600">Monitor and manage all platform sessions and student bookings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{sessions.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-l-4 border-l-green-500 bg-green-50/50">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Bookings</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {sessions.reduce((total, session) => total + session.bookings.length, 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50/50">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Mentors</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {new Set(sessions.map(s => s.mentor.id)).size}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/50">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {sessions.filter(s => getSessionStatus(s.startTime, s.endTime).status === 'upcoming').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed border-gray-300">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-500">There are no sessions to display at the moment.</p>
            </Card>
          ) : (
            sessions.map((session) => {
              const status = getSessionStatus(session.startTime, session.endTime);
              const startTime = formatDateTime(session.startTime);
              const endTime = formatDateTime(session.endTime);
              
              return (
                <Card key={session.id} className="overflow-hidden border-2 hover:shadow-lg transition-shadow duration-200">
                  {/* Session Header */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                          <Badge className={`${status.color} border`}>
                            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{session.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg overflow-hidden">
                            <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Mentor:</span>
                            <span className="font-medium text-blue-700 truncate">{session.mentor?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg overflow-hidden">
                            <Calendar className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Date:</span>
                            <span className="font-medium text-green-700 truncate">{startTime.date}</span>
                          </div>
                          <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg overflow-hidden sm:col-span-2 lg:col-span-1">
                            <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Time:</span>
                            <span className="font-medium text-purple-700 truncate">{startTime.time} - {endTime.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0 lg:ml-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={deletingSession === session.id}
                          className="w-full lg:w-auto bg-red-600 hover:bg-red-700 border-red-600 text-white"
                        >
                          {deletingSession === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Session
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bookings Section */}
                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-indigo-600" />
                        Bookings ({session.bookings.length})
                      </h4>
                    </div>
                    
                    {session.bookings.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No bookings for this session</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {session.bookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{booking.mentee.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {booking.mentee.email}
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelingBooking === booking.id}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            >
                              {cancelingBooking === booking.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              Cancel Booking
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 