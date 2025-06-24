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
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Discussion not found</h2>
        <p className="text-gray-600 mt-2">The discussion you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const isPrivate = discussion.isPrivate;

  return (
    <div className="container mx-auto py-8 pt-24 px-4 sm:px-8 lg:px-24">
      <Card className={`p-6 mb-8 ${isPrivate ? "border-l-8 border-pink-500 bg-pink-50" : ""}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold mb-0">{discussion.title}</h1>
              {isPrivate && (
                <Badge variant="destructive" className="flex items-center gap-1 bg-pink-100 text-pink-700 border-pink-400"><Lock className="w-4 h-4 mr-1" /> Private</Badge>
              )}
            </div>
            <div className="flex gap-2 mb-4">
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
                Only you and mentors can see this private query and its replies.
              </div>
            )}
          </div>
          {session?.user?.role === "MENTOR" && (
            <div className="flex gap-2">
              {!discussion.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
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
                  onClick={handleArchive}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="text-gray-800 text-lg mb-4 whitespace-pre-line">{discussion.content}</div>
        <div className="text-sm text-gray-500 mb-2">Asked {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })} by {discussion.author.name}</div>
      </Card>
      {/* Replies Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Replies</h2>
        {discussion.comments.length === 0 ? (
          <div className="text-gray-500 mb-4">No replies yet.</div>
        ) : (
          <div className="space-y-4">
            {discussion.comments.map((c) => (
              <Card key={c.id} className="p-4 flex gap-4 items-start bg-gray-50">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{c.author.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{c.author.name}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className="text-gray-700 whitespace-pre-line">{c.content}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Add Reply */}
      {session && (
        <form onSubmit={handleSubmitComment} className="bg-white rounded-lg shadow p-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a reply..."
            className="mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !comment.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 