"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, MessageSquare, Archive, CheckCircle } from "lucide-react";

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

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      fetchDiscussion();
    }
  }, [params.id, status]);

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/discussions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiscussion(data);
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/discussions/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-color"></div>
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

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{discussion.title}</h1>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">{discussion.category}</Badge>
              {discussion.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
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

        <div className="prose max-w-none mb-8">
          {discussion.content}
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={`https://avatar.vercel.sh/${discussion.author.id}`} alt={discussion.author.name} />
            <AvatarFallback>{discussion.author.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <span>Posted by {discussion.author.name}</span>
          <span className="mx-2">•</span>
          <span>{formatDistanceToNow(new Date(discussion.createdAt))} ago</span>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Comments</h2>
        
        {session?.user && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {discussion.comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${comment.author.id}`} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 