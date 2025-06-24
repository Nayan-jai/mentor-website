"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";

const VIEWED_DISCUSSIONS_KEY = "forum_viewed_discussions";

function getViewedDiscussions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VIEWED_DISCUSSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function markDiscussionAsViewed(id: string) {
  const viewed = getViewedDiscussions();
  if (!viewed.includes(id)) {
    localStorage.setItem(VIEWED_DISCUSSIONS_KEY, JSON.stringify([...viewed, id]));
  }
}

export default function ForumPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showStickyOnly, setShowStickyOnly] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      // Optionally add more filters
      const res = await fetch(`/api/discussions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data);
      } else {
        setDiscussions([]);
      }
    } catch {
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
    // eslint-disable-next-line
  }, [searchQuery, selectedCategory, showStickyOnly]);

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSticky = !showStickyOnly || discussion.isSticky;
    // Only mentors can see private discussions
    if (discussion.isPrivate && session?.user?.role !== "MENTOR") return false;
    return matchesSticky;
  });

  // Separate private and public discussions for mentors
  let privateDiscussions: any[] = [];
  let publicDiscussions: any[] = [];
  if (session?.user?.role === "MENTOR") {
    privateDiscussions = discussions.filter((d) => d.isPrivate);
    publicDiscussions = discussions.filter((d) => !d.isPrivate);
  } else {
    publicDiscussions = filteredDiscussions;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 mt-8 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Forum
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join the conversation, share your knowledge, and learn from others in
            our vibrant community.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                type="search"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="GS Discussions">GS Discussions</SelectItem>
                  <SelectItem value="Prelims">Prelims</SelectItem>
                  <SelectItem value="Mains">Mains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sticky-only"
                checked={showStickyOnly}
                onCheckedChange={setShowStickyOnly}
              />
              <label
                htmlFor="sticky-only"
                className="text-sm font-medium text-gray-700"
              >
                Sticky Only
              </label>
            </div>
          </div>

          {session && (
            <div className="flex justify-end mb-6">
              <Link href="/forum/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                  <i className="fas fa-plus mr-2"></i>
                  New Discussion
                </Button>
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading discussions...</div>
            ) : publicDiscussions.length === 0 ? (
              <div className="text-center text-gray-500">No discussions found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicDiscussions.map((discussion) => {
                  const viewedDiscussions = typeof window !== "undefined" ? getViewedDiscussions() : [];
                  const isNew = !viewedDiscussions.includes(discussion.id);
                  return (
                    <Link
                      key={discussion.id}
                      href={`/forum/${discussion.id}`}
                      onClick={() => markDiscussionAsViewed(discussion.id)}
                      className="group"
                      style={{ textDecoration: 'none' }}
                    >
                      <Card
                        className={`cursor-pointer w-full h-full p-4 sm:p-6 rounded-xl group-hover:shadow-2xl hover:shadow-xl transition-shadow duration-200 border-l-4 ${isNew ? "border-green-500 bg-green-50" : "border-blue-400 bg-white"} flex flex-col relative`}
                      >
                        {isNew ? (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
                        ) : (
                          <span className="absolute top-2 right-2 bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded">Viewed</span>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                            {discussion.isSticky && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                <i className="fas fa-thumbtack mr-1"></i>
                                Sticky
                              </Badge>
                            )}
                            <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{discussion.title}</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 whitespace-nowrap">{discussion.category}</Badge>
                            {discussion.isArchived && (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-700 ml-2 whitespace-nowrap">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <div className="block text-gray-700 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                          <span className="line-clamp-2 text-base">{discussion.content?.slice(0, 120)}{discussion.content?.length > 120 ? "..." : ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {discussion.tags && discussion.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-gray-100 text-gray-600"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 mt-2 gap-1 mt-auto">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-user mr-1"></i>
                            {discussion.author?.name || "Unknown"}
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-clock mr-1"></i>
                            {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <span>
                              <i className="fas fa-comments mr-1"></i>
                              {discussion.comments?.length || 0}
                            </span>
                            <span>
                              <i className="fas fa-eye mr-1"></i>
                              {discussion.views || 0}
                            </span>
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
      </div>
    </div>
  );
} 