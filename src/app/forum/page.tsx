"use client";

import { useState } from "react";
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

// Mock data for discussions
const mockDiscussions = [
  {
    id: 1,
    title: "Getting Started with Web Development",
    author: "John Doe",
    category: "Web Development",
    replies: 12,
    views: 245,
    lastActivity: new Date("2024-03-15T10:30:00"),
    isSticky: true,
    tags: ["beginner", "html", "css"],
  },
  {
    id: 2,
    title: "Best Practices for React State Management",
    author: "Jane Smith",
    category: "React",
    replies: 8,
    views: 189,
    lastActivity: new Date("2024-03-15T09:15:00"),
    isSticky: false,
    tags: ["react", "state", "hooks"],
  },
  {
    id: 3,
    title: "Understanding TypeScript Generics",
    author: "Mike Johnson",
    category: "TypeScript",
    replies: 15,
    views: 320,
    lastActivity: new Date("2024-03-14T16:45:00"),
    isSticky: false,
    tags: ["typescript", "generics", "advanced"],
  },
];

export default function ForumPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showStickyOnly, setShowStickyOnly] = useState(false);

  const filteredDiscussions = mockDiscussions.filter((discussion) => {
    const matchesSearch = discussion.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || discussion.category === selectedCategory;
    const matchesSticky = !showStickyOnly || discussion.isSticky;
    return matchesSearch && matchesCategory && matchesSticky;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
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
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
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
            {filteredDiscussions.map((discussion) => (
              <Card
                key={discussion.id}
                className="p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {discussion.isSticky && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <i className="fas fa-thumbtack mr-1"></i>
                          Sticky
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {discussion.category}
                      </Badge>
                    </div>
                    <Link
                      href={`/forum/${discussion.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                    >
                      {discussion.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {discussion.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-gray-50 text-gray-600"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col items-end">
                    <div className="text-sm text-gray-500">
                      <i className="fas fa-user mr-1"></i>
                      {discussion.author}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <i className="fas fa-clock mr-1"></i>
                      {formatDistanceToNow(discussion.lastActivity, {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>
                        <i className="fas fa-comments mr-1"></i>
                        {discussion.replies}
                      </span>
                      <span>
                        <i className="fas fa-eye mr-1"></i>
                        {discussion.views}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 