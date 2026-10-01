"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Compass, 
  Target, 
  UserCheck, 
  Search, 
  Calendar, 
  Rocket, 
  Star, 
  Zap
} from "lucide-react";
import { ThreeOrbitingWords } from "@/components/three-orbiting-words";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session) router.replace("/dashboard");
  }, [session, status, router]);

  if (status === "loading" || session) {
    return <div className="min-h-screen bg-[#070b14] dark:bg-[#070b14]" />;
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-gray-100 pb-8 relative selection:bg-blue-500 selection:text-white">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">

        {/* Dark: deep glow orbs */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[650px]"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.25) 0%, rgba(99,102,241,0.12) 40%, transparent 75%)' }} />
          <div className="absolute top-1/4 -left-32 w-[450px] h-[450px] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] rounded-full bg-indigo-600/15 blur-[120px]" />
          <div className="absolute bottom-12 left-1/3 w-[600px] h-[300px] rounded-full bg-purple-600/12 blur-[140px]" />
        </div>

        {/* Three.js 3D orbiting words */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <ThreeOrbitingWords />
        </div>

        {/* Hero content */}
        <div className="container mx-auto px-4 pt-24 pb-16 relative" style={{ zIndex: 2 }}>
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-[5.5rem] font-black tracking-tight leading-[1.06] mb-6 select-none drop-shadow-sm dark:drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
              <span className="text-slate-900 dark:text-white">Your Journey to</span><br />
              {/* Light gradient */}
              <span className="dark:hidden" style={{ background: 'linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Success Starts Here
              </span>
              {/* Dark gradient with luminous violet/cyan glow */}
              <span className="hidden dark:inline" style={{ background: 'linear-gradient(135deg,#ffffff 15%,#93c5fd 55%,#c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Success Starts Here
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300/90 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
              Connect with experienced mentors, get personalized guidance, and accelerate your preparation.
            </p>

            {/* CTA Buttons */}
            {!session ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
                <Link href="/auth/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.65)]">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2.5 transition-transform duration-200" />
                </Link>
                <Link href="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold
                    text-slate-800 dark:text-slate-200
                    bg-white/80 dark:bg-slate-900/60
                    border border-slate-300/80 dark:border-white/10
                    hover:bg-slate-50 dark:hover:bg-white/10
                    hover:text-blue-600 dark:hover:text-white
                    hover:border-blue-400/60 dark:hover:border-blue-400/60
                    backdrop-blur-xl shadow-sm hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-200 hover:scale-105 active:scale-95">
                  Explore Mentors
                </Link>
              </div>
            ) : (
              <div className="mb-16">
                <Link href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.45)]">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            )}

            {/* Metrics Dock Capsule */}
            <div className="w-full max-w-3xl rounded-2xl p-4 sm:p-5
              bg-white/85 dark:bg-[rgba(13,19,34,0.78)]
              border border-slate-200/90 dark:border-white/[0.12]
              shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08),0_0_25px_rgba(37,99,235,0.08)]
              dark:shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(37,99,235,0.18)]
              hover:border-blue-500/30 transition-all duration-300"
              style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/90">
                
                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center py-2 px-3 text-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">4.9</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 5.0</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Candidate Rating</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center py-2 px-3 text-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">1-on-1</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Personalized Sessions</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center py-2 px-3 text-center pt-3 sm:pt-2">
                  <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">100%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Curated Syllabus</span>
                </div>

                {/* Stat 4 */}
                <div className="flex flex-col items-center justify-center py-2 px-3 text-center pt-3 sm:pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">3.2x</span>
                    <span className="text-[10px] font-bold tracking-wide uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                      Velocity
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Faster Prep Milestones</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden bg-transparent" style={{ zIndex: 1 }}>
        <div className="relative container mx-auto px-6 max-w-6xl">
          
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-4 rounded-full text-xs font-bold tracking-widest uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Why Us
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Choose Our Platform?
            </h2>
            <p className="mt-4 text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
              Everything you need to crack UPSC & competitive exams — unified in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: GraduationCap, 
                accent: "from-blue-500 to-indigo-600",
                glow: "rgba(59, 130, 246, 0.18)",
                tag: "VERIFIED EXPERTS",
                title: "Expert Mentors",       
                desc: "Connect with IAS/IPS rank holders and veteran educators with proven track records in guiding aspirants to top percentiles." 
              },
              { 
                icon: Compass,  
                accent: "from-violet-500 to-purple-600", 
                glow: "rgba(139, 92, 246, 0.18)",
                tag: "CUSTOM STRATEGY",
                title: "Personalised Guidance", 
                desc: "Get hyper-tailored study roadmaps, curated topic prioritization, and answer-writing evaluations matching your unique strengths." 
              },
              { 
                icon: Target,  
                accent: "from-teal-500 to-emerald-600",  
                glow: "rgba(16, 185, 129, 0.18)",
                tag: "REAL-TIME SYNC",
                title: "Interactive Sessions",  
                desc: "1-on-1 live video sessions, instant doubt resolution, and continuous milestone tracking to keep you in peak momentum." 
              },
            ].map(({ icon: Icon, accent, glow, tag, title, desc }) => (
              <div key={title}
                className="group relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 shadow-lg dark:shadow-none p-8 hover:shadow-2xl dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1.5"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                
                {/* Glow bloom on card hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 70%)` }} />
                
                {/* Pill Tag */}
                <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-500/20 px-2.5 py-1 rounded-full mb-6 backdrop-blur-md">
                  {tag}
                </span>

                {/* Icon box with glowing background */}
                <div className={`relative w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="relative text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
                <p className="relative text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden bg-transparent" style={{ zIndex: 1 }}>
        <div className="relative container mx-auto px-6 max-w-6xl">
          
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-4 rounded-full text-xs font-bold tracking-widest uppercase bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-violet-500" />
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Your Path to Success
            </h2>
            <p className="mt-4 text-slate-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
              Four streamlined steps to level up your entire preparation strategy.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: "01", icon: UserCheck, title: "Sign Up",        desc: "Create your free account as a student or mentor in under a minute." },
                { num: "02", icon: Search,    title: "Find a Mentor",  desc: "Browse verified mentors by subject expertise, experience, and student reviews." },
                { num: "03", icon: Calendar,  title: "Book a Session", desc: "Pick a time slot that fits your study timetable and confirm instantly." },
                { num: "04", icon: Rocket,    title: "Get Guidance",   desc: "Attend live 1-on-1 sessions, clear doubts, and unlock your true potential." },
              ].map(({ num, icon: Icon, title, desc }) => (
                <div key={num} className="group flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/15 to-violet-600/15 border border-slate-200/80 dark:border-white/10 group-hover:border-blue-500/50 group-hover:scale-105 transition-all duration-300 shadow-md backdrop-blur-md" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-50 dark:border-[#07090f] flex items-center justify-center text-[11px] font-black text-white shadow-md">
                      {num}
                    </div>
                    <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
                  <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="relative py-16 border-y border-slate-200/80 dark:border-white/5 overflow-hidden bg-transparent" style={{ zIndex: 1 }}>
        <div className="relative container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "50,000+", label: "Aspirants Guided" },
              { val: "200+",    label: "Expert Mentors" },
              { val: "15,000+", label: "Sessions Conducted" },
              { val: "99.2%",   label: "Satisfaction Rate" },
            ].map(({ val, label }) => (
              <div key={label} className="group">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {val}
                </div>
                <div className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden bg-transparent" style={{ zIndex: 1 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 dark:bg-violet-600/15 blur-3xl pointer-events-none" />
        
        <div className="relative container mx-auto px-6 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-6 rounded-full text-xs font-bold tracking-widest uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm backdrop-blur-md">
            <Rocket className="w-3.5 h-3.5 text-blue-500" />
            Get Started Today
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
            Ready to Start Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
              Journey?
            </span>
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of aspirants and mentors building tomorrow's leaders — starting today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 text-base hover:scale-105">
              Create Free Account
            </Link>
            <Link href="/auth/login"
              className="px-8 py-4 rounded-xl font-bold text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 backdrop-blur-md transition-all duration-200 text-base hover:scale-105">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative border-t border-slate-200/80 dark:border-white/5 py-10 bg-transparent" style={{ zIndex: 1 }}>
        <div className="relative container mx-auto px-6 max-w-6xl flex flex-col items-center gap-3">
          <div className="flex gap-6 text-sm text-slate-400 dark:text-gray-500">
            <Link href="/sessions"      className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors">Sessions</Link>
            <Link href="/forum"         className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors">Forum</Link>
            <Link href="/auth/register" className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors">Register</Link>
          </div>
          <p className="text-slate-400 dark:text-gray-600 text-sm">
            Made with{" "}
            <span className="inline-block animate-pulse text-red-500 text-base align-middle">❤</span>
            {" "}by Arjeet Sir
          </p>
        </div>
      </footer>
    </div>
  );
}
