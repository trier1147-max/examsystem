'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  Pencil, Trash2, Check, X, ChevronDown, ChevronRight as ChevronRightIcon,
  Upload, Copy, Eye, EyeOff, MoreHorizontal, AlertTriangle,
  CheckCircle2, FileSpreadsheet, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { mockQuestions, type Question, type QuestionType, type Difficulty } from '@/mock/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── constants ──────────────────────────────────────────────────────────────
const FIXED_SUBJECT = '全部';
const PAGE_SIZE = 10;

const typeLabels: Record<QuestionType, string> = {
  choice: '单选题', fill: '填空题', short: '简答题', essay: '论述题',
  tf: '判断题', attachment: '附件题',
};
const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单', medium: '中等', hard: '困难',
};
const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const INIT_SUBJECTS = ['数据结构', '计算机网络'];
const INIT_CHAPTERS: Record<string, string[]> = {
  '数据结构': ['栈与队列', '二叉树', '图论'],
  '计算机网络': ['OSI模型', 'TCP/IP', '网络安全'],
};

// mock import rows
const MOCK_IMPORT_ROWS = [
  { id: 1, content: '下列哪种排序算法的平均时间复杂度为O(n log n)？', type: '单选题', difficulty: '中等', subject: '数据结构', chapter: '排序算法', status: 'ok' as const },
  { id: 2, content: '快速排序在最坏情况下的时间复杂度为___。', type: '填空题', difficulty: '中等', subject: '数据结构', chapter: '排序算法', status: 'ok' as const },
  { id: 3, content: '简述哈希表的冲突解决方法。', type: '简答题', difficulty: '简单', subject: '数据结构', chapter: '哈希表', status: 'ok' as const },
  { id: 4, content: 'TCP三次握手的详细过程及各阶段意义。', type: '论述题', difficulty: '困难', subject: '计算机网络', chapter: 'TCP/IP', status: 'ok' as const },
  { id: 5, content: 'IP地址的分类包括___类。', type: '填空题', difficulty: '简单', subject: '计算机网络', chapter: 'TCP/IP', status: 'ok' as const },
  { id: 6, content: '', type: '单选题', difficulty: '中等', subject: '数据结构', chapter: '', status: 'warn' as const },
  { id: 7, content: '子网掩码255.255.255.0对应的CIDR表示为___。', type: '填空题', difficulty: '简单', subject: '计算机网络', chapter: 'TCP/IP', status: 'ok' as const },
  { id: 8, content: 'INVALID_TYPE的错误格式题目。', type: '', difficulty: '', subject: '', chapter: '', status: 'error' as const },
];

// ── helpers ────────────────────────────────────────────────────────────────
function emptyForm(subjects: string[]): FormState {
  return {
    type: 'choice',
    content: '',
    answer: '',
    keywords: '',
    difficulty: 'medium',
    subject: subjects[0] ?? '数据结构',
    chapter: '',
    score: 4,
    options: ['', '', '', ''],
    explanation: '',
    essayPoints: [''],
    altAnswers: [''],
    tfAnswer: 'T',
    matchRule: 'contains',
    matchPreview: '',
    dimensions: [
      { name: '观点明确', score: 5, desc: '' },
      { name: '逻辑清晰', score: 5, desc: '' },
    ],
    attachDimensions: [
      { name: '', score: 5 },
    ],
  };
}

interface ScoreDimension { name: string; score: number; desc: string; }
interface AttachDimension { name: string; score: number; }

interface FormState {
  type: QuestionType;
  content: string;
  answer: string;
  keywords: string;
  difficulty: Difficulty;
  subject: string;
  chapter: string;
  score: number;
  options: string[];
  explanation: string;
  essayPoints: string[];
  altAnswers: string[];
  tfAnswer: 'T' | 'F';
  matchRule: 'exact' | 'contains' | 'custom';
  matchPreview: string;
  dimensions: ScoreDimension[];
  attachDimensions: AttachDimension[];
}

// ── main component ─────────────────────────────────────────────────────────
export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [subjects, setSubjects] = useState<string[]>(INIT_SUBJECTS);
  const [chapters, setChapters] = useState<Record<string, string[]>>(INIT_CHAPTERS);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set(['数据结构']));

  // filters
  const [selectedSubject, setSelectedSubject] = useState(FIXED_SUBJECT);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [page, setPage] = useState(1);

  // practice toggle
  const [practiceIds, setPracticeIds] = useState<Set<string>>(
    new Set(['Q001', 'Q002', 'Q003', 'Q007', 'Q008', 'Q009'])
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const togglePractice = (id: string) => {
    setPracticeIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    toast.success(practiceIds.has(id) ? '已关闭该题练习权限' : '已开放该题供学生练习');
  };
  const batchSetPractice = (ids: Set<string>, enabled: boolean) => {
    setPracticeIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => enabled ? next.add(id) : next.delete(id));
      return next;
    });
    toast.success(`已${enabled ? '开放' : '关闭'} ${ids.size} 道题的练习权限`);
    setSelectedRowIds(new Set());
  };
  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // row expand
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // slide panel (new/edit question)
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(INIT_SUBJECTS));
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // subject/chapter editing
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingSubjectVal, setEditingSubjectVal] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingChapter, setEditingChapter] = useState<{ sub: string; ch: string } | null>(null);
  const [editingChapterVal, setEditingChapterVal] = useState('');
  const [addingChapterFor, setAddingChapterFor] = useState<string | null>(null);
  const [newChapterName, setNewChapterName] = useState('');

  // import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFileName, setImportFileName] = useState('');
  const [importMode, setImportMode] = useState<'ok-only' | 'all'>('ok-only');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // keyboard shortcut for slide panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && slideOpen) closeSlide();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && slideOpen) handleSave(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slideOpen, form]);

  // ── computed ──
  const filtered = questions.filter((q) => {
    const matchSub = selectedSubject === FIXED_SUBJECT || q.subject === selectedSubject;
    const matchCh = !selectedChapter || q.chapter === selectedChapter;
    const matchType = typeFilter === 'all' || q.type === typeFilter;
    const matchDiff = diffFilter === 'all' || q.difficulty === diffFilter;
    const matchSearch = !search || q.content.toLowerCase().includes(search.toLowerCase()) || q.subject.includes(search);
    return matchSub && matchCh && matchType && matchDiff && matchSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const okRows = MOCK_IMPORT_ROWS.filter((r) => r.status === 'ok');
  const warnRows = MOCK_IMPORT_ROWS.filter((r) => r.status === 'warn');
  const errorRows = MOCK_IMPORT_ROWS.filter((r) => r.status === 'error');

  // ── handlers ──
  const resetFilters = () => { setPage(1); };

  const selectSubject = (s: string) => {
    setSelectedSubject(s);
    setSelectedChapter(null);
    resetFilters();
  };
  const selectChapter = (sub: string, ch: string) => {
    setSelectedSubject(sub);
    setSelectedChapter(ch);
    resetFilters();
  };
  const toggleExpand = (s: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setForm({
      type: q.type,
      content: q.content,
      answer: q.answer,
      keywords: (q.keywords ?? []).join('，'),
      difficulty: q.difficulty,
      subject: q.subject,
      chapter: q.chapter ?? '',
      score: q.score,
      options: q.options ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      explanation: '',
      essayPoints: [''],
      altAnswers: [''],
      tfAnswer: 'T',
      matchRule: 'contains',
      matchPreview: '',
      dimensions: [
        { name: '观点明确', score: 5, desc: '' },
        { name: '逻辑清晰', score: 5, desc: '' },
      ],
      attachDimensions: [{ name: '', score: 5 }],
    });
    setSlideOpen(true);
  };

  const closeSlide = () => {
    setSlideOpen(false);
    setEditingQuestion(null);
    setForm(emptyForm(subjects));
  };

  const handleSave = (continueAdding: boolean) => {
    if (!form.content.trim()) { toast.error('请填写题目内容'); return; }
    const needsAnswer = !['attachment'].includes(form.type);
    if (needsAnswer && !form.answer.trim() && form.type !== 'tf') { toast.error('请填写正确答案'); return; }
    const tfAns = form.tfAnswer === 'T' ? '对' : '错';
    const updated: Question = {
      id: editingQuestion?.id ?? `Q${String(questions.length + 1).padStart(3, '0')}`,
      type: form.type,
      content: form.content,
      answer: form.type === 'tf' ? tfAns : form.type === 'attachment' ? '（附件作答）' : form.answer,
      keywords: form.keywords ? form.keywords.split(/[，,]/).map((s) => s.trim()).filter(Boolean) : [],
      difficulty: form.difficulty,
      subject: form.subject,
      chapter: form.chapter || undefined,
      score: form.score,
      ...(form.type === 'choice' ? { options: form.options.filter(Boolean) } : {}),
    };
    if (editingQuestion) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? updated : q)));
      toast.success('题目已更新');
      closeSlide();
    } else {
      setQuestions((prev) => [updated, ...prev]);
      toast.success('题目保存成功');
      if (continueAdding) {
        setForm((prev) => ({
          ...emptyForm(subjects),
          subject: prev.subject,
          chapter: prev.chapter,
          difficulty: prev.difficulty,
          type: prev.type,
        }));
        setTimeout(() => contentRef.current?.focus(), 50);
      } else {
        closeSlide();
      }
    }
  };

  const handleCopy = (q: Question) => {
    const copy: Question = {
      ...q,
      id: `Q${String(questions.length + 1).padStart(3, '0')}`,
      content: q.content + '（副本）',
    };
    setQuestions((prev) => [copy, ...prev]);
    toast.success('题目已复制');
  };

  const handleDelete = (q: Question) => {
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
    setDeleteTarget(null);
    toast.success('题目已删除');
  };

  const handleImportConfirm = () => {
    const rows = importMode === 'ok-only' ? okRows : MOCK_IMPORT_ROWS;
    const newQs: Question[] = rows.map((r, i) => ({
      id: `Q${String(questions.length + i + 1).padStart(3, '0')}`,
      type: 'choice' as QuestionType,
      content: r.content || '（导入题目）',
      answer: 'A',
      difficulty: 'medium' as Difficulty,
      subject: r.subject || subjects[0] || '数据结构',
      chapter: r.chapter || undefined,
      score: 4,
      keywords: [],
    }));
    setQuestions((prev) => [...newQs, ...prev]);
    toast.success(`成功导入 ${newQs.length} 道题目`);
    setImportOpen(false);
    setImportStep(1);
    setImportFileName('');
  };

  // ── render helpers ──
  const renderRowExpand = (q: Question) => (
    <tr key={`${q.id}-expand`}>
      <td colSpan={9} className="px-0 pb-0">
        <div className="bg-slate-50 border-b border-t border-slate-100 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{q.id}</span>
            <span>·</span>
            <Badge variant="secondary" className="text-xs">{typeLabels[q.type]}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[q.difficulty]}`}>{difficultyLabels[q.difficulty]}</span>
            <span>{q.subject}{q.chapter ? ` › ${q.chapter}` : ''}</span>
          </div>

          <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.content}</p>

          {q.type === 'choice' && q.options && (
            <div className="grid grid-cols-2 gap-1.5">
              {q.options.map((opt) => {
                const letter = opt[0];
                const isCorrect = letter === q.answer;
                return (
                  <div key={opt} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${isCorrect ? 'border-green-300 bg-green-50 text-green-800 font-semibold' : 'border-gray-100 text-gray-700'}`}>
                    {isCorrect && <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />}
                    {opt}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-start gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">正确答案：</span>
              <span className="text-green-700 font-semibold">{q.answer}</span>
            </div>
            {q.keywords && q.keywords.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-muted-foreground">关键词：</span>
                {q.keywords.map((kw) => (
                  <span key={kw} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{kw}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => openEdit(q)}>
              <Pencil size={11} /> 编辑
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => handleCopy(q)}>
              <Copy size={11} /> 复制
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(q)}>
              <Trash2 size={11} /> 删除
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">题库管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => { setImportOpen(true); setImportStep(1); }}>
            <Upload size={15} />
            批量导入
          </Button>
          <Button
            className="gap-1.5 text-white"
            style={{ background: '#002045' }}
            onClick={() => { setForm(emptyForm(subjects)); setSlideOpen(true); }}
          >
            <Plus size={16} />
            新增题目
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* ── Subject / Chapter sidebar ── */}
        <Card className="w-52 shadow-none border flex-shrink-0 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">学科分类</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-0.5">
            {/* All */}
            <button
              onClick={() => { setSelectedSubject(FIXED_SUBJECT); setSelectedChapter(null); setPage(1); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedSubject === FIXED_SUBJECT && !selectedChapter ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
              style={selectedSubject === FIXED_SUBJECT && !selectedChapter ? { background: '#002045' } : {}}
            >
              全部 <span className="opacity-60 text-xs ml-1">({questions.length})</span>
            </button>

            {subjects.map((s) => {
              const isExpanded = expandedSubjects.has(s);
              const isSubActive = selectedSubject === s && !selectedChapter;
              const subChapters = chapters[s] ?? [];
              return (
                <div key={s}>
                  {/* Subject row */}
                  <div className="group relative flex items-center">
                    {editingSubject === s ? (
                      <div className="flex items-center gap-1 px-2 py-1 w-full">
                        <Input autoFocus value={editingSubjectVal} onChange={(e) => setEditingSubjectVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { confirmEditSubject(s); }
                            else if (e.key === 'Escape') setEditingSubject(null);
                          }}
                          className="h-6 text-xs flex-1 px-1" />
                        <button className="text-green-600" onClick={() => confirmEditSubject(s)}><Check size={12} /></button>
                        <button className="text-gray-400" onClick={() => setEditingSubject(null)}><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <button
                          className={`flex-1 flex items-center gap-1 px-2 py-2 rounded-lg text-sm transition-colors ${isSubActive ? 'text-white' : 'text-gray-700 hover:bg-muted'}`}
                          style={isSubActive ? { background: '#002045' } : {}}
                          onClick={() => { selectSubject(s); toggleExpand(s); }}
                        >
                          <span className="flex-shrink-0">
                            {isExpanded
                              ? <ChevronDown size={13} className={isSubActive ? 'text-white/70' : 'text-muted-foreground'} />
                              : <ChevronRightIcon size={13} className={isSubActive ? 'text-white/70' : 'text-muted-foreground'} />}
                          </span>
                          <span className="truncate">{s}</span>
                          <span className={`ml-auto text-xs opacity-60 flex-shrink-0`}>({questions.filter((q) => q.subject === s).length})</span>
                        </button>
                        <span className="absolute right-1 hidden group-hover:flex items-center gap-0.5 z-10">
                          <span className={`p-0.5 rounded hover:bg-black/10 cursor-pointer`} title="编辑学科"
                            onClick={(e) => { e.stopPropagation(); setEditingSubject(s); setEditingSubjectVal(s); }}>
                            <Pencil size={10} className={isSubActive ? 'text-white/70' : 'text-gray-400'} />
                          </span>
                          <span className="p-0.5 rounded hover:bg-black/10 cursor-pointer" title="新增章节"
                            onClick={(e) => { e.stopPropagation(); setAddingChapterFor(s); setExpandedSubjects((p) => new Set([...p, s])); }}>
                            <Plus size={10} className={isSubActive ? 'text-white/70' : 'text-gray-400'} />
                          </span>
                          <span className="p-0.5 rounded hover:bg-black/10 cursor-pointer" title="删除学科"
                            onClick={(e) => { e.stopPropagation(); if (selectedSubject === s) { setSelectedSubject(FIXED_SUBJECT); setSelectedChapter(null); } setSubjects((p) => p.filter((x) => x !== s)); setChapters((p) => { const n = { ...p }; delete n[s]; return n; }); toast.success('学科已删除'); }}>
                            <Trash2 size={10} className={isSubActive ? 'text-white/70' : 'text-red-400'} />
                          </span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Chapter rows */}
                  {isExpanded && (
                    <div className="ml-3 space-y-0.5 mt-0.5">
                      {subChapters.map((ch) => {
                        const isChActive = selectedSubject === s && selectedChapter === ch;
                        return (
                          <div key={ch} className="group relative">
                            {editingChapter?.sub === s && editingChapter?.ch === ch ? (
                              <div className="flex items-center gap-1 px-2 py-1">
                                <Input autoFocus value={editingChapterVal}
                                  onChange={(e) => setEditingChapterVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmEditChapter(s, ch);
                                    else if (e.key === 'Escape') setEditingChapter(null);
                                  }}
                                  className="h-6 text-xs flex-1 px-1" />
                                <button className="text-green-600" onClick={() => confirmEditChapter(s, ch)}><Check size={12} /></button>
                                <button className="text-gray-400" onClick={() => setEditingChapter(null)}><X size={12} /></button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => selectChapter(s, ch)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${isChActive ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                  style={isChActive ? { background: '#002045' } : {}}
                                >
                                  {ch}
                                  <span className="ml-1 opacity-60">({questions.filter((q) => q.subject === s && q.chapter === ch).length})</span>
                                </button>
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                                  <span className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); setEditingChapter({ sub: s, ch }); setEditingChapterVal(ch); }}>
                                    <Pencil size={9} className={isChActive ? 'text-white/70' : 'text-gray-400'} />
                                  </span>
                                  <span className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); if (selectedChapter === ch) setSelectedChapter(null); setChapters((p) => ({ ...p, [s]: p[s].filter((x) => x !== ch) })); toast.success('章节已删除'); }}>
                                    <Trash2 size={9} className={isChActive ? 'text-white/70' : 'text-red-400'} />
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                      {/* Add chapter inline */}
                      {addingChapterFor === s ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input autoFocus placeholder="章节名称" value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { confirmAddChapter(s); }
                              else if (e.key === 'Escape') { setAddingChapterFor(null); setNewChapterName(''); }
                            }}
                            className="h-6 text-xs flex-1 px-1" />
                          <button className="text-green-600" onClick={() => confirmAddChapter(s)}><Check size={12} /></button>
                          <button className="text-gray-400" onClick={() => { setAddingChapterFor(null); setNewChapterName(''); }}><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingChapterFor(s)}
                          className="w-full flex items-center gap-1 px-3 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">
                          <Plus size={10} /> 新增章节
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add subject */}
            {addingSubject ? (
              <div className="flex items-center gap-1 px-2 py-1 mt-1">
                <Input autoFocus placeholder="学科名称" value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddSubject();
                    else if (e.key === 'Escape') { setAddingSubject(false); setNewSubjectName(''); }
                  }}
                  className="h-6 text-xs flex-1 px-1" />
                <button className="text-green-600" onClick={confirmAddSubject}><Check size={12} /></button>
                <button className="text-gray-400" onClick={() => { setAddingSubject(false); setNewSubjectName(''); }}><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => setAddingSubject(true)}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors border border-dashed border-gray-200 mt-1">
                <Plus size={12} /> 新增学科
              </button>
            )}
          </CardContent>
        </Card>

        {/* ── Question list ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <Card className="shadow-none border">
            <CardContent className="p-3 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-40">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="搜索题目内容..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 h-8 text-sm" />
              </div>
              <Filter size={13} className="text-muted-foreground" />
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? 'all'); setPage(1); }}>
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue>{typeFilter === 'all' ? '全部题型' : typeLabels[typeFilter as QuestionType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部题型</SelectItem>
                  {(Object.entries(typeLabels) as [QuestionType, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={diffFilter} onValueChange={(v) => { setDiffFilter(v ?? 'all'); setPage(1); }}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue>{diffFilter === 'all' ? '全部难度' : difficultyLabels[diffFilter as Difficulty]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部难度</SelectItem>
                  {(Object.entries(difficultyLabels) as [Difficulty, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">共 {filtered.length} 题</span>
            </CardContent>
          </Card>

          {/* Batch ops bar */}
          {selectedRowIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-200 text-sm">
              <span className="text-blue-700 font-medium">已选 {selectedRowIds.size} 题</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => batchSetPractice(selectedRowIds, true)}>
                  批量开放练习
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-gray-600 border-gray-300"
                  onClick={() => batchSetPractice(selectedRowIds, false)}>
                  批量关闭练习
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                  onClick={() => setSelectedRowIds(new Set())}>
                  取消选择
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <Card className="shadow-none border">
            <CardContent className="p-0">
              {paginated.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  <p className="mb-2">该分类下暂无题目</p>
                  <div className="flex justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setForm(emptyForm(subjects)); setSlideOpen(true); }}>录入题目</Button>
                    <Button size="sm" variant="outline" onClick={() => { setImportOpen(true); setImportStep(1); }}>批量导入</Button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={paginated.length > 0 && paginated.every(q => selectedRowIds.has(q.id))}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedRowIds(prev => new Set([...prev, ...paginated.map(q => q.id)]));
                            } else {
                              setSelectedRowIds(prev => {
                                const next = new Set(prev);
                                paginated.forEach(q => next.delete(q.id));
                                return next;
                              });
                            }
                          }}
                        />
                      </th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">ID</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">题目内容</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">题型</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">难度</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">学科/章节</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">分值</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">练习</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((q) => {
                      const isExpanded = expandedRowId === q.id;
                      const isSelected = selectedRowIds.has(q.id);
                      const isPracticeOn = practiceIds.has(q.id);
                      return (
                        <>
                          <tr
                            key={q.id}
                            className={`border-b hover:bg-muted/20 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''} ${isSelected ? 'bg-blue-50/30' : ''}`}
                            onClick={() => setExpandedRowId(isExpanded ? null : q.id)}
                          >
                            <td className="py-3 px-3 w-8" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(q.id)}
                              />
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{q.id}</td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="truncate text-gray-800">{q.content}</p>
                              {q.keywords && q.keywords.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {q.keywords.slice(0, 2).map((kw) => (
                                    <span key={kw} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{kw}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="text-xs">{typeLabels[q.type]}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[q.difficulty]}`}>
                                {difficultyLabels[q.difficulty]}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              <span>{q.subject}</span>
                              {q.chapter && <span className="text-gray-400"> › {q.chapter}</span>}
                            </td>
                            <td className="py-3 px-4 font-semibold text-xs">{q.score}分</td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => togglePractice(q.id)}
                                className={cn(
                                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                  isPracticeOn ? 'bg-green-500' : 'bg-gray-200'
                                )}
                                title={isPracticeOn ? '已开放练习（点击关闭）' : '未开放练习（点击开放）'}
                              >
                                <span className={cn(
                                  'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                                  isPracticeOn ? 'translate-x-4' : 'translate-x-0.5'
                                )} />
                              </button>
                            </td>
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button title="展开预览"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  onClick={() => setExpandedRowId(isExpanded ? null : q.id)}>
                                  {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button title="编辑"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  onClick={() => openEdit(q)}>
                                  <Pencil size={13} />
                                </button>
                                <button title="复制"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  onClick={() => handleCopy(q)}>
                                  <Copy size={13} />
                                </button>
                                <button title="删除"
                                  className="p-1 rounded hover:bg-muted text-red-400"
                                  onClick={() => setDeleteTarget(q)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && renderRowExpand(q)}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">第 {page} / {totalPages} 页</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide panel: new question ── */}
      {slideOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSlideOpen(false)} />
          <div className="relative z-50 w-[480px] h-full bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="font-semibold text-gray-900">{editingQuestion ? '编辑题目' : '新增题目'}</h2>
                {editingQuestion && <p className="text-xs text-muted-foreground font-mono mt-0.5">{editingQuestion.id}</p>}
              </div>
              <button onClick={closeSlide} className="text-muted-foreground hover:text-gray-700 p-1 rounded hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Type tabs */}
              <div>
                <Label className="text-xs mb-2 block">题型</Label>
                <div className="flex gap-1 flex-wrap">
                  {(Object.entries(typeLabels) as [QuestionType, string][]).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setForm((p) => ({
                        ...p, type: v, answer: '', options: ['', '', '', ''],
                        score: v === 'tf' ? 2 : v === 'attachment' ? 15 : p.score,
                      }))}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${form.type === v ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-muted'}`}
                      style={form.type === v ? { background: '#002045' } : {}}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">学科</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm((p) => ({ ...p, subject: v ?? p.subject, chapter: '' }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue>{form.subject}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">章节</Label>
                  <Select value={form.chapter} onValueChange={(v) => setForm((p) => ({ ...p, chapter: v ?? '' }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue>{form.chapter || '请选择章节'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不指定章节</SelectItem>
                      {(chapters[form.subject] ?? []).map((ch) => (
                        <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">难度</Label>
                  <div className="flex gap-1.5">
                    {(Object.entries(difficultyLabels) as [Difficulty, string][]).map(([v, l]) => (
                      <button key={v}
                        onClick={() => setForm((p) => ({ ...p, difficulty: v }))}
                        className={`flex-1 py-1 rounded text-xs border transition-colors ${form.difficulty === v ? difficultyColors[v] + ' border-transparent font-semibold' : 'border-gray-200 text-gray-500 hover:bg-muted'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">分值</Label>
                  <Input type="number" value={form.score} min={1} max={30}
                    onChange={(e) => setForm((p) => ({ ...p, score: Number(e.target.value) }))}
                    className="h-8 text-sm" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <Label className="text-xs">题目内容 <span className="text-red-500">*</span></Label>
                <Textarea ref={contentRef} placeholder="请输入题目内容..." rows={3}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  className="text-sm resize-none" />
              </div>

              {/* Choice options */}
              {form.type === 'choice' && (
                <div className="space-y-2">
                  <Label className="text-xs">选项与正确答案</Label>
                  {form.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isCorrect = form.answer === letter;
                    return (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}>
                        <button
                          onClick={() => setForm((p) => ({ ...p, answer: letter }))}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-500'}`}>
                          {letter}
                        </button>
                        <Input value={opt} placeholder={`选项 ${letter}`}
                          onChange={(e) => {
                            const opts = [...form.options];
                            opts[i] = e.target.value;
                            setForm((p) => ({ ...p, options: opts }));
                          }}
                          className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 flex-1 px-0 bg-transparent" />
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">点击字母圆圈设为正确答案，当前正确答案：<span className="font-semibold text-green-700">{form.answer || '未选'}</span></p>
                </div>
              )}

              {/* TF answer */}
              {form.type === 'tf' && (
                <div className="space-y-2">
                  <Label className="text-xs">正确答案 <span className="text-red-500">*</span></Label>
                  <div className="flex gap-3">
                    {([['T', '✓ 对'] , ['F', '✗ 错']] as const).map(([v, l]) => (
                      <button key={v}
                        onClick={() => setForm(p => ({ ...p, tfAnswer: v }))}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.tfAnswer === v ? (v === 'T' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700') : 'border-gray-200 text-gray-500 hover:bg-muted'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">判断题自动批改，与选择题逻辑相同</p>
                </div>
              )}

              {/* Fill answer */}
              {form.type === 'fill' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">正确答案 <span className="text-red-500">*</span></Label>
                    <Input placeholder="标准答案" value={form.answer}
                      onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                      className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">匹配规则</Label>
                    <div className="space-y-1.5">
                      {([
                        ['exact',    '精确匹配', '答案必须完全一致（去除首尾空格）'],
                        ['contains', '包含匹配', '学生答案中包含正确答案即可（推荐）'],
                        ['custom',   '仅限以下', '只接受下方明确列出的答案'],
                      ] as const).map(([v, l, desc]) => (
                        <label key={v} className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${form.matchRule === v ? 'border-blue-300 bg-blue-50/50' : 'border-gray-100 hover:bg-muted/50'}`}>
                          <input type="radio" name="matchRule" checked={form.matchRule === v}
                            onChange={() => setForm(p => ({ ...p, matchRule: v }))}
                            className="mt-0.5 accent-blue-600" />
                          <div>
                            <span className="text-xs font-medium text-gray-800">{l}</span>
                            <span className="text-xs text-muted-foreground ml-1.5">{desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">可接受的其他写法</Label>
                    {form.altAnswers.map((a, i) => (
                      <div key={i} className="flex gap-1">
                        <Input placeholder={`写法 ${i + 1}`} value={a}
                          onChange={(e) => {
                            const arr = [...form.altAnswers];
                            arr[i] = e.target.value;
                            setForm((p) => ({ ...p, altAnswers: arr }));
                          }}
                          className="h-7 text-sm flex-1" />
                        {i === form.altAnswers.length - 1 && (
                          <button onClick={() => setForm((p) => ({ ...p, altAnswers: [...p.altAnswers, ''] }))}
                            className="px-2 text-xs text-blue-600 hover:text-blue-700">+</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Preview test */}
                  <div className="space-y-1">
                    <Label className="text-xs">预判测试</Label>
                    <div className="flex gap-2">
                      <Input placeholder="输入学生可能的答案..." value={form.matchPreview}
                        onChange={e => setForm(p => ({ ...p, matchPreview: e.target.value }))}
                        className="h-7 text-xs flex-1" />
                    </div>
                    {form.matchPreview && form.answer && (() => {
                      const std = form.answer.toLowerCase();
                      const input = form.matchPreview.toLowerCase();
                      const alts = form.altAnswers.filter(Boolean).map(a => a.toLowerCase());
                      const altMatch = alts.some(a => input === a || input.includes(a));
                      let match = altMatch;
                      if (!match) {
                        if (form.matchRule === 'exact') match = input === std;
                        else if (form.matchRule === 'contains') match = input.includes(std);
                        else match = input === std;
                      }
                      return (
                        <div className={`text-xs px-2 py-1 rounded border mt-1 ${match ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {match ? '✅ 匹配成功' : '❌ 不匹配 → 将标记为"待人工确认"'}
                          {match && form.matchRule === 'contains' && form.matchPreview !== form.answer && ` （包含"${form.answer}"）`}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Short/Essay answer */}
              {(form.type === 'short' || form.type === 'essay') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">参考答案 <span className="text-red-500">*</span></Label>
                    <Textarea placeholder="请输入参考答案..." rows={4}
                      value={form.answer}
                      onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                      className="text-sm resize-none" />
                  </div>
                  {form.type === 'short' && (
                    <div className="space-y-1">
                      <Label className="text-xs">评分关键词（逗号分隔）</Label>
                      <Input placeholder="关键词1，关键词2，关键词3"
                        value={form.keywords}
                        onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
                        className="h-8 text-sm" />
                      <p className="text-xs text-muted-foreground">系统将根据关键词命中情况给出初步评分，老师可在阅卷时调整</p>
                    </div>
                  )}
                  {form.type === 'essay' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">评分维度</Label>
                        <span className={`text-xs font-medium ${form.dimensions.reduce((s, d) => s + d.score, 0) === form.score ? 'text-green-600' : 'text-red-500'}`}>
                          合计 {form.dimensions.reduce((s, d) => s + d.score, 0)}/{form.score} 分
                          {form.dimensions.reduce((s, d) => s + d.score, 0) !== form.score && ' ⚠️ 须等于总分'}
                        </span>
                      </div>
                      {form.dimensions.map((dim, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <Input placeholder="维度名称" value={dim.name}
                            onChange={e => { const d = [...form.dimensions]; d[i] = { ...d[i], name: e.target.value }; setForm(p => ({ ...p, dimensions: d })); }}
                            className="h-7 text-xs flex-1" />
                          <Input placeholder="描述（选填）" value={dim.desc}
                            onChange={e => { const d = [...form.dimensions]; d[i] = { ...d[i], desc: e.target.value }; setForm(p => ({ ...p, dimensions: d })); }}
                            className="h-7 text-xs flex-1" />
                          <Input type="number" min={1} max={20} value={dim.score}
                            onChange={e => { const d = [...form.dimensions]; d[i] = { ...d[i], score: Number(e.target.value) }; setForm(p => ({ ...p, dimensions: d })); }}
                            className="h-7 text-xs w-14" />
                          <span className="text-xs text-muted-foreground">分</span>
                          {form.dimensions.length > 2 && (
                            <button onClick={() => setForm(p => ({ ...p, dimensions: p.dimensions.filter((_, j) => j !== i) }))}
                              className="text-red-400 hover:text-red-600"><X size={12} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setForm(p => ({ ...p, dimensions: [...p.dimensions, { name: '', score: 5, desc: '' }] }))}
                        className="text-xs text-blue-600 hover:text-blue-700">+ 添加维度</button>
                    </div>
                  )}
                </div>
              )}

              {/* Attachment answer */}
              {form.type === 'attachment' && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs text-muted-foreground">
                    <Upload size={16} className="mx-auto mb-1 opacity-40" />
                    参考答案 / 示例图（选填，供阅卷参考）
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">评分维度</Label>
                    </div>
                    {form.attachDimensions.map((dim, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <Input placeholder={`维度名称，如"线条规范性"`} value={dim.name}
                          onChange={e => { const d = [...form.attachDimensions]; d[i] = { ...d[i], name: e.target.value }; setForm(p => ({ ...p, attachDimensions: d })); }}
                          className="h-7 text-xs flex-1" />
                        <Input type="number" min={1} max={20} value={dim.score}
                          onChange={e => { const d = [...form.attachDimensions]; d[i] = { ...d[i], score: Number(e.target.value) }; setForm(p => ({ ...p, attachDimensions: d })); }}
                          className="h-7 text-xs w-16" />
                        <span className="text-xs text-muted-foreground">分</span>
                        {form.attachDimensions.length > 1 && (
                          <button onClick={() => setForm(p => ({ ...p, attachDimensions: p.attachDimensions.filter((_, j) => j !== i) }))}
                            className="text-red-400 hover:text-red-600"><X size={12} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setForm(p => ({ ...p, attachDimensions: [...p.attachDimensions, { name: '', score: 5 }] }))}
                      className="text-xs text-blue-600 hover:text-blue-700">+ 添加维度</button>
                  </div>
                  <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                    附件题由老师人工批改，系统负责收集和展示学生提交的文件
                  </p>
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-1">
                <Label className="text-xs">解析（选填）</Label>
                <Textarea placeholder="题目解析..." rows={2}
                  value={form.explanation}
                  onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
                  className="text-sm resize-none" />
              </div>

              {/* Preview */}
              {form.content && (
                <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">预览（学生视角）</p>
                  <p className="text-sm font-medium text-gray-900">{form.content}</p>
                  {form.type === 'choice' && form.options.some(Boolean) && (
                    <div className="space-y-1">
                      {form.options.filter(Boolean).map((opt, i) => (
                        <div key={i} className="text-xs text-gray-700 pl-2">{opt}</div>
                      ))}
                    </div>
                  )}
                  {form.type === 'fill' && (
                    <div className="h-7 border-b border-gray-400 w-32 inline-block" />
                  )}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="border-t px-5 py-3 flex gap-2 bg-white">
              <Button variant="outline" className="flex-1" onClick={closeSlide}>取消</Button>
              {!editingQuestion && (
                <Button variant="outline" className="flex-1" onClick={() => handleSave(true)}>保存并继续</Button>
              )}
              <Button className="flex-1 text-white" style={{ background: '#002045' }} onClick={() => handleSave(false)}>
                {editingQuestion ? '保存修改' : '保存并关闭'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import dialog ── */}
      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) { setImportOpen(false); setImportStep(1); setImportFileName(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量导入题目</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            {(['上传文件', '预览校验', '确认导入'] as const).map((label, i) => {
              const step = (i + 1) as 1 | 2 | 3;
              const active = importStep === step;
              const done = importStep > step;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={active ? { background: '#002045' } : {}}>
                    {done ? <Check size={12} /> : step}
                  </div>
                  <span className={`text-xs ${active ? 'font-semibold text-gray-900' : 'text-muted-foreground'}`}>{label}</span>
                  {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Upload */}
          {importStep === 1 && (
            <div className="space-y-4">
              <div className="flex gap-3 text-xs text-muted-foreground items-center">
                <span>下载模板：</span>
                <button className="flex items-center gap-1 text-blue-600 hover:underline">
                  <FileText size={13} /> Word模板
                </button>
                <button className="flex items-center gap-1 text-green-600 hover:underline">
                  <FileSpreadsheet size={13} /> Excel模板
                </button>
              </div>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) { setImportFileName(file.name); setImportStep(2); }
                }}
              >
                <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                {importFileName ? (
                  <p className="text-sm font-medium text-gray-700">{importFileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">拖拽文件到此处，或点击选择文件</p>
                    <p className="text-xs text-muted-foreground mt-1">支持 .docx / .xlsx，单次上限 200 题 / 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".docx,.xlsx" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setImportFileName(file.name); setImportStep(2); }
                }} />
            </div>
          )}

          {/* Step 2: Preview */}
          {importStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">共解析 {MOCK_IMPORT_ROWS.length} 题</span>
                <span className="text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> 正常 {okRows.length}</span>
                <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle size={12} /> 警告 {warnRows.length}</span>
                <span className="text-red-500 flex items-center gap-1"><X size={12} /> 错误 {errorRows.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">题目内容</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">题型</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">学科</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">章节</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_IMPORT_ROWS.map((row) => (
                      <tr key={row.id} className={`border-b ${row.status === 'warn' ? 'bg-yellow-50' : row.status === 'error' ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-3">
                          {row.status === 'ok' && <CheckCircle2 size={13} className="text-green-600" />}
                          {row.status === 'warn' && <AlertTriangle size={13} className="text-yellow-500" />}
                          {row.status === 'error' && <X size={13} className="text-red-500" />}
                        </td>
                        <td className="py-2 px-3 max-w-[180px] truncate text-gray-700">{row.content || <span className="text-muted-foreground italic">（空）</span>}</td>
                        <td className="py-2 px-3 text-muted-foreground">{row.type || '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{row.subject || '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{row.chapter || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {importStep === 3 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                {[
                  { value: 'ok-only' as const, label: `仅导入正常题目（${okRows.length} 题）`, desc: '跳过警告和错误行' },
                  { value: 'all' as const, label: `全部导入（${MOCK_IMPORT_ROWS.length} 题）`, desc: `异常 ${warnRows.length + errorRows.length} 题标记为草稿，可后续补全` },
                ].map((opt) => (
                  <div key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${importMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    onClick={() => setImportMode(opt.value)}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${importMode === opt.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {importStep > 1 && (
              <Button variant="outline" onClick={() => setImportStep((s) => (s - 1) as 1 | 2 | 3)}>上一步</Button>
            )}
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportStep(1); setImportFileName(''); }}>取消</Button>
            {importStep < 3 && (
              <Button
                style={{ background: '#002045' }}
                className="text-white"
                disabled={importStep === 1 && !importFileName}
                onClick={() => setImportStep((s) => (s + 1) as 1 | 2 | 3)}
              >
                下一步
              </Button>
            )}
            {importStep === 3 && (
              <Button style={{ background: '#002045' }} className="text-white" onClick={handleImportConfirm}>
                确认导入
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            即将删除题目：<span className="font-medium text-gray-900 line-clamp-2">{deleteTarget?.content}</span>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ── inline helper functions (defined inside component for state access) ──
  function confirmEditSubject(s: string) {
    const trimmed = editingSubjectVal.trim();
    if (trimmed && trimmed !== s) {
      setSubjects((prev) => prev.map((x) => (x === s ? trimmed : x)));
      setChapters((prev) => {
        const n: Record<string, string[]> = {};
        for (const k of Object.keys(prev)) n[k === s ? trimmed : k] = prev[k];
        return n;
      });
      if (selectedSubject === s) setSelectedSubject(trimmed);
      toast.success('学科已更新');
    }
    setEditingSubject(null);
  }

  function confirmEditChapter(sub: string, ch: string) {
    const trimmed = editingChapterVal.trim();
    if (trimmed && trimmed !== ch) {
      setChapters((prev) => ({ ...prev, [sub]: prev[sub].map((x) => (x === ch ? trimmed : x)) }));
      if (selectedChapter === ch) setSelectedChapter(trimmed);
      toast.success('章节已更新');
    }
    setEditingChapter(null);
  }

  function confirmAddChapter(sub: string) {
    const trimmed = newChapterName.trim();
    if (trimmed && !(chapters[sub] ?? []).includes(trimmed)) {
      setChapters((prev) => ({ ...prev, [sub]: [...(prev[sub] ?? []), trimmed] }));
      toast.success('章节已添加');
    }
    setNewChapterName('');
    setAddingChapterFor(null);
  }

  function confirmAddSubject() {
    const trimmed = newSubjectName.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
      setChapters((prev) => ({ ...prev, [trimmed]: [] }));
      toast.success('学科已添加');
    }
    setNewSubjectName('');
    setAddingSubject(false);
  }
}
