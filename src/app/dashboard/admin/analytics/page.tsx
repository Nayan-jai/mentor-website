"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Loader2,
  BarChart3,
  PieChart,
  Target,
  Award
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  mentors: number;
  students: number;
  activeUsers: number;
  totalSessions: number;
  totalBookings: number;
  recentGrowth?: {
    users: number;
    sessions: number;
    bookings: number;
  };
  topMentors?: Array<{
    name: string;
    sessions: number;
    bookings: number;
  }>;
  sessionStats?: {
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsData>({
    totalUsers: 0,
    mentors: 0,
    students: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthIndicator = (current: number, previous: number = 0) => {
    if (previous === 0) return { type: 'neutral', value: 0 };
    const growth = ((current - previous) / previous) * 100;
    return {
      type: growth > 0 ? 'positive' : growth < 0 ? 'negative' : 'neutral',
      value: Math.abs(growth)
    };
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading analytics...</span>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into platform performance and user engagement</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <div className="flex items-center mt-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-500 truncate">All registered users</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Mentors</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.mentors}</p>
                <div className="flex items-center mt-2">
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-500 truncate">
                    {getPercentage(stats.mentors, stats.totalUsers)}% of total users
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0 ml-2">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Sessions</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-500 truncate">Scheduled sessions</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <div className="flex items-center mt-2">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-500 truncate">Confirmed bookings</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
          {/* User Distribution */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Distribution</h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{stats.students}</span>
                  <Badge variant="secondary">
                    {getPercentage(stats.students, stats.totalUsers)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Mentors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{stats.mentors}</span>
                  <Badge variant="secondary">
                    {getPercentage(stats.mentors, stats.totalUsers)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Active Users (30d)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{stats.activeUsers}</span>
                  <Badge variant="secondary">
                    {getPercentage(stats.activeUsers, stats.totalUsers)}%
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Session Statistics */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Session Overview</h3>
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Sessions</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{stats.totalSessions}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Bookings</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.totalBookings}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg. Bookings/Session</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {stats.totalSessions > 0 ? (stats.totalBookings / stats.totalSessions).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Growth Metrics */}
        {stats.recentGrowth && (
          <Card className="p-4 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Growth</h3>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">New Users</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentGrowth.users}</p>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.recentGrowth.users}</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">New Sessions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentGrowth.sessions}</p>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.recentGrowth.sessions}</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">New Bookings</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentGrowth.bookings}</p>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{stats.recentGrowth.bookings}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Top Mentors */}
        {stats.topMentors && stats.topMentors.length > 0 && (
          <Card className="p-4 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Performing Mentors</h3>
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {stats.topMentors.map((mentor, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mentor.name}</p>
                      <p className="text-sm text-gray-500">{mentor.sessions} sessions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{mentor.bookings}</p>
                    <p className="text-sm text-gray-500">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Placeholder Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Growth Trend</h3>
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div className="bg-gray-100 rounded-lg h-48 sm:h-64 flex items-center justify-center">
              <div className="text-center px-4">
                <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-xs sm:text-sm">User Growth Chart</p>
                <p className="text-gray-400 text-xs">Chart integration coming soon</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Session Activity</h3>
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div className="bg-gray-100 rounded-lg h-48 sm:h-64 flex items-center justify-center">
              <div className="text-center px-4">
                <PieChart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-xs sm:text-sm">Session Activity Chart</p>
                <p className="text-gray-400 text-xs">Chart integration coming soon</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 