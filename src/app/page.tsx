"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Your Journey to UPSC Success Starts Here
            </h2>
            <p className="text-xl md:text-2xl mb-8">
              Connect with experienced mentors, get personalized guidance, and
              accelerate your UPSC preparation
            </p>
            {!session ? (
              <div className="space-x-4">
                <Link
                  href="/auth/signup"
                  className="btn-get-started"
                >
                  Get Started
                </Link>
                <Link
                  href="/auth/login"
                  className="btn-get-started border-2"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="btn-get-started"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container mx-auto px-4">
          <div className="section-title">
            <h2>Features</h2>
            <p>Why Choose Our Platform?</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="features-item">
              <i className="fas fa-users"></i>
              <h3>
                <a href="#">Expert Mentors</a>
              </h3>
              <p>
                Connect with experienced UPSC mentors who have successfully cleared
                the examination
              </p>
            </div>

            <div className="features-item">
              <i className="fas fa-book"></i>
              <h3>
                <a href="#">Personalized Guidance</a>
              </h3>
              <p>
                Get customized study plans and strategies tailored to your
                strengths and weaknesses
              </p>
            </div>

            <div className="features-item">
              <i className="fas fa-comments"></i>
              <h3>
                <a href="#">Interactive Sessions</a>
              </h3>
              <p>
                Engage in one-on-one sessions with mentors to clarify doubts and
                get real-time feedback
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="why-us">
        <div className="container mx-auto px-4">
          <div className="section-title">
            <h2>How It Works</h2>
            <p>Your Path to Success</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="icon-box">
              <i className="fas fa-user-plus"></i>
              <h4>Sign Up</h4>
              <p>Create your account as a student or mentor</p>
            </div>

            <div className="icon-box">
              <i className="fas fa-search"></i>
              <h4>Find a Mentor</h4>
              <p>Browse through experienced mentors and their expertise</p>
            </div>

            <div className="icon-box">
              <i className="fas fa-calendar-check"></i>
              <h4>Book Sessions</h4>
              <p>Schedule one-on-one mentoring sessions</p>
            </div>

            <div className="icon-box">
              <i className="fas fa-graduation-cap"></i>
              <h4>Get Guidance</h4>
              <p>Receive personalized guidance and support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container mx-auto px-4 text-center">
          <h3>Ready to Start Your UPSC Journey?</h3>
          <p>Join our community of aspirants and mentors today</p>
          {!session ? (
            <Link
              href="/auth/signup"
              className="btn-get-started"
            >
              Get Started Now
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="btn-get-started"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>
    </div>
  );
} 