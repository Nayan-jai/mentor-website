"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function AskMentorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      content: formData.get("content"),
      category: formData.get("category"),
      tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()),
      isPrivate: true,
    };

    try {
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create private query");
      router.push("/my-queries");
    } catch (err) {
      setError("Failed to create private query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to ask a private question.</p>
          <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 mt-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Ask a Mentor Privately</h1>
          <p className="text-gray-200">Submit a private question to mentors. Only you and mentors will see this query and its replies.</p>
        </div>
        <Card className="p-6 bg-gray-900">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-600">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <Input id="title" name="title" placeholder="Enter a descriptive title" required className="w-full" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <Input id="category" name="category" placeholder="e.g. GS Discussions, Prelims, Mains" required className="w-full" />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <Textarea id="content" name="content" placeholder="Write your question here..." required className="min-h-[120px] w-full" />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <Input id="tags" name="tags" placeholder="Enter tags separated by commas" className="w-full" />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="px-6">Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                {loading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>) : (<><i className="fas fa-paper-plane mr-2"></i>Ask Mentor</>)}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 