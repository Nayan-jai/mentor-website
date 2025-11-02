"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OMRProcessor, simulateOMRProcessing, OMRProcessingResult, DEFAULT_OMR_TEMPLATE } from "@/lib/omr-processor";
import { ResultAnalyzer, TestResult, TestQuestion } from "@/lib/result-analyzer";
import {
  Plus,
  Edit,
  Save,
  Play,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  Download,
  GripVertical,
  Trash2,
  Upload,
  FileImage,
  BarChart3,
  Award,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react";

type QuestionType = "MCQ" | "STATEMENT" | "TABLE";

interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface StatementItem {
  id: string;
  text: string;
}

interface TablePair {
  id: string;
  left: string;
  right: string;
  isCorrect?: boolean; // for keyed match evaluations if needed later
}

interface BaseQuestion {
  id: string;
  type: QuestionType;
  subject: string;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  timeLimit: number; // minutes
  explanation?: string;
}

interface MCQQuestion extends BaseQuestion {
  type: "MCQ";
  question: string;
  options: MCQOption[];
}

interface StatementQuestion extends BaseQuestion {
  type: "STATEMENT";
  prompt: string;
  statements: StatementItem[];
  options: MCQOption[]; // e.g., combinations A/B/C/D like UPSC
}

interface TableQuestion extends BaseQuestion {
  type: "TABLE";
  prompt: string;
  pairs: TablePair[]; // display as two columns
  options: MCQOption[]; // final choices like Only one/Only two/etc.
}

type AnyQuestion = MCQQuestion | StatementQuestion | TableQuestion;

interface Test {
  id: string;
  title: string;
  description: string;
  questions: AnyQuestion[];
  totalMarks: number;
  duration: number; // minutes
  createdAt: Date;
}

// Sortable Question Item Component
function SortableQuestionItem({ 
  question, 
  index, 
  updateQuestion, 
  updateOption, 
  setCorrectAnswer, 
  addStatementRow, 
  updateStatement, 
  addPairRow, 
  updatePair, 
  removeQuestion 
}: {
  question: AnyQuestion;
  index: number;
  updateQuestion: (qid: string, updates: Partial<AnyQuestion>) => void;
  updateOption: (qid: string, oid: string, text: string) => void;
  setCorrectAnswer: (qid: string, oid: string) => void;
  addStatementRow: (qid: string) => void;
  updateStatement: (qid: string, sid: string, text: string) => void;
  addPairRow: (qid: string) => void;
  updatePair: (qid: string, pid: string, side: "left" | "right", text: string) => void;
  removeQuestion: (qid: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-4 border-l-blue-500 transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-gray-100 hover:bg-gray-200 rounded cursor-move transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Question {index + 1}</span>
                <Badge variant="outline">{question.subject}</Badge>
                <Badge variant="outline">{question.difficulty}</Badge>
                <Badge variant="outline">{question.marks} marks</Badge>
                <Badge variant="secondary" className="text-xs">
                  {question.type}
                </Badge>
              </div>
              {question.type === "MCQ" && (
                <Textarea 
                  value={(question as MCQQuestion).question} 
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value } as Partial<MCQQuestion>)} 
                  placeholder="Enter question (supports multi-line)" 
                  rows={4} 
                  className="mb-4" 
                />
              )}
              {question.type === "STATEMENT" && (
                <div className="space-y-2 mb-4">
                  <Textarea 
                    value={(question as StatementQuestion).prompt} 
                    onChange={(e) => updateQuestion(question.id, { prompt: e.target.value } as Partial<StatementQuestion>)} 
                    placeholder="Enter prompt" 
                    rows={3} 
                  />
                  {(question as StatementQuestion).statements.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="font-medium w-28">Statement {i + 1}</span>
                      <Input 
                        value={s.text} 
                        onChange={(e) => updateStatement(question.id, s.id, e.target.value)} 
                        placeholder={`Statement ${i + 1}`} 
                        className="flex-1" 
                      />
                    </div>
                  ))}
                  <Button onClick={() => addStatementRow(question.id)} size="sm" variant="outline">Add Statement</Button>
                </div>
              )}
              {question.type === "TABLE" && (
                <div className="space-y-2 mb-4">
                  <Textarea 
                    value={(question as TableQuestion).prompt} 
                    onChange={(e) => updateQuestion(question.id, { prompt: e.target.value } as Partial<TableQuestion>)} 
                    placeholder="Enter prompt" 
                    rows={3} 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-semibold">Left</div>
                    <div className="text-sm font-semibold">Right</div>
                    {(question as TableQuestion).pairs.map((p) => (
                      <>
                        <Input key={p.id + "l"} value={p.left} onChange={(e) => updatePair(question.id, p.id, "left", e.target.value)} placeholder="Left" />
                        <Input key={p.id + "r"} value={p.right} onChange={(e) => updatePair(question.id, p.id, "right", e.target.value)} placeholder="Right" />
                      </>
                    ))}
                  </div>
                  <Button onClick={() => addPairRow(question.id)} size="sm" variant="outline">Add Row</Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { /* reserved for future per-question actions */ }} variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
            <Button onClick={() => removeQuestion(question.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(question as any).options?.map((opt: MCQOption) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="font-medium w-6">{opt.id.toUpperCase()}.</span>
              <Input value={opt.text} onChange={(e) => updateOption(question.id, opt.id, e.target.value)} placeholder={`Option ${opt.id}`} className="flex-1" />
              <Button onClick={() => setCorrectAnswer(question.id, opt.id)} variant={opt.isCorrect ? "default" : "outline"} size="sm">
                {opt.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
          <Textarea value={question.explanation || ""} onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })} placeholder="Add explanation for this question..." rows={2} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // OMR-related state
  const [isProcessingOMR, setIsProcessingOMR] = useState(false);
  const [omrResults, setOmrResults] = useState<TestResult | null>(null);
  const [selectedOMRFile, setSelectedOMRFile] = useState<File | null>(null);
  const [showOMRUpload, setShowOMRUpload] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTests, setSavedTests] = useState<any[]>([]);
  const [omrSensitivity, setOmrSensitivity] = useState(0.5); // Default: medium sensitivity

  const printableRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  // Check if user is authorized to create tests
  const canCreateTests = session?.user?.role === "MENTOR" || session?.user?.role === "ADMIN";

  // Load tests from database
  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        const formattedTests = data.tests.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description,
          totalMarks: test.totalMarks,
          duration: test.duration,
          createdAt: new Date(test.createdAt),
          questions: test.questions.map((q: any, index: number) => ({
            id: q.id,
            type: q.type,
            subject: q.subject,
            difficulty: q.difficulty,
            marks: q.marks,
            timeLimit: q.timeLimit,
            question: q.question,
            prompt: q.prompt,
            explanation: q.explanation,
            options: q.options,
            statements: q.statements,
            pairs: q.pairs,
          })),
        }));
        setTests(formattedTests);
        setSavedTests(data.tests);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
      // Fallback to sample test if loading fails
      const sample: Test = {
        id: "demo",
        title: "UPSC Prelims Mixed Mock",
        description: "Sample with MCQ, Statement and Table type questions",
        totalMarks: 6,
        duration: 15,
        createdAt: new Date(),
        questions: [
          {
            id: "q1",
            type: "MCQ",
            subject: "Geography",
            difficulty: "Medium",
            marks: 2,
            timeLimit: 3,
            question:
              "Which one of the following is the correct West→East order of Ganga tributaries?",
            options: [
              { id: "a", text: "Ghaghara – Gomati – Gandak – Kosi", isCorrect: false },
              { id: "b", text: "Gomati – Ghaghara – Gandak – Kosi", isCorrect: true },
              { id: "c", text: "Gomati – Kosi – Ghaghara – Gandak", isCorrect: false },
              { id: "d", text: "Ghaghara – Kosi – Gandak", isCorrect: false },
            ],
            explanation:
              "From West to East: Gomati, Ghaghara, Gandak, Kosi.",
          },
          {
            id: "q2",
            type: "STATEMENT",
            subject: "Geography",
            difficulty: "Easy",
            marks: 2,
            timeLimit: 2,
            prompt:
              "Consider the following statements and select the correct answer:",
            statements: [
              { id: "s1", text: "Rainfall is one of the reasons for weathering of rocks." },
              { id: "s2", text: "Rain water contains carbon dioxide in solution." },
              { id: "s3", text: "Rain water contains atmospheric oxygen." },
            ],
            options: [
              { id: "a", text: "Only statements I and II are correct", isCorrect: true },
              { id: "b", text: "Only statements II and III are correct", isCorrect: false },
              { id: "c", text: "All three statements are correct", isCorrect: false },
              { id: "d", text: "None of the statements is correct", isCorrect: false },
            ],
            explanation:
              "I is correct and explained by II; oxygen presence alone does not explain weathering.",
          },
          {
            id: "q3",
            type: "TABLE",
            subject: "Geography",
            difficulty: "Medium",
            marks: 2,
            timeLimit: 3,
            prompt:
              "Consider the following information and choose how many are correctly matched:",
            pairs: [
              { id: "p1", left: "Dhuandhar – Malwa", right: "Narmada", isCorrect: true },
              { id: "p2", left: "Hundru – Chota Nagpur", right: "Subarnarekha", isCorrect: true },
              { id: "p3", left: "Gersoppa – Western Ghats", right: "Netravati", isCorrect: false },
            ],
            options: [
              { id: "a", text: "Only one", isCorrect: false },
              { id: "b", text: "Only two", isCorrect: true },
              { id: "c", text: "All three", isCorrect: false },
              { id: "d", text: "None", isCorrect: false },
            ],
            explanation: "Two are correct; Gersoppa is on Sharavati, not Netravati.",
          },
        ],
      };
      setTests([sample]);
    }
  };

  const createNewTest = () => {
    const t: Test = {
      id: Date.now().toString(),
      title: "New Test",
      description: "",
      questions: [],
      totalMarks: 0,
      duration: 60,
      createdAt: new Date(),
    };
    setCurrentTest(t);
    setIsCreating(true);
  };

  const addQuestionOfType = (type: QuestionType) => {
    if (!currentTest) return;
    const id = `q${Date.now()}`;
    let q: AnyQuestion;
    if (type === "MCQ") {
      q = {
        id,
        type,
        subject: "General Studies",
        difficulty: "Medium",
        marks: 2,
        timeLimit: 2,
        question: "",
        options: [
          { id: "a", text: "", isCorrect: false },
          { id: "b", text: "", isCorrect: false },
          { id: "c", text: "", isCorrect: false },
          { id: "d", text: "", isCorrect: false },
        ],
      } as MCQQuestion;
    } else if (type === "STATEMENT") {
      q = {
        id,
        type,
        subject: "General Studies",
        difficulty: "Medium",
        marks: 2,
        timeLimit: 2,
        prompt: "",
        statements: [
          { id: "s1", text: "" },
          { id: "s2", text: "" },
          { id: "s3", text: "" },
        ],
        options: [
          { id: "a", text: "", isCorrect: false },
          { id: "b", text: "", isCorrect: false },
          { id: "c", text: "", isCorrect: false },
          { id: "d", text: "", isCorrect: false },
        ],
      } as StatementQuestion;
    } else {
      q = {
        id,
        type: "TABLE",
        subject: "General Studies",
        difficulty: "Medium",
        marks: 2,
        timeLimit: 3,
        prompt: "",
        pairs: [
          { id: "p1", left: "", right: "" },
          { id: "p2", left: "", right: "" },
          { id: "p3", left: "", right: "" },
        ],
        options: [
          { id: "a", text: "", isCorrect: false },
          { id: "b", text: "", isCorrect: false },
          { id: "c", text: "", isCorrect: false },
          { id: "d", text: "", isCorrect: false },
        ],
      } as TableQuestion;
    }

    setCurrentTest({ ...currentTest, questions: [...currentTest.questions, q] });
  };

  const updateQuestion = (qid: string, updates: Partial<AnyQuestion>) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) => (q.id === qid ? ({ ...q, ...updates } as AnyQuestion) : q)),
    });
  };

  const updateOption = (qid: string, oid: string, text: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid
          ? ({
              ...(q as any),
              options: (q as any).options.map((opt: MCQOption) => (opt.id === oid ? { ...opt, text } : opt)),
            } as AnyQuestion)
          : q,
      ),
    });
  };

  const setCorrectAnswer = (qid: string, oid: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid
          ? ({
              ...(q as any),
              options: (q as any).options.map((opt: MCQOption) => ({ ...opt, isCorrect: opt.id === oid })),
            } as AnyQuestion)
          : q,
      ),
    });
  };

  const addStatementRow = (qid: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid && q.type === "STATEMENT"
          ? ({
              ...q,
              statements: [...q.statements, { id: `s${Date.now()}`, text: "" }],
            } as StatementQuestion)
          : q,
      ),
    });
  };

  const updateStatement = (qid: string, sid: string, text: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid && q.type === "STATEMENT"
          ? ({
              ...q,
              statements: q.statements.map((s) => (s.id === sid ? { ...s, text } : s)),
            } as StatementQuestion)
          : q,
      ),
    });
  };

  const addPairRow = (qid: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid && q.type === "TABLE"
          ? ({ ...q, pairs: [...q.pairs, { id: `p${Date.now()}`, left: "", right: "" }] } as TableQuestion)
          : q,
      ),
    });
  };

  const updatePair = (qid: string, pid: string, side: "left" | "right", text: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.map((q) =>
        q.id === qid && q.type === "TABLE"
          ? ({
              ...q,
              pairs: q.pairs.map((p) => (p.id === pid ? { ...p, [side]: text } : p)),
            } as TableQuestion)
          : q,
      ),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!currentTest || !over || active.id === over.id) return;

    setCurrentTest((prevTest) => {
      if (!prevTest) return prevTest;

      const oldIndex = prevTest.questions.findIndex((item) => item.id === active.id);
      const newIndex = prevTest.questions.findIndex((item) => item.id === over.id);

      return {
        ...prevTest,
        questions: arrayMove(prevTest.questions, oldIndex, newIndex),
      };
    });
  };

  const removeQuestion = (qid: string) => {
    if (!currentTest) return;
    setCurrentTest({
      ...currentTest,
      questions: currentTest.questions.filter((q) => q.id !== qid),
    });
  };

  const saveTest = async () => {
    if (!currentTest || !canCreateTests) return;
    
    if (!currentTest.title.trim()) {
      alert('Please enter a test title');
      return;
    }
    
    if (currentTest.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const testData = {
        title: currentTest.title,
        description: currentTest.description,
        duration: currentTest.duration,
        questions: currentTest.questions.map((q, index) => ({
          type: q.type,
          subject: q.subject,
          difficulty: q.difficulty,
          marks: 2, // Fixed 2 marks per question
          timeLimit: q.timeLimit,
          question: q.type === 'MCQ' ? (q as any).question : null,
          prompt: q.type !== 'MCQ' ? (q as any).prompt : null,
          explanation: q.explanation,
          options: (q as any).options || [],
          statements: q.type === 'STATEMENT' ? (q as any).statements : null,
          pairs: q.type === 'TABLE' ? (q as any).pairs : null,
        })),
        isPublic: true,
      };
      
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Test "${currentTest.title}" saved successfully!`);
        
        // Reload tests to get the updated list
        await loadTests();
        
        setCurrentTest(null);
        setIsCreating(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save test');
      }
    } catch (error) {
      console.error('Save test error:', error);
      alert(`Failed to save test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const startTest = (test: Test) => {
    setCurrentTest(test);
    setIsTakingTest(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(test.duration * 60);
  };

  const submitAnswer = (qid: string, oid: string) => setAnswers((p) => ({ ...p, [qid]: oid }));
  const nextQuestion = () => currentTest && currentQuestionIndex < currentTest.questions.length - 1 && setCurrentQuestionIndex((i) => i + 1);
  const prevQuestion = () => currentQuestionIndex > 0 && setCurrentQuestionIndex((i) => i - 1);

  const finishTest = () => {
    let score = 0;
    currentTest?.questions.forEach((q) => {
      const sel = answers[q.id];
      const correct = (q as any).options?.find((o: MCQOption) => o.isCorrect)?.id;
      if (sel && sel === correct) score += q.marks;
    });
    alert(`Test completed! Your score: ${score}/${currentTest?.totalMarks || 0}`);
    setIsTakingTest(false);
    setCurrentTest(null);
  };

  // OMR Processing Functions
  const handleOMRUpload = async (file: File) => {
    if (!currentTest) return;
    
    setIsProcessingOMR(true);
    setSelectedOMRFile(file);
    
    try {
      // Use actual OMR processing with configurable sensitivity
      const processor = new OMRProcessor(DEFAULT_OMR_TEMPLATE, omrSensitivity);
      const omrResult = await processor.processOMRSheet(file, currentTest.questions.length);
      
      // Convert test questions to the format expected by ResultAnalyzer
      const testQuestions: TestQuestion[] = currentTest.questions.map(q => ({
        id: q.id,
        type: q.type,
        subject: q.subject,
        difficulty: q.difficulty,
        marks: q.marks,
        options: (q as any).options || [],
      }));
      
      // Check if processing was successful
      if (!omrResult.processingSuccess) {
        throw new Error(omrResult.errorMessage || 'Failed to process OMR sheet');
      }
      
      // Analyze results
      const analysisResult = ResultAnalyzer.analyzeResults(omrResult, testQuestions);
      
      // Save results to database
      await saveOMRResults(analysisResult, currentTest.id);
      
      setOmrResults(analysisResult);
      setShowOMRUpload(false);
    } catch (error) {
      console.error('OMR processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process OMR sheet';
      alert(`Processing Error: ${errorMessage}\n\nTips:\n• Ensure the image is clear and well-lit\n• Check that bubbles are filled completely\n• Make sure the entire OMR sheet is visible`);
    } finally {
      setIsProcessingOMR(false);
    }
  };

  const downloadOMRTemplate = () => {
    if (!currentTest) return;
    
    const svgContent = OMRProcessor.generateOMRTemplate(currentTest.questions.length, DEFAULT_OMR_TEMPLATE);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}_OMR_Template.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetOMRResults = () => {
    setOmrResults(null);
    setSelectedOMRFile(null);
    setImagePreview(null);
  };

  const saveOMRResults = async (results: any, testId: string) => {
    try {
      const insights = ResultAnalyzer.generateInsights(results);
      const recommendations = ResultAnalyzer.generateRecommendations(results);
      
      const attemptData = {
        attemptType: "OMR",
        totalQuestions: results.totalQuestions,
        attemptedQuestions: results.attemptedQuestions,
        correctAnswers: results.correctAnswers,
        incorrectAnswers: results.incorrectAnswers,
        unattemptedQuestions: results.unattemptedQuestions,
        totalMarks: results.totalMarks,
        maxMarks: results.maxMarks,
        percentage: results.percentage,
        grade: results.grade,
        questionResponses: results.questionAnalysis.map((qa: any) => ({
          questionNumber: qa.questionNumber,
          selectedOption: qa.studentAnswer,
          correctAnswer: qa.correctAnswer,
          isCorrect: qa.isCorrect,
          isAttempted: qa.isAttempted,
          marks: qa.marks,
          maxMarks: qa.maxMarks,
          confidence: qa.confidence,
        })),
        insights,
        recommendations,
      };
      
      const response = await fetch(`/api/tests/${testId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attemptData),
      });
      
      if (response.ok) {
        console.log('OMR results saved successfully');
      } else {
        console.error('Failed to save OMR results');
      }
    } catch (error) {
      console.error('Error saving OMR results:', error);
    }
  };

  const deleteTest = async (testId: string, testTitle: string) => {
    if (!canCreateTests) return;
    
    if (!confirm(`Are you sure you want to delete "${testTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert(`Test "${testTitle}" deleted successfully!`);
        await loadTests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete test');
      }
    } catch (error) {
      console.error('Delete test error:', error);
      alert(`Failed to delete test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedOMRFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Timer
  useEffect(() => {
    if (!isTakingTest || timeRemaining <= 0) return;
    const t = setTimeout(() => setTimeRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isTakingTest, timeRemaining]);

  useEffect(() => {
    if (isTakingTest && timeRemaining === 0) finishTest();
  }, [isTakingTest, timeRemaining]);

  // PDF Export - A4 format with exactly 4 questions per page, sized to fill the page
  const exportToPdf = async () => {
    if (!currentTest) return;
    
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const leftMargin = 15; // Left margin
    const rightMargin = 15; // Right margin
    const topMargin = 20; // Top margin
    const bottomMargin = 20; // Bottom margin
    const columnGap = 8; // Gap between columns
    const columnWidth = (pageWidth - leftMargin - rightMargin - columnGap) / 2;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const maxQuestionsPerPage = 4; // Exactly 4 questions per page

    // Group questions into pages (exactly 4 per page)
    const groupQuestionsIntoPages = () => {
      const pages: AnyQuestion[][] = [];
      for (let i = 0; i < currentTest.questions.length; i += maxQuestionsPerPage) {
        pages.push(currentTest.questions.slice(i, i + maxQuestionsPerPage));
      }
      return pages;
    };

    const questionPages = groupQuestionsIntoPages();
    const totalPages = questionPages.length + 1; // include cover page

    // COVER PAGE (description only)
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(currentTest.title, leftMargin, topMargin);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total Questions: ${currentTest.questions.length}`, leftMargin, topMargin + 12);
    pdf.text(`Total Marks: ${currentTest.questions.length * 2}`, leftMargin + 60, topMargin + 12);
    pdf.text(`Duration: ${currentTest.duration} minutes`, leftMargin + 120, topMargin + 12);

    // Description block
    const descStartY = topMargin + 26;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", leftMargin, descStartY);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const descLines = pdf.splitTextToSize(currentTest.description || "", contentWidth);
    pdf.text(descLines, leftMargin, descStartY + 8);

    // Footer page number on cover
    pdf.setFontSize(10);
    pdf.text(`Page 1 of ${totalPages}`, pageWidth - rightMargin - 30, pageHeight - bottomMargin);

    // QUESTION PAGES
    for (let pageIndex = 0; pageIndex < questionPages.length; pageIndex++) {
      pdf.addPage();

      const pageQuestions = questionPages[pageIndex];
      const availableHeight = pageHeight - topMargin - bottomMargin; // full usable height
      const questionAreaHeight = availableHeight / 2; // Split into 2 rows (2 questions per row)

      // Only page number on question pages (top-right)
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Page ${pageIndex + 2} of ${totalPages}`, pageWidth - rightMargin - 30, topMargin);

      // Position questions in 2x2 grid
      const leftColumnX = leftMargin;
      const rightColumnX = leftMargin + columnWidth + columnGap;
      const startY = topMargin + 8;

      // Add questions for this page
      for (let qIndex = 0; qIndex < pageQuestions.length; qIndex++) {
        const question = pageQuestions[qIndex];
        const questionNumber = currentTest.questions.findIndex(q => q.id === question.id) + 1;

        // Determine position in 2x2 grid
        const isLeftColumn = (qIndex % 2 === 0);
        const isTopRow = (qIndex < 2);
        const x = isLeftColumn ? leftColumnX : rightColumnX;
        const y = startY + (isTopRow ? 0 : questionAreaHeight);

        // Add question with larger, more spacious formatting
        addQuestionToPage(question, questionNumber, x, y, columnWidth, questionAreaHeight - 10);
      }
    }

    // Helper function to add a question with spacious formatting
    function addQuestionToPage(question: AnyQuestion, questionNumber: number, x: number, y: number, width: number, maxHeight: number) {
      let currentY = y;

      // Question number - larger and bold
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${questionNumber}.`, x, currentY);
      currentY += 8;

      // Question content - larger font
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      
      let questionText = "";
      if (question.type === "MCQ") {
        questionText = (question as MCQQuestion).question;
      } else if (question.type === "STATEMENT") {
        const stmtQ = question as StatementQuestion;
        questionText = stmtQ.prompt + "\n\n";
        stmtQ.statements.forEach((stmt, i) => {
          questionText += `Statement ${i + 1}: ${stmt.text}\n`;
        });
      } else if (question.type === "TABLE") {
        const tableQ = question as TableQuestion;
        questionText = tableQ.prompt + "\n\n";
        tableQ.pairs.forEach((pair, i) => {
          questionText += `${pair.left} - ${pair.right}\n`;
        });
      }

      // Split long text into multiple lines with larger line height
      const lines = pdf.splitTextToSize(questionText, width);
      pdf.text(lines, x, currentY);
      currentY += lines.length * 5 + 8;

      // Options - larger and more spaced
      if ((question as any).options) {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Options:", x, currentY);
        currentY += 8;

        (question as any).options.forEach((opt: MCQOption, optIndex: number) => {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`${opt.id.toUpperCase()}. ${opt.text}`, x + 5, currentY);
          currentY += 6;
        });
      }
    }

    pdf.save(`${currentTest.title || "test"}.pdf`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Test taking UI
  if (isTakingTest && currentTest) {
    const q = currentTest.questions[currentQuestionIndex];
    const format = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader className="bg-blue-600 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <CardTitle className="text-xl">{currentTest.title}</CardTitle>
                  <p className="text-blue-100">Question {currentQuestionIndex + 1} of {currentTest.questions.length} • Total Marks: {currentTest.questions.length * 2}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-mono">{format(timeRemaining)}</span>
                  </div>
                  <Badge variant="secondary">{q.subject}</Badge>
                  <Badge variant="secondary" className="bg-green-600 text-white">2 marks</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Render by type */}
              {q.type === "MCQ" && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 whitespace-pre-line">{(q as MCQQuestion).question}</h3>
                  <div className="space-y-3">
                    {(q as MCQQuestion).options.map((opt) => (
                      <label key={opt.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name={`q-${q.id}`} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => submitAnswer(q.id, opt.id)} className="mr-3" />
                        <span className="font-medium mr-2">{opt.id.toUpperCase()}.</span>
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {q.type === "STATEMENT" && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 whitespace-pre-line">{(q as StatementQuestion).prompt}</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    {(q as StatementQuestion).statements.map((s, i) => (
                      <li key={s.id}><span className="font-semibold">Statement-{i + 1}:</span> {s.text}</li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    {(q as StatementQuestion).options.map((opt) => (
                      <label key={opt.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name={`q-${q.id}`} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => submitAnswer(q.id, opt.id)} className="mr-3" />
                        <span className="font-medium mr-2">{opt.id.toUpperCase()}.</span>
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {q.type === "TABLE" && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 whitespace-pre-line">{(q as TableQuestion).prompt}</h3>
                  <div className="grid grid-cols-2 gap-2 border rounded overflow-hidden mb-4">
                    <div className="bg-gray-100 p-2 font-semibold">Left</div>
                    <div className="bg-gray-100 p-2 font-semibold">Right</div>
                    {(q as TableQuestion).pairs.map((p) => (
                      <>
                        <div key={p.id + "l"} className="p-2 border-t">{p.left}</div>
                        <div key={p.id + "r"} className="p-2 border-t">{p.right}</div>
                      </>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {(q as TableQuestion).options.map((opt) => (
                      <label key={opt.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name={`q-${q.id}`} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => submitAnswer(q.id, opt.id)} className="mr-3" />
                        <span className="font-medium mr-2">{opt.id.toUpperCase()}.</span>
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button onClick={prevQuestion} disabled={currentQuestionIndex === 0} variant="outline">Previous</Button>
                <div className="flex gap-2">
                  {currentQuestionIndex === currentTest.questions.length - 1 ? (
                    <Button onClick={finishTest} className="bg-green-600 hover:bg-green-700 text-white">Finish Test</Button>
                  ) : (
                    <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700 text-white">Next Question</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-3xl md:max-w-5xl xl:max-w-6xl">
        <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">UPSC CSE Test Center</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {canCreateTests 
                ? "Create and take practice tests for UPSC CSE prelims preparation" 
                : "Take practice tests for UPSC CSE prelims preparation"
              }
            </p>
            {!canCreateTests && session && (
              <div className="mt-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Note:</strong> Only mentors can create new tests. As a student, you can take existing tests created by mentors.
                </p>
              </div>
            )}
          </div>
          {currentTest && canCreateTests && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <div className="font-medium">PDF Layout Preview:</div>
                <div className="text-xs">
                  {(() => {
                    // Simulate the new dynamic page calculation
                    const pageWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const topMargin = 20;
                    const bottomMargin = 20;
                    const leftMargin = 15;
                    const rightMargin = 15;
                    const contentWidth = pageWidth - leftMargin - rightMargin;
                    
                    let pages = 1;
                    let currentY = topMargin + 15; // Header space
                    
                    for (const question of currentTest.questions) {
                      // Calculate question height (simplified)
                      let questionHeight = 8 + 6 + 5; // Header lines
                      
                      let questionText = "";
                      if (question.type === "MCQ") {
                        questionText = (question as MCQQuestion).question;
                      } else if (question.type === "STATEMENT") {
                        const stmtQ = question as StatementQuestion;
                        questionText = stmtQ.prompt + "\n\n";
                        stmtQ.statements.forEach((stmt, i) => {
                          questionText += `Statement ${i + 1}: ${stmt.text}\n`;
                        });
                      } else if (question.type === "TABLE") {
                        const tableQ = question as TableQuestion;
                        questionText = tableQ.prompt + "\n\n";
                        tableQ.pairs.forEach((pair, i) => {
                          questionText += `${pair.left} - ${pair.right}\n`;
                        });
                      }
                      
                      // Estimate text lines (rough calculation)
                      const estimatedLines = Math.ceil(questionText.length / 80);
                      questionHeight += estimatedLines * 4 + 5;
                      
                      // Add options height
                      if ((question as any).options) {
                        questionHeight += 5 + ((question as any).options.length * 4);
                      }
                      
                      questionHeight += 8; // Space after question
                      
                      // Check if question fits on current page
                      if (currentY + questionHeight > pageHeight - bottomMargin) {
                        pages++;
                        currentY = topMargin + 15; // Reset for new page
                      }
                      
                      currentY += questionHeight;
                    }
                    
                    return `${pages} pages • Dynamic layout maximizes space usage`;
                  })()}
                </div>
              </div>
              <Button onClick={exportToPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Export A4 PDF
            </Button>
            </div>
          )}
        </div>

        {isCreating && currentTest && canCreateTests ? (
          <Card className="mb-4 sm:mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <CardTitle>Create New Test</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={saveTest} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Test
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setIsCreating(false)} variant="outline">Cancel</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="w-full">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Test Title</label>
                  <Input 
                    value={currentTest.title} 
                    onChange={(e) => setCurrentTest({ ...currentTest, title: e.target.value })} 
                    placeholder="Enter test title" 
                    className="w-full"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Duration (minutes)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={Number.isFinite(currentTest.duration) ? currentTest.duration : ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setCurrentTest({ ...currentTest, duration: 1 });
                        return;
                      }
                      const next = Math.max(1, Number(raw));
                      setCurrentTest({ ...currentTest, duration: isNaN(next) ? 1 : next });
                    }}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium mb-2">Description</label>
                <Textarea 
                  value={currentTest.description} 
                  onChange={(e) => setCurrentTest({ ...currentTest, description: e.target.value })} 
                  placeholder="Enter test description" 
                  rows={3} 
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs sm:text-sm font-semibold mb-2 sm:mb-0 w-full sm:w-auto">Add Question:</span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => addQuestionOfType("MCQ")} 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial" 
                    size="sm"
                  >
                    + MCQ
                  </Button>
                  <Button 
                    onClick={() => addQuestionOfType("STATEMENT")} 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial" 
                    size="sm"
                  >
                    + Statement
                  </Button>
                  <Button 
                    onClick={() => addQuestionOfType("TABLE")} 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial" 
                    size="sm"
                  >
                    + Table
                  </Button>
                </div>
              </div>

              {currentTest.questions.length > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Question Summary */}
                  <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{currentTest.questions.length}</div>
                          <div className="text-sm text-gray-600">Total Questions</div>
                          </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{currentTest.questions.length * 2}</div>
                          <div className="text-sm text-gray-600">Total Marks</div>
                                </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{currentTest.duration}</div>
                          <div className="text-sm text-gray-600">Duration (min)</div>
                            </div>
                              </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Marks per Question</div>
                        <div className="text-lg font-semibold text-gray-900">2 marks</div>
                            </div>
                        </div>
                      </div>
                  
                  {/* Drag & Drop Instructions */}
                  <div className="p-3 bg-blue-600 border border-blue-700 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <GripVertical className="w-4 h-4" />
                      <span className="font-medium">Drag & Drop to Reorder:</span>
                      <span>Use the grip handle on the left to drag questions and change their sequence</span>
                          </div>
                      </div>
                      </div>
              )}

              <div ref={printableRef} className="space-y-4 bg-white p-3 sm:p-4 rounded border">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentTest.questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {currentTest.questions.map((q, index) => (
                      <SortableQuestionItem
                        key={q.id}
                        question={q}
                        index={index}
                        updateQuestion={updateQuestion}
                        updateOption={updateOption}
                        setCorrectAnswer={setCorrectAnswer}
                        addStatementRow={addStatementRow}
                        updateStatement={updateStatement}
                        addPairRow={addPairRow}
                        updatePair={updatePair}
                        removeQuestion={removeQuestion}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </CardContent>
          </Card>
        ) : (
          canCreateTests && (
            <div className="mb-4 sm:mb-6">
              <Button 
                onClick={createNewTest} 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" /> Create New Test
              </Button>
            </div>
          )
        )}

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold">Available Tests</h2>
            {!canCreateTests && session && (
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
                <span className="font-medium">👨‍🎓 Student Mode:</span> You can take any of the tests below
              </div>
            )}
            {canCreateTests && (
              <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <span className="font-medium">👨‍🏫 Mentor Mode:</span> You can create and take tests
              </div>
            )}
          </div>
          {tests.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Available</h3>
              <p className="text-gray-600 mb-6">
                {canCreateTests 
                  ? "Create your first test to get started" 
                  : "No tests have been created yet. Ask a mentor to create some tests."
                }
              </p>
            </div>
          )}
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col space-y-4">
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg sm:text-xl flex-1">{test.title}</CardTitle>
                      <div className="flex gap-2">
                        {test.id === "demo" && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                            Sample Test
                          </Badge>
                        )}
                        {savedTests.find(st => st.id === test.id)?.createdBy && (
                          <Badge variant="outline" className="text-xs">
                            By {savedTests.find(st => st.id === test.id)?.createdBy.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">{test.description}</p>
                    {savedTests.find(st => st.id === test.id) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(savedTests.find(st => st.id === test.id)?.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />{test.questions.length} Questions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />{test.duration} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">{test.questions.length * 2} marks</Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">2 marks each</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
                    <Button 
                      onClick={() => startTest(test)} 
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-1 sm:mr-2" /> 
                      <span className="hidden sm:inline">Start Test</span>
                      <span className="sm:hidden">Start</span>
                    </Button>
                    <Button 
                      onClick={() => {
                        setCurrentTest(test);
                        setShowOMRUpload(true);
                      }} 
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-1 sm:mr-2" /> 
                      <span className="hidden sm:inline">Upload OMR</span>
                      <span className="sm:hidden">OMR</span>
                    </Button>
                    {/* Show delete button for own tests */}
                    {canCreateTests && 
                     session?.user?.id && 
                     savedTests.find(st => st.id === test.id)?.createdBy.id === session.user.id && (
                      <Button 
                        onClick={() => deleteTest(test.id, test.title)}
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1 sm:flex-initial"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> 
                        <span className="hidden sm:inline">Delete</span>
                        <span className="sm:hidden">Del</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* OMR Upload Modal */}
        {showOMRUpload && currentTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Upload OMR Answer Sheet</h3>
              
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Image Requirements:</strong><br/>
                    • Upload a clear, well-lit image of your filled OMR sheet<br/>
                    • Ensure the entire sheet is visible and not cropped<br/>
                    • Fill bubbles completely with dark pen/pencil<br/>
                    • Keep the sheet flat without shadows or glare
                  </AlertDescription>
                </Alert>
                
                {/* Sensitivity Control */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Detection Sensitivity: <span className="text-blue-600 font-semibold">{omrSensitivity === 0.1 ? 'Very High' : omrSensitivity === 0.3 ? 'High' : omrSensitivity === 0.5 ? 'Medium' : omrSensitivity === 0.7 ? 'Low' : 'Very Low'}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">More Sensitive</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.2"
                      value={omrSensitivity}
                      onChange={(e) => setOmrSensitivity(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">Less Sensitive</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 <strong>Tip:</strong> Use higher sensitivity for lightly filled bubbles, lower for very dark marks.
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <label htmlFor="omr-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600">Click to upload OMR sheet</span>
                    <input
                      id="omr-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                      disabled={isProcessingOMR}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG (Max 10MB)<br/>
                    <strong>Tip:</strong> Use good lighting and avoid shadows for best results
                  </p>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="space-y-3">
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="OMR Sheet Preview" 
                        className="w-full h-40 object-contain bg-gray-50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => selectedOMRFile && handleOMRUpload(selectedOMRFile)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={isProcessingOMR || !selectedOMRFile}
                      >
                        {isProcessingOMR ? 'Processing...' : 'Process OMR Sheet'}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedOMRFile(null);
                          setImagePreview(null);
                        }}
                        variant="outline"
                        disabled={isProcessingOMR}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                
                {isProcessingOMR && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Processing OMR sheet...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Analyzing bubbles and extracting answers. This may take a few seconds.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>For Best Results:</strong><br/>
                      1. Download and print the OMR template on white paper<br/>
                      2. Fill bubbles completely with black/blue pen<br/>
                      3. Take a clear, straight photo with good lighting<br/>
                      4. Ensure entire sheet is visible without cropping
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-between gap-3">
                    <Button
                      onClick={downloadOMRTemplate}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <Button
                      onClick={() => setShowOMRUpload(false)}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessingOMR}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OMR Results Display */}
        {omrResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const csvData = ResultAnalyzer.exportResults(omrResults, 'csv');
                        const blob = new Blob([csvData], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'test_results.csv';
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={resetOMRResults}
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                <div className="p-6">
                  {/* Marking Scheme Info */}
                  <Alert className="mb-6">
                    <Award className="h-4 w-4" />
                    <AlertDescription>
                      <strong>UPSC Marking Scheme:</strong> +2 marks for correct answer, -0.67 marks for incorrect answer, 0 for unattempted
                    </AlertDescription>
                  </Alert>

                  {/* Overall Results */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {omrResults.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-800">Overall Score</div>
                      <div className="text-lg font-semibold text-gray-700 mt-1">
                        {omrResults.totalMarks}/{omrResults.maxMarks}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {omrResults.correctAnswers}
                      </div>
                      <div className="text-sm text-green-800">Correct Answers</div>
                      <div className="text-lg font-semibold text-gray-700 mt-1">
                        Grade: {omrResults.grade}
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {omrResults.incorrectAnswers}
                      </div>
                      <div className="text-sm text-red-800">Incorrect Answers</div>
                      <div className="text-lg font-semibold text-gray-700 mt-1">
                        Lost: {(omrResults.incorrectAnswers * 0.67).toFixed(2)} marks
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {omrResults.unattemptedQuestions}
                      </div>
                      <div className="text-sm text-yellow-800">Unattempted</div>
                      <div className="text-lg font-semibold text-gray-700 mt-1">
                        Total: {omrResults.totalQuestions}
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="analysis" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="analysis">Question Analysis</TabsTrigger>
                      <TabsTrigger value="subjects">Subject-wise</TabsTrigger>
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                      <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="analysis" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Question-wise Analysis</h3>
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                          {omrResults.questionAnalysis.map((qa) => (
                            <div
                              key={qa.questionNumber}
                              className={`p-4 rounded-lg border-l-4 ${
                                qa.isCorrect
                                  ? 'bg-green-50 border-l-green-500'
                                  : qa.isAttempted
                                  ? 'bg-red-50 border-l-red-500'
                                  : 'bg-yellow-50 border-l-yellow-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900">
                                    Q{qa.questionNumber}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      Your Answer: 
                                      <span className="font-semibold">
                                        {qa.studentAnswer ? qa.studentAnswer.toUpperCase() : 'Not Attempted'}
                                      </span>
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      Correct: <span className="font-semibold">{qa.correctAnswer.toUpperCase()}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={qa.isCorrect ? 'default' : qa.isAttempted ? 'destructive' : 'secondary'}>
                                    {qa.isCorrect ? 'Correct' : qa.isAttempted ? 'Incorrect' : 'Unattempted'}
                                  </Badge>
                                  <span className={`text-sm font-semibold ${qa.marks < 0 ? 'text-red-600' : qa.marks > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                    {qa.marks > 0 ? '+' : ''}{qa.marks.toFixed(2)}/{qa.maxMarks}
                                  </span>
                                  {qa.confidence && (
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(qa.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="subjects" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
                        <div className="grid gap-4">
                          {omrResults.subjectWiseAnalysis.map((subject) => (
                            <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{subject.percentage.toFixed(1)}%</div>
                                  <div className="text-sm text-gray-600">
                                    {subject.marks}/{subject.maxMarks} marks
                                  </div>
                                </div>
                              </div>
                              <Progress value={subject.percentage} className="mb-2" />
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Questions: {subject.totalQuestions}</span>
                                <span>Attempted: {subject.attemptedQuestions}</span>
                                <span>Correct: {subject.correctAnswers}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="insights" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                        <div className="space-y-3">
                          {ResultAnalyzer.generateInsights(omrResults).map((insight, index) => (
                            <Alert key={index}>
                              <TrendingUp className="h-4 w-4" />
                              <AlertDescription>{insight}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="recommendations" className="mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Study Recommendations</h3>
                        <div className="space-y-3">
                          {ResultAnalyzer.generateRecommendations(omrResults).map((recommendation, index) => (
                            <Alert key={index}>
                              <Target className="h-4 w-4" />
                              <AlertDescription>{recommendation}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
