"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Edit2, Check, AlertCircle, Calendar, BookOpen, Layers, PlusCircle, X, FileSpreadsheet, Download } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  defaultHrs: number;
  topics?: {
    id: string;
    name: string;
    subtopics: string[];
  }[];
}

interface Block {
  id: string;
  subjectId: string;
  targetHrs: number;
  topic: string;
  subtopics: string[];
}

interface Day {
  id: string;
  title: string;
  dateOverride: string | null;
  targetHrs: number;
  blocks: Block[];
}

interface SyllabusTemplate {
  examName: string;
  subj: Subject[];
  days: Day[];
}

type SyllabiMap = Record<string, SyllabusTemplate>;

const PRESET_COLORS = [
  { value: "var(--blue)", label: "Blue 🔵" },
  { value: "var(--red)", label: "Red 🔴" },
  { value: "var(--green)", label: "Green 🟢" },
  { value: "var(--orange)", label: "Orange 🟠" },
  { value: "var(--purple)", label: "Purple 🟣" },
  { value: "var(--teal)", label: "Teal 💎" },
  { value: "var(--gold)", label: "Gold 🟡" },
  // Gradients
  { value: "linear-gradient(135deg, #ff5e62, #ff9966)", label: "Sunset Glow 🌅" },
  { value: "linear-gradient(135deg, #00c6ff, #0072ff)", label: "Ocean Breeze 🌊" },
  { value: "linear-gradient(135deg, #f107a3, #7b2ff7)", label: "Neon Purple 🌌" },
  { value: "linear-gradient(135deg, #11998e, #38ef7d)", label: "Forest Fresh 🌿" },
  { value: "linear-gradient(135deg, #8a2387, #e94057, #f27121)", label: "Aurora Lights 🎆" },
  { value: "linear-gradient(135deg, #f12711, #f5af19)", label: "Citrus Punch 🍊" }
];

const PRESET_ICONS = ["⚖️","🏛️","📈","🗺️","🌿","🚀","🔢","📚","📖","📝","✏️","🔬","🏮","🕌","💡","🎯","📊","🌍","⚡","🎓"];

export default function AdminSyllabusPage() {
  const [syllabi, setSyllabi] = useState<SyllabiMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selector state
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Edit states
  const [editKey, setEditKey] = useState("");
  const [editName, setEditName] = useState("");
  const [editSubjects, setEditSubjects] = useState<Subject[]>([]);
  const [editDays, setEditDays] = useState<Day[]>([]);
  const [newSubtopicTexts, setNewSubtopicTexts] = useState<Record<string, string>>({});
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/syllabus");
      if (!res.ok) throw new Error("Failed to load syllabus templates");
      const data = await res.json();
      setSyllabi(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    setEditKey(key);
    setEditName(syllabi[key].examName);
    setEditSubjects(JSON.parse(JSON.stringify(syllabi[key].subj || [])));
    setEditDays(JSON.parse(JSON.stringify(syllabi[key].days || [])));
    setIsNew(false);
    setError(null);
    setSuccess(null);
  };

  const handleCreateNew = () => {
    setSelectedKey(null);
    setEditKey("new_exam_key");
    setEditName("New Exam Title");
    setEditSubjects([
      { id: "s1", name: "Polity", color: "var(--red)", icon: "⚖️", defaultHrs: 3 }
    ]);
    setEditDays([
      {
        id: "d1",
        title: "Day 1 Focus",
        dateOverride: null,
        targetHrs: 8,
        blocks: [
          {
            id: "b1",
            subjectId: "s1",
            targetHrs: 3,
            topic: "Introduction",
            subtopics: ["Subtopic 1"]
          }
        ]
      }
    ]);
    setIsNew(true);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteTemplate = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the "${syllabi[key].examName}" syllabus template?`)) {
      return;
    }

    const updated = { ...syllabi };
    delete updated[key];

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/admin/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to delete template");
      setSyllabi(updated);
      setSuccess("Template deleted successfully");
      if (selectedKey === key) {
        setSelectedKey(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete template");
    }
  };

  // Subject actions
  const handleAddSubject = () => {
    const nextId = "s_" + Date.now();
    const newSubj: Subject = {
      id: nextId,
      name: "New Subject",
      color: "var(--blue)",
      icon: "📚",
      defaultHrs: 3
    };
    setEditSubjects([...editSubjects, newSubj]);
  };

  const handleUpdateSubject = (idx: number, fields: Partial<Subject>) => {
    const list = [...editSubjects];
    list[idx] = { ...list[idx], ...fields };
    setEditSubjects(list);
  };

  const handleDeleteSubject = (idx: number) => {
    const target = editSubjects[idx];
    // Check if subject is currently used in any blocks
    const isUsed = editDays.some(d => d.blocks.some(b => b.subjectId === target.id));
    if (isUsed) {
      alert(`Subject "${target.name}" is scheduled on one or more study days. Remove it from all days before deleting.`);
      return;
    }
    setEditSubjects(editSubjects.filter((_, i) => i !== idx));
  };

  const handleAddSyllabusTopic = (idx: number) => {
    const list = [...editSubjects];
    const topics = [...(list[idx].topics || [])];
    topics.push({
      id: "t_" + Date.now() + Math.random().toString(36).slice(2, 5),
      name: "",
      subtopics: [""]
    });
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleUpdateSyllabusTopic = (idx: number, tIdx: number, val: string) => {
    const list = [...editSubjects];
    const topics = [...(list[idx].topics || [])];
    topics[tIdx] = { ...topics[tIdx], name: val };
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleDeleteSyllabusTopic = (idx: number, tIdx: number) => {
    const list = [...editSubjects];
    const topics = (list[idx].topics || []).filter((_, i) => i !== tIdx);
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleAddSyllabusSubtopic = (idx: number, tIdx: number) => {
    const list = [...editSubjects];
    const topics = [...(list[idx].topics || [])];
    const subtopics = [...topics[tIdx].subtopics];
    subtopics.push("");
    topics[tIdx] = { ...topics[tIdx], subtopics };
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleUpdateSyllabusSubtopic = (idx: number, tIdx: number, stIdx: number, val: string) => {
    const list = [...editSubjects];
    const topics = [...(list[idx].topics || [])];
    const subtopics = [...topics[tIdx].subtopics];
    subtopics[stIdx] = val;
    topics[tIdx] = { ...topics[tIdx], subtopics };
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleDeleteSyllabusSubtopic = (idx: number, tIdx: number, stIdx: number) => {
    const list = [...editSubjects];
    const topics = [...(list[idx].topics || [])];
    const subtopics = topics[tIdx].subtopics.filter((_, i) => i !== stIdx);
    topics[tIdx] = { ...topics[tIdx], subtopics };
    list[idx] = { ...list[idx], topics };
    setEditSubjects(list);
  };

  const handleGenerateBlocksFromForm = (idx: number) => {
    const s = editSubjects[idx];
    const topics = s.topics || [];
    const validTopics = topics.filter(t => t.name.trim());
    if (validTopics.length === 0) {
      alert("Please fill in at least one topic name first.");
      return;
    }

    const confirmGen = confirm(`Generate and append ${validTopics.length} topic blocks for "${s.name}" to the schedule? (This will add blocks to existing days or create new days if needed)`);
    if (!confirmGen) return;

    const list = [...editDays];
    validTopics.forEach((t, pIdx) => {
      let day = list[pIdx];
      if (!day) {
        const nextId = "d_" + (Date.now() + pIdx);
        day = {
          id: nextId,
          title: `Day ${list.length + 1}`,
          dateOverride: null,
          targetHrs: 8,
          blocks: []
        };
        list.push(day);
      }
      
      const blockId = "b_" + (Date.now() + pIdx) + Math.random().toString(36).slice(2, 5);
      const cleanSubtopics = t.subtopics.map(st => st.trim()).filter(Boolean);
      day.blocks.push({
        id: blockId,
        subjectId: s.id,
        targetHrs: s.defaultHrs || 3,
        topic: t.name.trim(),
        subtopics: cleanSubtopics
      });
    });

    setEditDays(list);
    alert(`Successfully generated ${validTopics.length} topic blocks across the schedule days!`);
  };

  const handleImportCSV = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const importedTopicsMap: Record<string, string[]> = {};

      lines.forEach((line, lineIdx) => {
        if (lineIdx === 0 && (line.toLowerCase().includes("topic") || line.toLowerCase().includes("subtopic"))) {
          // Skip header row if it contains column labels
          return;
        }
        
        const cols = line.split(/[,;\t]/); 
        if (cols.length === 0) return;

        const topicName = cols[0]?.trim();
        const subtopicName = cols[1]?.trim();

        if (topicName) {
          if (!importedTopicsMap[topicName]) {
            importedTopicsMap[topicName] = [];
          }
          if (subtopicName) {
            importedTopicsMap[topicName].push(subtopicName);
          }
        }
      });

      const parsedTopics = Object.keys(importedTopicsMap).map(name => ({
        id: "t_" + Date.now() + Math.random().toString(36).slice(2, 5),
        name,
        subtopics: importedTopicsMap[name].length > 0 ? importedTopicsMap[name] : [""]
      }));

      if (parsedTopics.length === 0) {
        alert("No valid topics found in the CSV. Make sure Column 1 has Topic names and Column 2 has Subtopics.");
        return;
      }

      const list = [...editSubjects];
      const currentTopics = [...(list[idx].topics || [])];
      list[idx] = { ...list[idx], topics: [...currentTopics, ...parsedTopics] };
      setEditSubjects(list);
      alert(`Imported ${parsedTopics.length} topics from CSV successfully!`);
    };
    reader.readAsText(file);
  };

  // Study Days Schedule Bulk CSV Import & Export handlers
  const handleImportScheduleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      const dayGroupMap: Record<string, { targetHrs: number; blocks: Block[] }> = {};
      const updatedSubjects = [...editSubjects];

      lines.forEach((line, lineIdx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Skip header row if it contains column labels
        if (lineIdx === 0 && (trimmedLine.toLowerCase().includes("day") || trimmedLine.toLowerCase().includes("subject"))) {
          return;
        }

        // CSV parsing supporting quoted fields or standard comma/tab separation
        const cols: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < trimmedLine.length; i++) {
          const char = trimmedLine[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === '\t') && !inQuotes) {
            cols.push(cur.trim().replace(/^"|"$/g, ''));
            cur = "";
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim().replace(/^"|"$/g, ''));

        if (cols.length < 2) return;

        const dayTitle = cols[0] || "Day 1 Focus";
        const targetHrs = parseInt(cols[1]) || 8;
        const subjectName = cols[2] || "General";
        const topicName = cols[3] || "Study Topic";
        const blockHrs = parseInt(cols[4]) || 3;
        const rawSubtopics = cols[5] ? cols[5].split(/[;|]/).map(s => s.trim()).filter(Boolean) : [];

        // Match subject by name or create if missing
        let matchedSubj = updatedSubjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
        if (!matchedSubj && subjectName) {
          const newSubjId = "s_" + Date.now() + Math.random().toString(36).slice(2, 5);
          matchedSubj = {
            id: newSubjId,
            name: subjectName,
            color: PRESET_COLORS[updatedSubjects.length % PRESET_COLORS.length].value,
            icon: "📚",
            defaultHrs: 3,
            topics: []
          };
          updatedSubjects.push(matchedSubj);
        } else if (!matchedSubj && updatedSubjects.length > 0) {
          matchedSubj = updatedSubjects[0];
        }

        if (!dayGroupMap[dayTitle]) {
          dayGroupMap[dayTitle] = { targetHrs, blocks: [] };
        }

        if (matchedSubj) {
          // Add topic to subject if not present
          if (!matchedSubj.topics) matchedSubj.topics = [];
          const existingTopic = matchedSubj.topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
          if (!existingTopic) {
            matchedSubj.topics.push({
              id: "t_" + Date.now() + Math.random().toString(36).slice(2, 5),
              name: topicName,
              subtopics: rawSubtopics.length > 0 ? rawSubtopics : ["Core Principles"]
            });
          }

          const blockId = "b_" + Date.now() + Math.random().toString(36).slice(2, 6);
          dayGroupMap[dayTitle].blocks.push({
            id: blockId,
            subjectId: matchedSubj.id,
            targetHrs: blockHrs,
            topic: topicName,
            subtopics: rawSubtopics
          });
        }
      });

      const parsedDays: Day[] = Object.keys(dayGroupMap).map((title, dIdx) => ({
        id: "d_" + Date.now() + dIdx,
        title,
        dateOverride: null,
        targetHrs: dayGroupMap[title].targetHrs,
        blocks: dayGroupMap[title].blocks
      }));

      if (parsedDays.length === 0) {
        alert("No valid schedule days found in the file. Format should be: DayTitle,TargetHrs,SubjectName,Topic,BlockHrs,Subtopics");
        return;
      }

      setEditSubjects(updatedSubjects);
      setEditDays(parsedDays);
      alert(`Successfully imported ${parsedDays.length} study days with ${parsedDays.reduce((acc, d) => acc + d.blocks.length, 0)} schedule blocks!`);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportScheduleCSV = () => {
    if (!editDays || editDays.length === 0) {
      alert("No study days schedule data to export.");
      return;
    }

    const rows: string[] = ["DayTitle,TargetHrs,SubjectName,Topic,BlockHrs,Subtopics"];

    editDays.forEach(d => {
      if (!d.blocks || d.blocks.length === 0) {
        rows.push(`"${d.title.replace(/"/g, '""')}",${d.targetHrs},"","","",""`);
      } else {
        d.blocks.forEach(b => {
          const s = editSubjects.find(subj => subj.id === b.subjectId);
          const subjName = s ? s.name : "General";
          const subtopicsStr = (b.subtopics || []).join("; ");
          rows.push(`"${d.title.replace(/"/g, '""')}",${d.targetHrs},"${subjName.replace(/"/g, '""')}","${b.topic.replace(/"/g, '""')}",${b.targetHrs},"${subtopicsStr.replace(/"/g, '""')}"`);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    const fileName = `${(editName || "study_schedule").toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_days_schedule.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Day actions
  const handleAddDay = () => {
    const nextId = "d_" + Date.now();
    const newDay: Day = {
      id: nextId,
      title: `Day ${editDays.length + 1}`,
      dateOverride: null,
      targetHrs: 8,
      blocks: []
    };
    setEditDays([...editDays, newDay]);
  };

  const handleUpdateDay = (dayIdx: number, fields: Partial<Day>) => {
    const list = [...editDays];
    list[dayIdx] = { ...list[dayIdx], ...fields };
    setEditDays(list);
  };

  const handleDeleteDay = (dayIdx: number) => {
    if (!confirm(`Are you sure you want to delete this study day and all its scheduled topics?`)) {
      return;
    }
    setEditDays(editDays.filter((_, i) => i !== dayIdx));
  };

  // Block actions
  const handleAddBlock = (dayIdx: number) => {
    if (editSubjects.length === 0) {
      alert("Please add at least one subject before scheduling topics.");
      return;
    }
    const nextId = "b_" + Date.now() + Math.random().toString(36).slice(2, 5);
    const newBlock: Block = {
      id: nextId,
      subjectId: editSubjects[0].id,
      targetHrs: 3,
      topic: "New Topic",
      subtopics: []
    };

    const list = [...editDays];
    list[dayIdx].blocks.push(newBlock);
    setEditDays(list);
  };

  const handleUpdateBlock = (dayIdx: number, blockIdx: number, fields: Partial<Block>) => {
    const list = [...editDays];
    list[dayIdx].blocks[blockIdx] = { ...list[dayIdx].blocks[blockIdx], ...fields };
    setEditDays(list);
  };

  const handleDeleteBlock = (dayIdx: number, blockIdx: number) => {
    const list = [...editDays];
    list[dayIdx].blocks.splice(blockIdx, 1);
    setEditDays(list);
  };

  // Subtopics actions
  const handleAddSubtopic = (dayIdx: number, blockIdx: number, blockId: string) => {
    const text = newSubtopicTexts[blockId]?.trim();
    if (!text) return;

    const list = [...editDays];
    const subtopics = [...list[dayIdx].blocks[blockIdx].subtopics];
    subtopics.push(text);
    list[dayIdx].blocks[blockIdx].subtopics = subtopics;
    
    setEditDays(list);
    setNewSubtopicTexts({ ...newSubtopicTexts, [blockId]: "" });
  };

  const handleDeleteSubtopic = (dayIdx: number, blockIdx: number, subtopicIdx: number) => {
    const list = [...editDays];
    list[dayIdx].blocks[blockIdx].subtopics = list[dayIdx].blocks[blockIdx].subtopics.filter((_, i) => i !== subtopicIdx);
    setEditDays(list);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Sync days' blocks with subjects' topics structures
    const syncedDays = JSON.parse(JSON.stringify(editDays));
    editSubjects.forEach(s => {
      const sTopics = s.topics || [];
      const sTopicNames = sTopics.map(t => t.name.trim()).filter(Boolean);

      // 1. Remove blocks for this subject whose topic is no longer present in sTopics
      syncedDays.forEach((day: Day) => {
        day.blocks = day.blocks.filter(b => {
          if (b.subjectId !== s.id) return true;
          return sTopicNames.includes(b.topic.trim());
        });
      });

      // 2. Update existing blocks' subtopics, and find which topics are missing
      const existingTopicsInBlocks = new Set<string>();
      syncedDays.forEach((day: Day) => {
        day.blocks.forEach(b => {
          if (b.subjectId === s.id) {
            existingTopicsInBlocks.add(b.topic.trim());
            const matchedTopic = sTopics.find(t => t.name.trim() === b.topic.trim());
            if (matchedTopic) {
              b.subtopics = matchedTopic.subtopics.map(st => st.trim()).filter(Boolean);
            }
          }
        });
      });

      // 3. For any missing topics, append a new block to the days list
      const missingTopics = sTopics.filter(t => t.name.trim() && !existingTopicsInBlocks.has(t.name.trim()));
      missingTopics.forEach((t, mIdx) => {
        let day = syncedDays[mIdx];
        if (!day) {
          const nextId = "d_" + (Date.now() + mIdx);
          day = {
            id: nextId,
            title: `Day ${syncedDays.length + 1}`,
            dateOverride: null,
            targetHrs: 8,
            blocks: []
          };
          syncedDays.push(day);
        }
        const blockId = "b_" + (Date.now() + mIdx) + Math.random().toString(36).slice(2, 5);
        day.blocks.push({
          id: blockId,
          subjectId: s.id,
          targetHrs: s.defaultHrs || 3,
          topic: t.name.trim(),
          subtopics: t.subtopics.map(st => st.trim()).filter(Boolean)
        });
      });
    });

    setEditDays(syncedDays);

    // Validate key
    const cleanKey = editKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanKey) {
      setError("Please enter a valid key (alphanumeric, lowercase).");
      return;
    }

    if (isNew && syllabi[cleanKey]) {
      setError(`A template with the key "${cleanKey}" already exists.`);
      return;
    }

    // Validate subjects
    if (editSubjects.length === 0) {
      setError("Please define at least one subject.");
      return;
    }

    const emptySubject = editSubjects.some(s => !s.name.trim());
    if (emptySubject) {
      setError("Subject name cannot be empty.");
      return;
    }

    // Validate schedule blocks
    const emptyTopic = syncedDays.some((d: Day) => d.blocks.some(b => !b.topic.trim()));
    if (emptyTopic) {
      setError("Scheduled topic titles cannot be empty.");
      return;
    }

    // Compile template object
    const template: SyllabusTemplate = {
      examName: editName.trim() || "My Exam Plan",
      subj: editSubjects,
      days: syncedDays
    };

    const updated = { ...syllabi };
    
    // If key changed, clean old
    if (selectedKey && selectedKey !== cleanKey) {
      delete updated[selectedKey];
    }
    
    updated[cleanKey] = template;

    try {
      const res = await fetch("/api/admin/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to save template");
      setSyllabi(updated);
      setSelectedKey(cleanKey);
      setIsNew(false);
      setSuccess("Syllabus template saved and synced successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 sm:pt-24 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link 
              href="/dashboard/admin" 
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Manage Syllabus Templates</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400">Configure exam templates synced to student planner dropdown options</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Template
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded text-green-700 flex items-start">
            <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading syllabus templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List column */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 h-fit">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Syllabi</h2>
              {Object.keys(syllabi).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 italic">No syllabus templates found. Click "Add Template" to start.</p>
              ) : (
                <div className="space-y-3">
                  {Object.keys(syllabi).map((key) => (
                    <div 
                      key={key}
                      className={`p-4 rounded-md border transition-all cursor-pointer flex items-center justify-between ${
                        selectedKey === key 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" 
                          : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => handleSelectTemplate(key)}
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-gray-900 dark:text-slate-100 truncate">{syllabi[key].examName}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">key: {key}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(key);
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(key);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Editor column */}
            <div className="lg:col-span-2">
              {selectedKey || isNew ? (
                <div className="space-y-6">
                  {/* General Config Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {isNew ? "Create New Syllabus Template" : "Exam Template Configuration"}
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Template Key (URL/ID Safe)
                        </label>
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          placeholder="e.g. upsc, mppsc"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                          disabled={!isNew}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Display Exam Title
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. UPSC Civil Services"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subjects Configuration */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Layers className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" /> Subjects Structure
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Subject
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editSubjects.map((subj, idx) => (
                        <div
                          key={subj.id}
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          style={{
                            borderColor: hoveredIdx === idx ? (subj.color.includes("gradient") ? "#3b82f6" : subj.color) : undefined,
                            boxShadow: hoveredIdx === idx ? `0 4px 20px -2px ${subj.color.includes("gradient") ? "rgba(59, 130, 246, 0.15)" : `color-mix(in srgb, ${subj.color} 15%, transparent)`}` : "none",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                          className="p-4 border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-md flex flex-col gap-4 transition-all"
                        >
                          <div className="flex flex-wrap gap-4 items-center w-full">
                            <div className="flex-1 min-w-[150px]">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Subject Name</label>
                              <input
                                type="text"
                                value={subj.name}
                                onChange={(e) => handleUpdateSubject(idx, { name: e.target.value })}
                                placeholder="e.g. History"
                                className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div className="w-[120px]">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Theme Color</label>
                              <select
                                value={subj.color}
                                onChange={(e) => handleUpdateSubject(idx, { color: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {PRESET_COLORS.map(c => (
                                  <option key={c.value} value={c.value} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">{c.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="w-[90px]">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Icon Emoji</label>
                              <select
                                value={subj.icon}
                                onChange={(e) => handleUpdateSubject(idx, { icon: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {PRESET_ICONS.map(i => (
                                  <option key={i} value={i} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">{i}</option>
                                ))}
                              </select>
                            </div>

                            <div className="w-[100px]">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Default Hrs</label>
                              <input
                                type="number"
                                value={subj.defaultHrs}
                                min={1}
                                max={24}
                                onChange={(e) => handleUpdateSubject(idx, { defaultHrs: Math.max(1, parseInt(e.target.value) || 3) })}
                                className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/50 mt-4 transition-colors shrink-0"
                              title="Delete Subject"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="w-full border-t border-gray-200 dark:border-slate-700/80 pt-3 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Topics &amp; Subtopics Structure
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCollapsedSubjects({
                                      ...collapsedSubjects,
                                      [subj.id]: !collapsedSubjects[subj.id]
                                    });
                                  }}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                  {collapsedSubjects[subj.id] ? "🔽 Expand" : "🔼 Collapse"}
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <a
                                  href="data:text/csv;charset=utf-8,Topic,Subtopic%0APolity%20Basics,Preamble%0APolity%20Basics,Fundamental%20Rights%0AUnion%20Executive,President"
                                  download="syllabus_template.csv"
                                  className="text-[10px] text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold underline shrink-0"
                                >
                                  📄 Sample CSV
                                </a>
                                <label className="text-[10px] text-gray-500 dark:text-slate-300 font-semibold shrink-0 cursor-pointer flex items-center bg-gray-100 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">
                                  <span>📥 Import CSV</span>
                                  <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImportCSV(idx, file);
                                      e.target.value = "";
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddSyllabusTopic(idx)}
                                  className="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[10px] font-semibold rounded border border-transparent dark:border-blue-900/50"
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Topic
                                </button>
                              </div>
                            </div>

                            {!collapsedSubjects[subj.id] && (
                              <>
                                <div className="space-y-3">
                                  {(subj.topics || []).map((t, tIdx) => (
                                    <div key={t.id} className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-md space-y-2">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={t.name}
                                          onChange={(e) => handleUpdateSyllabusTopic(idx, tIdx, e.target.value)}
                                          placeholder="Topic Name (e.g. Chapter 1)"
                                          className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddSyllabusSubtopic(idx, tIdx)}
                                          className="p-1 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                                          title="Add Subtopic"
                                        >
                                          <PlusCircle className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSyllabusTopic(idx, tIdx)}
                                          className="p-1 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                                          title="Delete Topic"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      {/* Subtopics */}
                                      <div className="pl-4 space-y-1.5 border-l-2 border-gray-200 dark:border-slate-700">
                                        {t.subtopics.map((st, stIdx) => (
                                          <div key={stIdx} className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={st}
                                              onChange={(e) => handleUpdateSyllabusSubtopic(idx, tIdx, stIdx, e.target.value)}
                                              placeholder="Subtopic Name"
                                              className="flex-1 px-2 py-0.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteSyllabusSubtopic(idx, tIdx, stIdx)}
                                              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                              title="Delete Subtopic"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {(subj.topics || []).length > 0 && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateBlocksFromForm(idx)}
                                      className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs rounded transition-colors border border-transparent dark:border-blue-900/50"
                                    >
                                      <PlusCircle className="h-3.5 w-3.5 mr-1" /> Generate Schedule Blocks
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day Blocks Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" /> Study Days Schedule
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href="data:text/csv;charset=utf-8,DayTitle,TargetHrs,SubjectName,Topic,BlockHrs,Subtopics%0ADay%201%3A%20Polity%20%26%20History,8,Polity,Fundamental%20Rights,4,Preamble%3B%20Article%2012-35%3B%20Writs%0ADay%201%3A%20Polity%20%26%20History,8,History,Ancient%20History,4,Indus%20Valley%3B%20Vedic%20Period%0ADay%202%3A%20Modern%20History,8,History,Freedom%20Struggle,5,1857%20Revolt%3B%20Non-Cooperation%20Movement"
                          download="study_days_schedule_sample.csv"
                          className="text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold underline shrink-0 mr-1"
                        >
                          📄 Sample CSV
                        </a>
                        <label className="text-xs text-gray-700 dark:text-slate-300 font-semibold shrink-0 cursor-pointer flex items-center bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors border border-gray-200 dark:border-slate-700">
                          <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-green-600 dark:text-green-400" />
                          <span>📥 Import CSV/Excel</span>
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleImportScheduleCSV}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleExportScheduleCSV}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded border border-gray-200 dark:border-slate-700 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" /> Export Schedule CSV
                        </button>
                        <button
                          type="button"
                          onClick={handleAddDay}
                          className="inline-flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Study Day
                        </button>
                      </div>
                    </div>

                    {editDays.map((day, dayIdx) => (
                      <div key={day.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        {/* Day Header */}
                        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={day.title}
                              onChange={(e) => handleUpdateDay(dayIdx, { title: e.target.value })}
                              placeholder="Day Title"
                              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded font-semibold text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[180px]"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold shrink-0">Target Hrs:</span>
                              <input
                                type="number"
                                value={day.targetHrs}
                                min={1}
                                max={24}
                                onChange={(e) => handleUpdateDay(dayIdx, { targetHrs: Math.max(1, parseInt(e.target.value) || 8) })}
                                className="w-[60px] px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddBlock(dayIdx)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs rounded transition-colors border border-transparent dark:border-blue-900/50"
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Topic Block
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDay(dayIdx)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 font-semibold text-xs rounded transition-colors border border-transparent dark:border-red-900/50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Day
                            </button>
                          </div>
                        </div>

                        {/* Blocks scheduled inside Day */}
                        <div className="p-5 space-y-4">
                          {day.blocks.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-4">No scheduled topics for this day. Click "Add Topic Block" to schedule study tasks.</p>
                          ) : (
                            day.blocks.map((block, blockIdx) => (
                              <div key={block.id} className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-md border border-gray-200 dark:border-slate-800 relative flex flex-col gap-3">
                                <div className="flex flex-wrap gap-4 items-center">
                                  <div className="w-[180px]">
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Subject</label>
                                    <select
                                      value={block.subjectId}
                                      onChange={(e) => handleUpdateBlock(dayIdx, blockIdx, { subjectId: e.target.value })}
                                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                                    >
                                      {editSubjects.map(s => (
                                        <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">{s.icon} {s.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Topic Name</label>
                                    <input
                                      type="text"
                                      value={block.topic}
                                      onChange={(e) => handleUpdateBlock(dayIdx, blockIdx, { topic: e.target.value })}
                                      placeholder="e.g. Fundamental Rights"
                                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="w-[80px]">
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Hrs</label>
                                    <input
                                      type="number"
                                      value={block.targetHrs}
                                      min={1}
                                      max={24}
                                      onChange={(e) => handleUpdateBlock(dayIdx, blockIdx, { targetHrs: Math.max(1, parseInt(e.target.value) || 3) })}
                                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBlock(dayIdx, blockIdx)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/50 mt-4 transition-colors shrink-0"
                                    title="Delete Topic Block"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Subtopics Compiler */}
                                <div className="border-t border-gray-200 dark:border-slate-700/80 pt-3">
                                  <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Subtopics Checklist</label>
                                  
                                  {/* Subtopic tag rows */}
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {block.subtopics.map((sub, sIdx) => (
                                      <span key={sIdx} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-900/50">
                                        {sub}
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubtopic(dayIdx, blockIdx, sIdx)}
                                          className="ml-1 text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 focus:outline-none"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>

                                  {/* Add subtopic inline form */}
                                  <div className="flex gap-2 max-w-md">
                                    <input
                                      type="text"
                                      value={newSubtopicTexts[block.id] || ""}
                                      onChange={(e) => setNewSubtopicTexts({ ...newSubtopicTexts, [block.id]: e.target.value })}
                                      placeholder="Add subtopic..."
                                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddSubtopic(dayIdx, blockIdx, block.id);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddSubtopic(dayIdx, blockIdx, block.id)}
                                      className="px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 text-xs font-semibold rounded transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Actions Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(null);
                        setIsNew(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-5 py-2 border border-gray-300 dark:border-slate-700 rounded shadow text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow transition-colors"
                    >
                      Save Template &amp; Sync
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 text-center py-20">
                  <BookOpen className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Template Selected</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                    Select a syllabus template from the active list to configure its settings, or click "Add Template" to build a new one.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
