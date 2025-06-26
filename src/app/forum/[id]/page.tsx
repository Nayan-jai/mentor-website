"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, MessageSquare, Archive, CheckCircle, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  isAnswer: boolean;
  upvotes: number;
  downvotes: number;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  isPrivate: boolean;
  isArchived: boolean;
  isResolved: boolean;
  category: string;
  tags: string[];
  comments: Comment[];
}

export default function DiscussionPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchDiscussion();
    }
  }, [params.id, status]);

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/discussions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiscussion(data);
        setAccessDenied(false);
      } else if (response.status === 403) {
        setAccessDenied(true);
        setDiscussion(null);
      } else {
        setDiscussion(null);
        setAccessDenied(false);
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
      setDiscussion(null);
      setAccessDenied(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment, discussionId: params.id }),
      });

      if (response.ok) {
        setComment("");
        fetchDiscussion();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/discussions/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isResolved: true }),
      });

      if (response.ok) {
        fetchDiscussion();
      }
    } catch (error) {
      console.error("Error marking as resolved:", error);
    }
  };

  const handleArchive = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/discussions/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isArchived: true }),
      });

      if (response.ok) {
        fetchDiscussion();
      }
    } catch (error) {
      console.error("Error archiving discussion:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await fetch(`/api/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      fetchDiscussion();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await fetch(`/api/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: editContent }),
      });
      setEditingCommentId(null);
      setEditContent("");
      fetchDiscussion();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-color"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600 mt-2">This private discussion is only visible to the student who asked and mentors.</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-color"></div>
        <span className="ml-4 text-gray-600 text-lg">Loading...</span>
      </div>
    );
  }

  const isPrivate = discussion.isPrivate;

  return (
    <div className="container mx-auto py-8 pt-24 px-2 sm:px-4 md:px-8 lg:px-24">
      <Card className={`p-4 sm:p-6 mb-8 ${isPrivate ? "border-l-8 border-pink-500 bg-pink-50" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold mb-0 break-words truncate max-w-full">{discussion.title}</h1>
              {isPrivate && (
                <Badge variant="destructive" className="flex items-center gap-1 bg-pink-100 text-pink-700 border-pink-400"><Lock className="w-4 h-4 mr-1" /> Private</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{discussion.category}</Badge>
              {discussion.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            {isPrivate && (
              <div className="mb-4 p-3 rounded bg-pink-100 border border-pink-200 text-pink-800 flex items-center gap-2">
                <Lock className="w-4 h-4 mr-1" />
                <span className="truncate">Only you and mentors can see this private query and its replies.</span>
              </div>
            )}
          </div>
          {session?.user?.role === "MENTOR" && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {!discussion.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleMarkAsResolved}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Resolved
                </Button>
              )}
              {!discussion.isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleArchive}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="text-gray-800 text-base sm:text-lg mb-4 whitespace-pre-line break-words">{discussion.content}</div>
        <div className="text-xs sm:text-sm text-gray-500 mb-2 break-words">Asked {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })} by {discussion.author.name}</div>
      </Card>
      {/* Replies Section */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Replies</h2>
        {discussion.comments.length === 0 ? (
          <div className="text-gray-500 mb-4">No replies yet.</div>
        ) : (
          <div className="space-y-4">
            {discussion.comments.map((c) => {
              const canEdit = session?.user && session.user.id === c.author.id;
              const canDelete = session?.user && session.user.id === c.author.id;
              return (
                <Card key={c.id} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start bg-gray-50">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarFallback>{c.author.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 break-words truncate max-w-full">{c.author.name}</span>
                      <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="flex flex-col gap-2">
                        <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full" />
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" onClick={() => handleEditComment(c.id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700 whitespace-pre-line break-words">{c.content}</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {canEdit && editingCommentId !== c.id && (
                        <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(c.id); setEditContent(c.content); }}>Edit</Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteComment(c.id)}>Delete</Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {/* Add Reply */}
      {session && (
        <form onSubmit={handleSubmitComment} className="bg-white rounded-lg shadow p-3 sm:p-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a reply..."
            className="mb-2"
            rows={2}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="submit" disabled={isSubmitting || !comment.trim()} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              {isSubmitting ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 