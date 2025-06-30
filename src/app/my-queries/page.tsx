"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function MyQueriesPage() {
  const { data: session } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 mt-8 pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-200 mt-2 mb-8">My Private Queries to Mentors</h1>
        <div className="flex items-center justify-between mb-6">
          <Link href="/ask-mentor">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> New Private Query
            </Button>
          </Link>
        </div>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : queries.length === 0 ? (
          <div className="text-center text-gray-500">You have not asked any private queries yet.</div>
        ) : (
          <div className="space-y-6">
            {queries.map((q, idx) => (
              <div key={q.id}>
                {editingId === q.id || deletingId === q.id ? (
                  <Card className="p-6 hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 bg-white relative">
                    {editingId === q.id ? (
                      <div className="space-y-3">
                        <Input
                          name="title"
                          value={editFields.title}
                          onChange={handleEditChange}
                          className="mb-2"
                          placeholder="Title"
                        />
                        <Textarea
                          name="content"
                          value={editFields.content}
                          onChange={handleEditChange}
                          className="mb-2"
                          placeholder="Content"
                        />
                        <Input
                          name="category"
                          value={editFields.category}
                          onChange={handleEditChange}
                          className="mb-2"
                          placeholder="Category"
                        />
                        <Input
                          name="tags"
                          value={editFields.tags}
                          onChange={handleEditChange}
                          className="mb-2"
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
                            <span className="text-xl font-semibold text-gray-900">{q.title}</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">{q.category}</Badge>
                            {q.isArchived && (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-700 ml-2">Archived</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditClick(q)} title="Edit">
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeletingId(q.id)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="block text-gray-700 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                          <span className="line-clamp-2 text-base">{q.content?.slice(0, 120)}{q.content?.length > 120 ? "..." : ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {q.tags && q.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="bg-gray-100 text-gray-600">#{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-clock mr-1"></i>
                            {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                          </div>
                          {deletingId === q.id && (
                            <div className="ml-4 bg-red-50 border border-red-200 p-2 rounded">
                              <div className="mb-2 text-red-700">Are you sure you want to delete this query?</div>
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
                    <Card className="p-6 hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 bg-white relative cursor-pointer group-hover:shadow-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold text-gray-900">{q.title}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">{q.category}</Badge>
                          {q.isArchived && (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-700 ml-2">Archived</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditClick(q)} title="Edit">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeletingId(q.id)} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="block text-gray-700 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                        <span className="line-clamp-2 text-base">{q.content?.slice(0, 120)}{q.content?.length > 120 ? "..." : ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {q.tags && q.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-gray-100 text-gray-600">#{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-clock mr-1"></i>
                          {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
                {idx < queries.length - 1 && <div className="border-b border-gray-200 my-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 