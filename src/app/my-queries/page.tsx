"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Send, X, MessageSquare, Sparkles } from "lucide-react";

export default function MyQueriesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ask Mentor Form state integrated inside My Queries page
  const [showAskForm, setShowAskForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState({
    title: "",
    category: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    if (searchParams?.get("ask") === "true") {
      setShowAskForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) fetchQueries();
  }, [session]);

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/discussions?privateForMe=true");
      if (res.ok) {
        const data = await res.json();
        setQueries(data);
      } else {
        setQueries([]);
      }
    } catch {
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setAskError(null);

    const data = {
      title: formFields.title,
      content: formFields.content,
      category: formFields.category,
      tags: formFields.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPrivate: true,
    };

    try {
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create private query");

      setFormFields({ title: "", category: "", content: "", tags: "" });
      setShowAskForm(false);
      fetchQueries();
    } catch (err) {
      setAskError("Failed to create private query. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (q: any) => {
    setEditingId(q.id);
    setEditFields({
      title: q.title,
      content: q.content,
      category: q.category,
      tags: q.tags?.join(", ") || "",
    });
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/discussions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editFields.title,
          content: editFields.content,
          category: editFields.category,
          tags: editFields.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to update query");
      setEditingId(null);
      fetchQueries();
    } catch {
      setError("Failed to update query.");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/discussions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete query");
      setDeletingId(null);
      fetchQueries();
    } catch {
      setError("Failed to delete query.");
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Sign in to view your private queries.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 py-12 mt-8 pt-24 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Private Queries</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Ask questions directly to mentors and manage your ongoing private discussions.</p>
          </div>
          <Button
            onClick={() => setShowAskForm((prev) => !prev)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform duration-200 hover:scale-105"
          >
            {showAskForm ? (
              <>
                <X className="w-4 h-4" /> Close Form
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Ask a Mentor
              </>
            )}
          </Button>
        </div>

        {/* Integrated Ask Mentor Form */}
        {showAskForm && (
          <Card className="p-6 mb-8 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-800 shadow-xl rounded-xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold text-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Ask a Mentor Privately
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowAskForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </Button>
            </div>
            {askError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {askError}
              </div>
            )}
            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div>
                <label htmlFor="ask-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
                <Input
                  id="ask-title"
                  value={formFields.title}
                  onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                  placeholder="Enter a descriptive title for your query..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="ask-category" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                <Input
                  id="ask-category"
                  value={formFields.category}
                  onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                  placeholder="e.g. GS Discussions, Prelims, Mains, Answer Writing"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="ask-content" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Question Details</label>
                <Textarea
                  id="ask-content"
                  value={formFields.content}
                  onChange={(e) => setFormFields({ ...formFields, content: e.target.value })}
                  placeholder="Write your question here in detail..."
                  required
                  className="min-h-[120px] w-full bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="ask-tags" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tags (Optional)</label>
                <Input
                  id="ask-tags"
                  value={formFields.tags}
                  onChange={(e) => setFormFields({ ...formFields, tags: e.target.value })}
                  placeholder="Enter tags separated by commas (e.g. History, Polity)"
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAskForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  {submitting ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Query</>}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500 dark:text-slate-400 py-8">Loading your queries...</div>
        ) : queries.length === 0 ? (
          <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm text-gray-500 dark:text-slate-400">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">No private queries found</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Have a question? Click "Ask a Mentor" above to post your first private query.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {queries.map((q, idx) => (
              <div key={q.id}>
                {editingId === q.id || deletingId === q.id ? (
                  <Card className="p-6 hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-900 border dark:border-slate-800 relative">
                    {editingId === q.id ? (
                      <div className="space-y-3">
                        <Input
                          name="title"
                          value={editFields.title}
                          onChange={handleEditChange}
                          className="mb-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                          placeholder="Title"
                        />
                        <Textarea
                          name="content"
                          value={editFields.content}
                          onChange={handleEditChange}
                          className="mb-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                          placeholder="Content"
                        />
                        <Input
                          name="category"
                          value={editFields.category}
                          onChange={handleEditChange}
                          className="mb-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                          placeholder="Category"
                        />
                        <Input
                          name="tags"
                          value={editFields.tags}
                          onChange={handleEditChange}
                          className="mb-2 bg-slate-50 dark:bg-slate-800 dark:text-white"
                          placeholder="Tags (comma separated)"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditSave(q.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">{q.title}</span>
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">{q.category}</Badge>
                            {q.isArchived && (
                              <Badge variant="secondary" className="bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 ml-2">Archived</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditClick(q)} title="Edit">
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeletingId(q.id)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <div className="block text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-2">
                          <span className="line-clamp-2 text-base">{q.content?.slice(0, 120)}{q.content?.length > 120 ? "..." : ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.tags && q.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">#{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-clock mr-1"></i>
                            {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                          </div>
                          {deletingId === q.id && (
                            <div className="ml-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 p-2 rounded">
                              <div className="mb-2 text-red-700 dark:text-red-300">Are you sure you want to delete this query?</div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)}>
                                  Yes, Delete
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Link href={`/forum/${q.id}`} className="block group">
                    <Card className="p-6 hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-900 border dark:border-slate-800 relative cursor-pointer group-hover:shadow-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold text-gray-900 dark:text-white">{q.title}</span>
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">{q.category}</Badge>
                          {q.isArchived && (
                            <Badge variant="secondary" className="bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 ml-2">Archived</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); handleEditClick(q); }} title="Edit">
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); setDeletingId(q.id); }} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <div className="block text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-2">
                        <span className="line-clamp-2 text-base">{q.content?.slice(0, 120)}{q.content?.length > 120 ? "..." : ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {q.tags && q.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">#{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-2">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-clock mr-1"></i>
                          {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
                {idx < queries.length - 1 && <div className="border-b border-gray-200 dark:border-slate-800 my-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}