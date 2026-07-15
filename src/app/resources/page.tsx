"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  X,
  Trash2,
  Loader2,
  Search,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Folder,
  FolderPlus,
  Edit3,
  ChevronRight,
  Plus,
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  url: string;
  fileSize: number | null;
  uploaderRole: string;
  folderId: string | null;
  createdAt: string;
  uploadedBy: {
    name: string | null;
    email: string;
  };
}

interface FolderType {
  id: string;
  name: string;
  _count?: {
    resources: number;
  };
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  // Folder creation/renaming states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState("");
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderSaving, setFolderSaving] = useState(false);

  // Form Upload state
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Notification states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  // Load Resources and Folders
  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchResources(), fetchFolders()]);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while loading content.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    const res = await fetch("/api/resources");
    if (res.ok) {
      const data = await res.json();
      setResources(data);
    } else {
      setErrorMsg("Failed to fetch resources list.");
    }
  };

  const fetchFolders = async () => {
    const res = await fetch("/api/folders");
    if (res.ok) {
      const data = await res.json();
      setFolders(data);
    } else {
      console.error("Failed to fetch folders list.");
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    if (file.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported.");
      setSelectedFile(null);
      return;
    }
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("File size exceeds 15 MB limit.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    const totalUsedBytes = resources.reduce((acc, r) => acc + (r.fileSize || 0), 0);
    const limitBytes = 1024 * 1024 * 1024; // 1 GB
    if (totalUsedBytes + file.size > limitBytes) {
      setErrorMsg("File exceeds the remaining space (1 GB overall limit).");
      setSelectedFile(null);
      return;
    }
    if (!uploadTitle) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setUploadTitle(cleanName);
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle.trim()) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle.trim());
      if (activeFolderId) {
        formData.append("folderId", activeFolderId);
      }

      const res = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg("Resource uploaded successfully!");
        setUploadTitle("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchData(); // reload list and folders
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to upload file.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMsg("Resource deleted successfully.");
        setResources((prev) => prev.filter((r) => r.id !== id));
        fetchFolders(); // refresh folder count
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to delete resource.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while deleting the resource.");
    }
  };

  // Create or Rename Folder
  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    try {
      setFolderSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const isEdit = !!editingFolder;
      const url = isEdit ? `/api/folders/${editingFolder.id}` : "/api/folders";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderNameInput.trim() }),
      });

      if (res.ok) {
        setSuccessMsg(`Folder ${isEdit ? "renamed" : "created"} successfully!`);
        setFolderNameInput("");
        setEditingFolder(null);
        setShowFolderModal(false);
        fetchFolders();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || `Failed to ${isEdit ? "rename" : "create"} folder.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while saving the folder.");
    } finally {
      setFolderSaving(false);
    }
  };

  // Delete Folder
  const handleDeleteFolder = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? All files stored inside it will be permanently deleted too!`
      )
    )
      return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMsg("Folder deleted successfully.");
        if (activeFolderId === id) {
          setActiveFolderId(null);
        }
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to delete folder.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while deleting the folder.");
    }
  };

  // Helper to format file sizes
  const formatBytes = (bytes: number | null, decimals = 2) => {
    if (bytes === null) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Filters
  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = resource.folderId === activeFolderId;
    return matchesSearch && matchesFolder;
  });

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  // Authenticating Loader state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div aria-label="Loading content" role="img" className="wheel-and-hamster">
          <div className="wheel"></div>
          <div className="hamster">
            <div className="hamster__body">
              <div className="hamster__head">
                <div className="hamster__ear"></div>
                <div className="hamster__eye"></div>
                <div className="hamster__nose"></div>
              </div>
              <div className="hamster__limb hamster__limb--fr"></div>
              <div className="hamster__limb hamster__limb--fl"></div>
              <div className="hamster__limb hamster__limb--br"></div>
              <div className="hamster__limb hamster__limb--bl"></div>
              <div className="hamster__tail"></div>
            </div>
          </div>
          <div className="spoke"></div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/30 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Curated Resources
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Access and upload high-quality PDF study materials shared by mentors and students.
            </p>
          </div>
          {/* Create Folder trigger button (only visible on root level) */}
          {activeFolderId === null && (
            <button
              onClick={() => {
                setEditingFolder(null);
                setFolderNameInput("");
                setShowFolderModal(true);
              }}
              className="mx-auto sm:mx-0 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 hover:text-indigo-800 text-sm font-semibold rounded-xl border border-indigo-200 transition-colors shadow-sm shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
            <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setErrorMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-fade-in shadow-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
            <button className="ml-auto text-emerald-500 hover:text-emerald-700" onClick={() => setSuccessMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ── LEFT: Upload Container ──────────────── */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-gray-100 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-500" /> Share Resource
            </h2>

            {/* Storage Progress Bar */}
            {(() => {
              const totalUsedBytes = resources.reduce((acc, r) => acc + (r.fileSize || 0), 0);
              const limitBytes = 1024 * 1024 * 1024; // 1 GB
              const usagePercentage = Math.min((totalUsedBytes / limitBytes) * 100, 100);

              return (
                <div className="mb-5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-600 font-medium">Storage Space</span>
                    <span className="text-gray-900 font-bold">
                      {formatBytes(totalUsedBytes)} of 1 GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercentage > 90
                          ? "bg-rose-500"
                          : usagePercentage > 70
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  {totalUsedBytes >= limitBytes && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1.5 animate-pulse">
                      Storage limit reached. Delete files to upload more.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Upload target indicator */}
            <div className="mb-4 text-xs font-semibold text-gray-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 flex items-center gap-2">
              <span>📍 Uploading to:</span>
              <span className="text-indigo-700 font-bold">
                {activeFolder ? `📁 ${activeFolder.name}` : "📂 Root Level"}
              </span>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]"
                    : selectedFile
                    ? "border-emerald-400 bg-emerald-50/10"
                    : "border-gray-300 hover:border-indigo-400 bg-gray-50/30"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-emerald-500 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(selectedFile.size)}
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setUploadTitle("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      Drag & drop your PDF here
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-3">or</p>
                    <button
                      type="button"
                      className="px-4.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      Browse Files
                    </button>
                    <p className="text-[10px] text-gray-400 mt-3">
                      Max file size: 15MB. Only PDF accepted.
                    </p>
                  </div>
                )}
              </div>

              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Resource Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="Enter descriptive title..."
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !selectedFile || !uploadTitle.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex justify-center items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Upload Resource
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── RIGHT: List Container ────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Box & Breadcrumbs */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 flex-wrap text-sm text-gray-600 font-semibold">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className={`hover:text-indigo-600 transition-colors ${
                    activeFolderId === null ? "text-indigo-600 font-bold" : ""
                  }`}
                >
                  📁 All Resources
                </button>
                {activeFolder && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-bold">📂 {activeFolder.name}</span>
                  </>
                )}
              </div>

              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeFolder ? `Search inside ${activeFolder.name}...` : "Search all resources..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-inner"
                />
              </div>
            </div>

            {/* Folders List (only rendered at root level) */}
            {activeFolderId === null && folders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setActiveFolderId(folder.id)}
                      className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 shrink min-w-0">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{folder.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{folder._count?.resources || 0} PDFs</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded"
                          onClick={() => {
                            setEditingFolder(folder);
                            setFolderNameInput(folder.name);
                            setShowFolderModal(true);
                          }}
                          title="Rename Folder"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder Actions header inside folders */}
            {activeFolder && (
              <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Folder Tools</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFolder(activeFolder);
                      setFolderNameInput(activeFolder.name);
                      setShowFolderModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(activeFolder.id, activeFolder.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors border border-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                  </button>
                </div>
              </div>
            )}

            {/* Resources List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {activeFolder ? `Files in ${activeFolder.name}` : "Files (Root Level)"}
              </h2>
              {loading ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">Loading materials...</p>
                </div>
              ) : filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredResources.map((resource) => {
                    const isOwner = resource.uploadedBy.email === session.user.email;
                    const isMentorOrAdmin = session.user.role === "MENTOR" || session.user.role === "ADMIN";
                    const canDelete = isOwner || isMentorOrAdmin;

                    return (
                      <div
                        key={resource.id}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                resource.uploaderRole === "MENTOR"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : resource.uploaderRole === "ADMIN"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {resource.uploaderRole}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2" title={resource.title}>
                            {resource.title}
                          </h3>

                          <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                            <p>Size: {formatBytes(resource.fileSize)}</p>
                            <p className="truncate">
                              By: {resource.uploadedBy.name || resource.uploadedBy.email}
                            </p>
                            <p>
                              Date: {new Date(resource.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setPreviewResource(resource)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          
                          <div className="flex gap-2">
                            <a
                              href={resource.url}
                              download={resource.title}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            {canDelete && (
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 px-4">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 text-base">No resources found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload the first resource inside this section to start!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOLDER CREATION / RENAME MODAL ───────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base">
                {editingFolder ? "Rename Folder" : "Create New Folder"}
              </h2>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFolderSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="folderName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Folder Name
                </label>
                <input
                  id="folderName"
                  type="text"
                  required
                  placeholder="e.g. History Notes, Weekly Quizzes..."
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-slate-50 border border-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderSaving || !folderNameInput.trim()}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {folderSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5" /> Save Folder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PDF PREVIEW MODAL ───────────────────────── */}
      {previewResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 shrink min-w-0 pr-4">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate" title={previewResource.title}>
                  {previewResource.title}
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={previewResource.url}
                  download={previewResource.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Modal Iframe (Browser-Native PDF Viewer) */}
            <div className="flex-1 w-full h-full bg-gray-900 relative">
              <iframe
                src={previewResource.url}
                className="w-full h-full border-0 relative z-10"
                title={previewResource.title}
              />
              {/* Spinner fallback in background while PDF loads */}
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}