"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedBackground } from "@/components/animated-background";

export default function HomePage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  useEffect(() => {
    if (!session) {
      setLoadingSessions(true);
      fetch("/api/sessions")
        .then((res) => res.json())
        .then((data) => {
          const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
          const now = new Date();
          const mapped = sessionsArray
            .filter((s: any) => new Date(s.startTime) > now)
            .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 6)
            .map((s: any) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              date: s.startTime ? new Date(s.startTime).toLocaleDateString() : '',
              time: s.startTime && s.endTime
                ? `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '',
              mentorName: s.mentor?.name || '',
            }));
          setSessions(mapped);
        })
        .finally(() => setLoadingSessions(false));

      setLoadingDiscussions(true);
      fetch("/api/discussions")
        .then((res) => res.json())
        .then((data) => {
          const discussionsArray =
            Array.isArray(data)
              ? data
              : Array.isArray(data?.discussions)
              ? data.discussions
              : [];
          const mapped = discussionsArray
            .filter((d: any) => !d.isPrivate)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6);
          setDiscussions(mapped);
        })
        .finally(() => setLoadingDiscussions(false));
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-8">
      <div className="relative">
        {/* Hero Section */}
        <section className="hero relative overflow-hidden min-h-screen flex flex-col justify-center bg-gradient-to-br from-gray-950 to-gray-900">
          {/* Animated floating text background */}
          <div className="absolute top-14 bottom-0 left-0 right-0 pointer-events-none z-0">
            <AnimatedBackground />
          </div>
          <div className="container mx-auto px-4 relative z-10 pt-14">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="hero-title text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                Your Journey to UPSC Success Starts Here
              </h2>
              <p className="hero-subtitle text-xl md:text-2xl mb-8 text-gray-200">
                Connect with experienced mentors, get personalized guidance, and
                accelerate your UPSC preparation
              </p>
              {!session ? (
                <div className="space-x-4">
                  <Link
                    href="/auth/register"
                    className="btn-get-started bg-blue-700 text-white border-blue-700 hover:bg-blue-800 hover:text-white"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-block px-8 py-3 text-lg font-semibold text-gray-200 border-2 border-gray-400 hover:bg-gray-800 hover:text-white rounded-full transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              ) : (
                <Link
                  href="/dashboard"
                  className="btn-get-started bg-blue-700 text-white border-blue-700 hover:bg-blue-800 hover:text-white"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="section-title pb-16">
              <h2 className="text-sm font-medium tracking-wider uppercase text-white">Features</h2>
              <p className="text-4xl font-bold uppercase text-white">Why Choose Our Platform?</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="features-item bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-users"></i>
                <h3 className="text-gray-100">
                  <a href="#" className="text-gray-100">Expert Mentors</a>
                </h3>
                <p className="text-gray-300">
                  Connect with experienced UPSC mentors who have successfully cleared
                  the examination
                </p>
              </div>

              <div className="features-item bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-book"></i>
                <h3 className="text-gray-100">
                  <a href="#" className="text-gray-100">Personalized Guidance</a>
                </h3>
                <p className="text-gray-300">
                  Get customized study plans and strategies tailored to your
                  strengths and weaknesses
                </p>
              </div>

              <div className="features-item bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-comments"></i>
                <h3 className="text-gray-100">
                  <a href="#" className="text-gray-100">Interactive Sessions</a>
                </h3>
                <p className="text-gray-300">
                  Engage in one-on-one sessions with mentors to clarify doubts and
                  get real-time feedback
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="why-us py-16 bg-gray-950 text-gray-100">
          <div className="container mx-auto px-4">
            <div className="section-title pb-16">
              <h2 className="text-sm font-medium tracking-wider uppercase text-white">How It Works</h2>
              <p className="text-4xl font-bold uppercase text-white">Your Path to Success</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="icon-box bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-user-plus text-gray-700"></i>
                <h4 className="text-gray-100">Sign Up</h4>
                <p className="text-gray-300">Create your account as a student or mentor</p>
              </div>

              <div className="icon-box bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-search text-gray-700"></i>
                <h4 className="text-gray-100">Find a Mentor</h4>
                <p className="text-gray-300">Browse through experienced mentors and their expertise</p>
              </div>

              <div className="icon-box bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-calendar-check text-gray-700"></i>
                <h4 className="text-gray-100">Book Sessions</h4>
                <p className="text-gray-300">Schedule one-on-one mentoring sessions</p>
              </div>

              <div className="icon-box bg-[#181C23] border border-gray-700 text-gray-100">
                <i className="fas fa-graduation-cap text-gray-700"></i>
                <h4 className="text-gray-100">Get Guidance</h4>
                <p className="text-gray-300">Receive personalized guidance and support</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}hancemen        <section className="cta bg-gray-900 py-20 text-center text-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Your UPSC Journey?</h3>
            <p className="text-xl mb-8">Join our community of aspirants and mentors today</p>
            {!session ? (
              <Link
                href="/auth/register"
                className="btn-get-started bg-blue-700 text-white border-blue-700 hover:bg-blue-800 hover:text-white"
              >
                Get Started Now
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="btn-get-started bg-blue-700 text-white border-blue-700 hover:bg-blue-800 hover:text-white"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </section>

        {/* Upcoming Sessions Section */}
        {!session && (
          <section className="upcoming-sessions mt-20">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-center">Upcoming Sessions</h2>
              {loadingSessions ? (
                <div className="text-center text-gray-300">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-gray-300">No upcoming sessions</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((s) => (
                    <div key={s.id} className="w-full h-full p-4 sm:p-6 rounded-xl hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 bg-white/10 backdrop-blur-sm flex flex-col">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{s.mentorName?.[0] || "M"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-lg sm:text-xl font-semibold text-white truncate">{s.title}</span>
                          <div className="text-gray-300 text-sm truncate">{s.description}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2 text-xs">
                        <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 whitespace-nowrap">{s.date}</Badge>
                        <Badge variant="secondary" className="bg-gray-800/50 text-gray-200 whitespace-nowrap">{s.time}</Badge>
                        <Badge variant="secondary" className="bg-green-900/50 text-green-200 whitespace-nowrap">Mentor: {s.mentorName}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center mt-6">
                <Link href="/sessions" className="text-blue-300 hover:text-blue-200 hover:underline font-medium">
                  See all sessions
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recent Forum Discussions Section */}
        {!session && (
          <section className="recent-forum-discussions mt-20">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-center">Recent Forum Discussions</h2>
              {loadingDiscussions ? (
                <div className="text-center text-gray-300">Loading discussions...</div>
              ) : discussions.length === 0 ? (
                <div className="text-center text-gray-300">No discussions found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discussions.map((discussion) => (
                    <div key={discussion.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:shadow-xl transition-shadow duration-200">
                      <h3 className="text-xl font-semibold mb-2 text-white">{discussion.title}</h3>
                      <p className="text-gray-300 mb-4 line-clamp-2">{discussion.content}</p>
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>By {discussion.author?.name || 'Anonymous'}</span>
                        <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center mt-6">
                <Link href="/forum" className="text-blue-300 hover:text-blue-200 hover:underline font-medium">
                  Visit the forum
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
      {/* Footer: Made with Love Arjeet Sir */}
      <hr className="w-1/2 mx-auto border-t-2 border-gray-700 my-8" />
      <div className="w-full flex justify-center items-center mt-4">
        <span className="text-lg text-gray-300">
          Made with <span className="inline-block animate-pulse text-red-500 text-3xl align-middle">❤</span> Arjeet Sir
        </span>
      </div>
    </div>
  );
} 