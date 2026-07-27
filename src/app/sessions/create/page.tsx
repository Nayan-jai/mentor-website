"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';

export default function CreateSessionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [startTime, setStartTime] = React.useState<Dayjs | null>(null);
  const [endTime, setEndTime] = React.useState<Dayjs | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowError(false);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;

    if (!startTime || !endTime) {
      setError("Please select both start and end times.");
      setShowError(true);
      setLoading(false);
      return;
    }

    // Combine date and time
    const startDateTime = dayjs(date).set('hour', startTime.hour()).set('minute', startTime.minute()).set('second', 0).set('millisecond', 0);
    const endDateTime = dayjs(date).set('hour', endTime.hour()).set('minute', endTime.minute()).set('second', 0).set('millisecond', 0);
    const now = dayjs();

    if (startDateTime.isBefore(now)) {
      setError("Start time must be in the future");
      setShowError(true);
      setLoading(false);
      return;
    }

    if (!endDateTime.isAfter(startDateTime)) {
      setError("End time must be after start time");
      setShowError(true);
      setLoading(false);
      return;
    }

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      mentorId: session?.user?.id,
      meetingLink: formData.get("meetingLink"),
      isAvailable: true,
    };

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || "Failed to create session");
        setShowError(true);
        throw new Error(responseData.error || "Failed to create session");
      }

      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session. Please try again.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.user.role !== "MENTOR") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 dark:bg-slate-950">
        <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-900 dark:text-white">
          <CardHeader className="flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-950/60 p-4 rounded-full mb-2">
              <i className="fas fa-exclamation-circle text-2xl text-red-600 dark:text-red-400"></i>
            </div>
            <CardTitle className="text-center text-red-700 dark:text-red-400">Access Denied</CardTitle>
            <CardDescription className="text-center dark:text-slate-400">You must be a mentor to create sessions.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 pt-24 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Card className="w-full max-w-5xl shadow-2xl border border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-950 dark:to-indigo-900 p-4 rounded-full mr-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white">Create New Session</CardTitle>
          </div>
          <CardDescription className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Fill in the details below to create a new mentoring session.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          {showError && error && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/90 dark:to-red-900/80 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-2xl flex items-center gap-4 min-w-[300px] max-w-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-lg">Error</p>
                <p className="text-base">{error}</p>
              </div>
              <button onClick={() => setShowError(false)} className="ml-2 text-red-700 dark:text-red-300 hover:text-red-900 text-xl font-bold">&times;</button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Session Title
              </Label>
              <Input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Enter a descriptive and engaging session title"
                minLength={3}
                maxLength={100}
                className="h-12 text-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all duration-200"
              />
              <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Be specific and clear about your session to attract relevant mentees
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={2}
                placeholder="Describe the session in detail..."
                minLength={10}
                maxLength={500}
                className="text-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/40 transition-all duration-200 resize-none min-h-[48px]"
              />
              <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Give enough details so mentees know what to expect
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="h-12 text-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/40 transition-all duration-200 [color-scheme:light_dark]"
                />
                <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pick a date in the future
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="meetingLink" className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
                  </svg>
                  Meeting Link
                </Label>
                <Input
                  type="url"
                  id="meetingLink"
                  name="meetingLink"
                  placeholder="https://meet.google.com/xyz-abc-def or other link"
                  className="h-12 text-lg border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all duration-200"
                />
                <div className="flex items-center gap-4 mt-2">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Create a new Google Meet meeting"
                    className="hover:scale-110 transition-transform"
                  >
                    <img
                      src="/res/meet.png"
                      alt="Google Meet"
                      className="h-10 w-10 rounded-md shadow"
                    />
                  </a>
                  <a
                    href="https://zoom.us/start/videomeeting"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Create a new Zoom meeting"
                    className="hover:scale-110 transition-transform"
                  >
                    <img
                      src="/res/zoom.png"
                      alt="Zoom"
                      className="h-10 w-10 rounded-full shadow"
                    />
                  </a>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Paste the meeting link (Google Meet, Zoom, etc.)
                </p>
              </div>
            </div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    </svg>
                    Start Time
                  </Label>
                  <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                    ampm={true}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: 'medium',
                        className: "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border-2 border-gray-200 dark:border-slate-700"
                      }
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        color: 'inherit',
                        backgroundColor: 'transparent',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                      },
                      '& .MuiSvgIcon-root': { color: 'inherit' },
                      '& .MuiFormLabel-root': { color: 'inherit' },
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Set the session start time
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-700 dark:text-slate-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    </svg>
                    End Time
                  </Label>
                  <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    ampm={true}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: 'medium',
                        className: "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border-2 border-gray-200 dark:border-slate-700"
                      }
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        color: 'inherit',
                        backgroundColor: 'transparent',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: '#ec4899' },
                      },
                      '& .MuiSvgIcon-root': { color: 'inherit' },
                      '& .MuiFormLabel-root': { color: 'inherit' },
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Set the session end time
                  </p>
                </div>
              </div>
            </LocalizationProvider>
            <CardFooter className="px-0 pt-8">
              <div className="w-full flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 h-12 text-lg font-semibold border-2 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 hover:bg-blue-700 py-2 px-4 flex-1 h-12 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Create Session
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 