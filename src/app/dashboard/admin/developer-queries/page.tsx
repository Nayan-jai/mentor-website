"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  CheckCircle2,
  Clock,
  Paperclip,
  Search,
  Filter,
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminDeveloperQueriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selected query for details & admin editing
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (session && session.user.role !== "ADMIN") {
      router.push("/profile");
    } else if (session) {
      fetchQueries();
    }
  }, [session, status, router]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/developer-queries");
      if (res.ok) {
        const data = await res.json();
        setQueries(data || []);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;

    try {
      setUpdating(true);
      const res = await fetch("/api/admin/developer-queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedQuery.id,
          status: editStatus,
          adminNotes: editAdminNotes,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUpdateMsg("Query status & admin note updated!");
        setSelectedQuery(updated);
        fetchQueries();
        setTimeout(() => setUpdateMsg(""), 3000);
      } else {
        alert("Failed to update query.");
      }
    } catch (error) {
      console.error("Error updating query:", error);
      alert("An error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    const matchesType = typeFilter === "ALL" || q.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = queries.filter((q) => q.status === "PENDING").length;
  const bugCount = queries.filter((q) => q.type === "BUG").length;
  const featureCount = queries.filter((q) => q.type === "FEATURE").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                className="p-0 h-auto font-semibold hover:bg-transparent text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
              </Button>
              <span>/</span>
              <span>Developer Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <MessageSquarePlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Developer Queries &amp; Bug Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review student feature requests, inspect bug reports with attached screenshots, and post resolution notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-rose-500 text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
              <Bug className="w-3.5 h-3.5" /> {bugCount} Bugs
            </Badge>
            <Badge className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" /> {featureCount} Features
            </Badge>
            <Badge className="bg-amber-500 text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending
            </Badge>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by query, description, user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="BUG">Bug Reports</option>
              <option value="FEATURE">Feature Requests</option>
              <option value="GENERAL">General Feedback</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid: Query List & Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Query List Column (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-3">
            {loading ? (
              <Card className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                Loading developer queries...
              </Card>
            ) : filteredQueries.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                No developer queries match your filter criteria.
              </Card>
            ) : (
              filteredQueries.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuery(q);
                    setEditStatus(q.status);
                    setEditAdminNotes(q.adminNotes || "");
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                    selectedQuery?.id === q.id
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 ${
                          q.type === "BUG"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300"
                            : q.type === "FEATURE"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                        }`}
                      >
                        {q.type === "BUG" && <Bug className="w-3 h-3" />}
                        {q.type === "FEATURE" && <Lightbulb className="w-3 h-3" />}
                        {q.type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {q.subject}
                      </h4>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold px-2.5 py-0.5 shrink-0 ${
                        q.status === "RESOLVED"
                          ? "bg-emerald-600 text-white"
                          : q.status === "IN_PROGRESS"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-600 text-white"
                      }`}
                    >
                      {q.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {q.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {q.user?.name || "Student"}
                      </span>
                      <span>({q.user?.email})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {q.screenshotUrl && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> Screenshot attached
                        </span>
                      )}
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail & Action Panel (Cols 8-12) */}
          <div className="lg:col-span-5">
            {selectedQuery ? (
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl sticky top-24 space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase inline-block mb-1 ${
                        selectedQuery.type === "BUG"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : selectedQuery.type === "FEATURE"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {selectedQuery.type}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedQuery.subject}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuery(null)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedQuery.user?.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{selectedQuery.user?.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Role: {selectedQuery.user?.role || "STUDENT"}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Full Description
                  </h4>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedQuery.description}
                  </div>
                </div>

                {/* Screenshot Attached */}
                {selectedQuery.screenshotUrl && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-500" /> Attached Screenshot
                    </h4>
                    <div
                      onClick={() => setPreviewScreenshot(selectedQuery.screenshotUrl)}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group max-h-48"
                    >
                      <img
                        src={selectedQuery.screenshotUrl}
                        alt="Submitted Screenshot"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ExternalLink className="w-4 h-4" /> Click to Expand
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Status & Notes Form */}
                <form onSubmit={handleUpdateQuery} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Admin Action &amp; Notes
                  </h4>

                  {updateMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      {updateMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Status State
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Developer / Admin Response Note (Visible to Student)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter update note or resolution status for the student..."
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl"
                  >
                    {updating ? "Saving Update..." : "Save Status & Note"}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
                Click any query from the list to view full description, inspect attached screenshots, and update status.
              </Card>
            )}
          </div>

        </div>
      </div>

      {/* Screenshot Expand Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setPreviewScreenshot(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 bg-black/50 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewScreenshot}
              alt="Expanded Screenshot"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
