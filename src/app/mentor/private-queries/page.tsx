"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, Lock } from "lucide-react";

const VIEWED_QUERIES_KEY = "mentor_viewed_queries";

function getViewedQueries(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VIEWED_QUERIES_KEY) || "[]");
  } catch {
    return [];
  }
}

function markQueryAsViewed(id: string) {
  const viewed = getViewedQueries();
  if (!viewed.includes(id)) {
    localStorage.setItem(VIEWED_QUERIES_KEY, JSON.stringify([...viewed, id]));
  }
}

export default function MentorPrivateQueriesPage() {
  const { data: session } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "MENTOR") fetchQueries();
  }, [session]);

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/discussions?privateForMentor=true");
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

  if (!session || session.user.role !== "MENTOR") {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Mentor access only.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 mt-8 pt-24">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">All Student Private Queries</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : queries.length === 0 ? (
          <div className="text-center text-gray-500">No private queries from students yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queries.map((q) => {
              const viewedQueries = typeof window !== "undefined" ? getViewedQueries() : [];
              const isNew = !viewedQueries.includes(q.id);
              return (
                <Link
                  key={q.id}
                  href={`/forum/${q.id}`}
                  onClick={() => markQueryAsViewed(q.id)}
                  className="block group"
                  style={{ textDecoration: 'none' }}
                >
                  <Card
                    className={`w-full h-full p-4 sm:p-6 rounded-xl hover:shadow-xl transition-shadow duration-200 border-l-4 ${isNew ? "border-blue-500 bg-blue-50" : "border-pink-400 bg-white"} relative overflow-hidden flex flex-col group-hover:bg-blue-50 cursor-pointer`}
                  >
                    {isNew ? (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">New</span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded">Viewed</span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{q.title}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 whitespace-nowrap">{q.category}</Badge>
                        {q.isArchived && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700 ml-2 whitespace-nowrap">Archived</Badge>
                        )}
                        <Badge variant="destructive" className="flex items-center gap-1 bg-pink-100 text-pink-700 border-pink-400 whitespace-nowrap"><Lock className="w-4 h-4 mr-1" /> Private</Badge>
                      </div>
                    </div>
                    <div className="block text-gray-700 group-hover:text-blue-600 transition-colors duration-200 mb-2 text-sm sm:text-base line-clamp-2">
                      {q.content?.slice(0, 120)}{q.content?.length > 120 ? "..." : ""}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {q.tags && q.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="bg-gray-100 text-gray-600">#{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 mt-2 gap-1 mt-auto">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-user mr-1"></i>
                        {q.author?.name || "Unknown"}
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-clock mr-1"></i>
                        {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 