'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Keyboard,
  AlertTriangle, Flag, ChevronDown, ChevronUp as ChevronUpIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mockQuestions } from '@/mock/data';

// ── Mock data ───────────────────────────────────────────────────────────────

const EXAM_TITLES: Record<string, string> = {
  E006: '高等数学 期末考试',
  E004: '数据结构 期末考试',
  E005: '计算机网络 期末考试',
};

/** Correct-rate for auto-graded questions (simulated per-exam) */
const MOCK_RATES: { id: string; content: string; type: string; correctRate: number; total: number }[] = [
  { id: 'Q001', content: '以下哪种排序算法的最坏时间复杂度为O(n²)？', type: '单选题', correctRate: 82, total: 320 },
  { id: 'Q002', content: '二叉树的深度优先遍历包括哪几种？',          type: '单选题', correctRate: 74, total: 320 },
  { id: 'Q003', content: '栈和队列的本质区别是什么？',                 type: '单选题', correctRate: 68, total: 320 },
  { id: 'Q004', content: '图的广度优先搜索使用什么数据结构？',         type: '单选题', correctRate: 91, total: 320 },
  { id: 'Q005', content: '以下关于红黑树性质描述错误的是？',           type: '单选题', correctRate: 15, total: 320 },
  { id: 'Q011', content: '完全二叉树第n层最多有___个节点',             type: '填空题', correctRate: 78, total: 320 },
  { id: 'Q012', content: 'Dijkstra算法的时间复杂度为___',              type: '填空题', correctRate: 55, total: 320 },
  { id: 'Q015', content: '堆排序建堆阶段时间复杂度___',                type: '填空题', correctRate: 63, total: 320 },
];

const MOCK_ANSWERS: Record<string, { id: string; name: string; class: string; text: string }[]> = {
  Q016: [
    { id: 'S001', name: '张小明', class: '计科2101', text: 'TCP是面向连接的协议，通过三次握手建立连接，保证可靠传输，适用于文件下载、网页浏览等场景；UDP是无连接协议，不保证数据可靠到达，但速度快，适合实时视频直播、DNS查询等场景。' },
    { id: 'S002', name: '李华',   class: '计科2101', text: 'TCP和UDP都是传输层协议。TCP需要建立连接，保证数据完整性，UDP不需要连接直接发送数据，实时性好。' },
    { id: 'S003', name: '王芳',   class: '软工2101', text: '两者区别在于连接方式，TCP是流式传输会慢一些。' },
  ],
  Q017: [
    { id: 'S001', name: '张小明', class: '计科2101', text: '哈希冲突是指不同的键通过哈希函数映射到了同一个位置。解决方法有：①开放地址法，当冲突时探测下一个空位；②链地址法，每个槽维护一个链表；③再哈希法，使用第二个哈希函数。' },
    { id: 'S002', name: '李华',   class: '计科2101', text: '哈希冲突就是两个不同的key算出了同样的hash值。可以用开放地址法或者链地址法来解决，链地址法是每个桶里放一个链表。' },
    { id: 'S003', name: '王芳',   class: '软工2101', text: '当两个不同值映射到同一位置就是哈希冲突，可以用链表解决。' },
  ],
  Q018: [
    { id: 'S001', name: '张小明', class: '计科2101', text: 'ARP是地址解析协议，作用是将IP地址转换为MAC地址。工作过程：源主机广播ARP请求报文，询问目标IP对应的MAC；目标主机收到后单播回复自己的MAC地址；源主机将IP-MAC映射缓存到ARP表。' },
    { id: 'S002', name: '李华',   class: '计科2101', text: 'ARP协议用于在局域网中根据IP地址找到对应的MAC地址，通过广播方式查询，得到回应后缓存到本地ARP表中。' },
    { id: 'S003', name: '王芳',   class: '软工2101', text: 'ARP是地址解析协议，把IP转换成MAC，广播查询。' },
  ],
  Q019: [
    { id: 'S001', name: '张小明', class: '计科2101', text: '红黑树是一种自平衡二叉搜索树，有五个性质：每个节点是红色或黑色；根节点是黑色；叶节点（NIL）是黑色；红节点的子节点必须是黑色；从任意节点到叶节点的路径上黑色节点数（黑高度）相同。\n\n相比普通BST，红黑树通过旋转和变色操作保证树高度为O(log n)，避免了BST退化为链表的最坏情况。查找、插入、删除都保证O(log n)。\n\n实际应用：Java的TreeMap/TreeSet、C++ STL的map/set、Linux内核CFS调度器都使用红黑树。' },
    { id: 'S002', name: '李华',   class: '计科2101', text: '红黑树是平衡二叉树，每个节点有颜色属性，红色或黑色。主要性质：根是黑色的，红节点的孩子是黑色的，黑高度相同。和普通BST相比，红黑树通过旋转保持平衡，时间复杂度稳定在O(log n)。' },
    { id: 'S003', name: '王芳',   class: '软工2101', text: '红黑树是有颜色的二叉树，可以自动平衡，比BST稳定。' },
  ],
  Q020: [
    { id: 'S001', name: '张小明', class: '计科2101', text: '完整过程分为：①DNS解析：浏览器先检查本地缓存，未命中则向DNS服务器发起递归查询，将域名解析为IP；②TCP三次握手：SYN→SYN+ACK→ACK，建立可靠连接；③TLS握手（HTTPS）：协商加密算法、验证服务器证书；④HTTP请求：发送GET请求，包含请求头、Cookie等；⑤服务器处理：路由、业务逻辑、数据库查询，返回HTML/CSS/JS；⑥浏览器渲染：解析HTML构建DOM树，解析CSS构建CSSOM，合并生成渲染树，进行布局和绘制。' },
    { id: 'S002', name: '李华',   class: '计科2101', text: '首先DNS解析域名得到IP，然后TCP三次握手建立连接，如果是HTTPS还要进行TLS握手。然后发送HTTP请求，服务器处理后返回HTML，浏览器解析HTML建立DOM和CSSOM，然后渲染页面。' },
    { id: 'S003', name: '王芳',   class: '软工2101', text: 'DNS查询→建立连接→发送HTTP请求→接收响应→浏览器渲染。' },
  ],
};

const SHORT_QS = mockQuestions.filter(q => q.type === 'short');
const ESSAY_QS  = mockQuestions.filter(q => q.type === 'essay');
const GRADABLE_QS = [...SHORT_QS, ...ESSAY_QS];

// Mock student monitoring status
type ConnStatus = 'online' | 'offline' | 'submitted' | 'anomaly';
const MOCK_MONITOR: { id: string; name: string; class: string; status: ConnStatus; lastSeen: string; elapsed: number }[] = [
  { id: 'S001', name: '张小明', class: '计科2101', status: 'submitted', lastSeen: '已提交', elapsed: 85 },
  { id: 'S002', name: '李华',   class: '计科2101', status: 'online',    lastSeen: '刚刚',   elapsed: 72 },
  { id: 'S003', name: '王芳',   class: '软工2101', status: 'offline',   lastSeen: '3分钟前', elapsed: 65 },
  { id: 'S004', name: '陈明',   class: '计科2101', status: 'anomaly',   lastSeen: '1分钟前', elapsed: 78 },
  { id: 'S005', name: '刘佳',   class: '软工2101', status: 'online',    lastSeen: '刚刚',   elapsed: 71 },
];
const MONITOR_CFG: Record<ConnStatus, { label: string; dot: string; text: string }> = {
  online:    { label: '在线',   dot: 'bg-green-500',  text: 'text-green-700' },
  offline:   { label: '断线中', dot: 'bg-red-500 animate-pulse', text: 'text-red-600' },
  submitted: { label: '已提交', dot: 'bg-gray-400',   text: 'text-gray-500' },
  anomaly:   { label: '异常',   dot: 'bg-orange-400', text: 'text-orange-600' },
};

// Essay scoring dimensions per question
const ESSAY_DIMS: Record<string, { name: string; max: number }[]> = {
  Q019: [
    { name: '核心论点', max: 4 },
    { name: '论证过程', max: 4 },
    { name: '工程应用', max: 4 },
    { name: '语言表达', max: 3 },
  ],
  Q020: [
    { name: '协议层次', max: 4 },
    { name: '流程完整', max: 4 },
    { name: '细节准确', max: 4 },
    { name: '逻辑清晰', max: 3 },
  ],
};

// ── Types ───────────────────────────────────────────────────────────────────

interface GradeEntry {
  score: number;
  comment: string;
  confirmed: boolean;
  flagged: boolean;
  dimScores?: number[]; // for essay dimension scoring
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords.length) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const hits: { start: number; end: number }[] = [];
  for (const kw of keywords) {
    let pos = lower.indexOf(kw.toLowerCase());
    while (pos !== -1) {
      hits.push({ start: pos, end: pos + kw.length });
      pos = lower.indexOf(kw.toLowerCase(), pos + 1);
    }
  }
  if (!hits.length) return [{ text, hit: false }];
  hits.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const h of hits) {
    if (merged.length && h.start < merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, h.end);
    } else {
      merged.push({ ...h });
    }
  }
  let cursor = 0;
  const result: { text: string; hit: boolean }[] = [];
  for (const { start, end } of merged) {
    if (cursor < start) result.push({ text: text.slice(cursor, start), hit: false });
    result.push({ text: text.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor), hit: false });
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GradingWorkbenchPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [studentIdx, setStudentIdx]     = useState(0);
  const [gradeMap, setGradeMap]         = useState<Record<string, GradeEntry>>({});
  const [viewMode, setViewMode]         = useState<'grading' | 'auto-review'>('grading');
  const [kwExpanded, setKwExpanded]     = useState(true);
  const [batchOpen, setBatchOpen]       = useState(false);
  const [doneOpen, setDoneOpen]         = useState(false);

  const examTitle = EXAM_TITLES[examId] ?? '考试阅卷';

  const question      = GRADABLE_QS[selectedQIdx];
  const answers       = MOCK_ANSWERS[question?.id] ?? [];
  const currentAnswer = answers[studentIdx];
  const key           = `${question?.id}_${studentIdx}`;
  const entry         = gradeMap[key] ?? { score: -1, comment: '', confirmed: false, flagged: false };

  const keywords     = question?.keywords ?? [];
  const hitKeywords  = keywords.filter(kw => currentAnswer?.text.toLowerCase().includes(kw.toLowerCase()));
  const missKeywords = keywords.filter(kw => !currentAnswer?.text.toLowerCase().includes(kw.toLowerCase()));
  const suggestedScore = Math.round((hitKeywords.length / Math.max(keywords.length, 1)) * (question?.score ?? 0));
  const currentScore   = entry.score === -1 ? suggestedScore : entry.score;

  // Progress helpers
  const confirmedCountFor = (qId: string) =>
    (MOCK_ANSWERS[qId] ?? []).filter((_, i) => gradeMap[`${qId}_${i}`]?.confirmed).length;

  const flaggedCountFor = (qId: string) =>
    (MOCK_ANSWERS[qId] ?? []).filter((_, i) => gradeMap[`${qId}_${i}`]?.flagged).length;

  const totalConfirmed = GRADABLE_QS.reduce((s, q) => s + confirmedCountFor(q.id), 0);
  const totalAnswers   = GRADABLE_QS.reduce((s, q) => s + (MOCK_ANSWERS[q.id]?.length ?? 0), 0);
  const allDone        = totalConfirmed === totalAnswers && totalAnswers > 0;

  // Segment bar for current question
  const segTotal     = answers.length;
  const segConfirmed = answers.filter((_, i) => gradeMap[`${question?.id}_${i}`]?.confirmed).length;
  const segFlagged   = answers.filter((_, i) => gradeMap[`${question?.id}_${i}`]?.flagged).length;

  // ── Mutations ──────────────────────────────────────────────────────────────

  function setScore(s: number) {
    setGradeMap(prev => ({
      ...prev,
      [key]: { ...entry, score: Math.max(0, Math.min(question?.score ?? 0, s)), confirmed: false },
    }));
  }

  function setComment(c: string) {
    setGradeMap(prev => ({ ...prev, [key]: { ...entry, comment: c } }));
  }

  function confirm() {
    setGradeMap(prev => ({
      ...prev,
      [key]: { score: currentScore, comment: entry.comment, confirmed: true, flagged: false },
    }));
    toast.success('已确认评分');
    if (studentIdx < answers.length - 1) {
      setStudentIdx(s => s + 1);
    } else if (selectedQIdx < GRADABLE_QS.length - 1) {
      setSelectedQIdx(q => q + 1);
      setStudentIdx(0);
      toast.info('已进入下一题');
    } else {
      setDoneOpen(true);
    }
  }

  function flagCurrent() {
    setGradeMap(prev => ({
      ...prev,
      [key]: { ...entry, flagged: !entry.flagged, confirmed: false },
    }));
    toast(entry.flagged ? '已取消标记' : '已标记为待复审', { icon: '🚩' });
  }

  function batchConfirm() {
    setGradeMap(prev => {
      const next = { ...prev };
      GRADABLE_QS.forEach(q => {
        const qAnswers = MOCK_ANSWERS[q.id] ?? [];
        qAnswers.forEach((_, i) => {
          const k = `${q.id}_${i}`;
          if (!next[k]?.confirmed) {
            const ans = qAnswers[i];
            const kws = q.keywords ?? [];
            const hits = kws.filter(kw => ans.text.toLowerCase().includes(kw.toLowerCase())).length;
            const suggested = Math.round((hits / Math.max(kws.length, 1)) * q.score);
            next[k] = { score: suggested, comment: '', confirmed: true, flagged: false };
          }
        });
      });
      return next;
    });
    setBatchOpen(false);
    toast.success('已批量确认所有未评分目');
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.key === 'Enter')       { e.preventDefault(); confirm(); }
      if (e.key === 'ArrowRight')  { if (studentIdx < answers.length - 1) setStudentIdx(s => s + 1); }
      if (e.key === 'ArrowLeft')   { if (studentIdx > 0) setStudentIdx(s => s - 1); }
      if (e.key === 'ArrowUp')     { e.preventDefault(); setScore(currentScore + 1); }
      if (e.key === 'ArrowDown')   { e.preventDefault(); setScore(currentScore - 1); }
      if (e.key === 'Tab')         { e.preventDefault(); setBatchOpen(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [key, currentScore, entry, studentIdx, selectedQIdx, answers.length]);

  const highlighted = highlightKeywords(currentAnswer?.text ?? '', hitKeywords);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Left sidebar ───────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-r bg-gray-50 flex flex-col">
        {/* Breadcrumb */}
        <div className="px-3 py-3 border-b bg-white flex items-center gap-1.5">
          <button
            onClick={() => router.push('/teacher/grading')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={13} />
            阅卷中心
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-medium text-gray-900 truncate">{examTitle}</span>
        </div>

        {/* Overall progress */}
        <div className="px-3 pt-3 pb-2 border-b bg-white">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">总进度</span>
            <span className="font-semibold">{totalConfirmed}/{totalAnswers}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${totalAnswers ? Math.round(totalConfirmed / totalAnswers * 100) : 0}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => { setViewMode('auto-review'); }}
              className={cn(
                'text-xs px-2 py-1 rounded-md border transition-colors',
                viewMode === 'auto-review'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              )}
            >
              查看自动批改
            </button>
            <button
              onClick={() => setBatchOpen(true)}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              批量确认
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Short questions group */}
          {SHORT_QS.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1">简答题（待终审）</p>
              <div className="space-y-1">
                {SHORT_QS.map((q, idx) => {
                  const absIdx = idx;
                  const done = confirmedCountFor(q.id);
                  const total = (MOCK_ANSWERS[q.id] ?? []).length;
                  const flagged = flaggedCountFor(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setSelectedQIdx(absIdx); setStudentIdx(0); setViewMode('grading'); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        viewMode === 'grading' && selectedQIdx === absIdx
                          ? 'bg-white border border-blue-300 shadow-sm'
                          : 'hover:bg-white/70'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-800">{q.score}分</span>
                        <div className="flex items-center gap-1.5">
                          {flagged > 0 && <Flag size={10} className="text-orange-500" />}
                          {done === total && total > 0
                            ? <CheckCircle2 size={12} className="text-green-500" />
                            : <span className={cn('text-xs', done > 0 ? 'text-yellow-600' : 'text-muted-foreground')}>{done}/{total}</span>
                          }
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.content.slice(0, 20)}…</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Essay questions group */}
          {ESSAY_QS.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1">论述题（待批改）</p>
              <div className="space-y-1">
                {ESSAY_QS.map((q, idx) => {
                  const absIdx = SHORT_QS.length + idx;
                  const done = confirmedCountFor(q.id);
                  const total = (MOCK_ANSWERS[q.id] ?? []).length;
                  const flagged = flaggedCountFor(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setSelectedQIdx(absIdx); setStudentIdx(0); setViewMode('grading'); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        viewMode === 'grading' && selectedQIdx === absIdx
                          ? 'bg-white border border-blue-300 shadow-sm'
                          : 'hover:bg-white/70'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-800">{q.score}分</span>
                        <div className="flex items-center gap-1.5">
                          {flagged > 0 && <Flag size={10} className="text-orange-500" />}
                          {done === total && total > 0
                            ? <CheckCircle2 size={12} className="text-green-500" />
                            : <span className={cn('text-xs', done > 0 ? 'text-yellow-600' : 'text-muted-foreground')}>{done}/{total}</span>
                          }
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.content.slice(0, 20)}…</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts hint */}
        <div className="p-3 border-t text-xs text-muted-foreground space-y-0.5 bg-white">
          <div className="flex items-center gap-1.5 font-medium text-gray-500">
            <Keyboard size={11} /> 快捷键
          </div>
          <div>Enter = 确认并下一份</div>
          <div>← → = 切换学生 · ↑ ↓ = 调整分数</div>
          <div>Tab = 批量确认</div>
        </div>
      </aside>

      {/* ── Main panel ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-white">

        {/* ── Auto-review mode ──────────────────────────────────────────── */}
        {viewMode === 'auto-review' && (
          <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">自动批改详情</h2>
              <Button variant="outline" size="sm" className="text-xs h-8"
                onClick={() => setViewMode('grading')}>
                返回阅卷
              </Button>
            </div>

            {/* Warning for low correct rate */}
            {MOCK_RATES.some(r => r.correctRate < 30) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <span className="font-semibold">注意：</span>
                  以下题目正确率异常偏低（&lt;30%），建议人工复核题目是否存在歧义或答案录入错误。
                </div>
              </div>
            )}

            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">题目</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium w-20">类型</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium w-40">正确率</th>
                    <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium w-20">作答数</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RATES.map(r => (
                    <tr key={r.id} className={cn('border-b last:border-0', r.correctRate < 30 ? 'bg-red-50/50' : '')}>
                      <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">
                        {r.correctRate < 30 && <AlertTriangle size={12} className="text-red-500 inline mr-1" />}
                        {r.content}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{r.type}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${r.correctRate}%`,
                                background: r.correctRate < 30 ? '#dc2626' : r.correctRate < 60 ? '#d97706' : '#16a34a',
                              }}
                            />
                          </div>
                          <span className={cn(
                            'text-xs font-medium w-10 text-right',
                            r.correctRate < 30 ? 'text-red-600' : r.correctRate < 60 ? 'text-yellow-600' : 'text-green-600'
                          )}>
                            {r.correctRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground text-right">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Grading mode ──────────────────────────────────────────────── */}
        {viewMode === 'grading' && (
          !question ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              暂无需要批改的题目
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
              {/* Header: navigation + progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {question.type === 'short' ? '简答题' : '论述题'} · 第 {selectedQIdx + 1}/{GRADABLE_QS.length} 题
                    </span>
                    <Badge variant="outline" className="text-xs">{question.score} 分</Badge>
                    {entry.flagged && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                        <Flag size={10} /> 待复审
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">第 {studentIdx + 1}/{answers.length} 份</span>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                      disabled={studentIdx === 0} onClick={() => setStudentIdx(s => s - 1)}>
                      <ChevronLeft size={14} />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                      disabled={studentIdx === answers.length - 1} onClick={() => setStudentIdx(s => s + 1)}>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>

                {/* Per-question segment progress bar */}
                <div className="flex gap-0.5 h-1.5">
                  {answers.map((_, i) => {
                    const k = `${question.id}_${i}`;
                    const e2 = gradeMap[k];
                    const isActive = i === studentIdx;
                    const color = isActive ? '#3b82f6' : e2?.flagged ? '#f97316' : e2?.confirmed ? '#16a34a' : '#e5e7eb';
                    return <div key={i} className="flex-1 rounded-full transition-colors" style={{ background: color }} />;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  已确认 {segConfirmed}/{segTotal}
                  {segFlagged > 0 && <span className="text-orange-500 ml-2">· {segFlagged} 份待复审</span>}
                </p>
              </div>

              {/* Question box */}
              <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">题目</p>
                  <p className="text-sm leading-relaxed text-gray-900">{question.content}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">参考答案</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{question.answer}</p>
                </div>

                {/* Collapsible keywords */}
                {keywords.length > 0 && (
                  <div>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-gray-700 transition-colors"
                      onClick={() => setKwExpanded(e => !e)}
                    >
                      评分关键词（{hitKeywords.length}/{keywords.length} 命中）
                      {kwExpanded ? <ChevronUpIcon size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {kwExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {keywords.map(kw => {
                          const hit = hitKeywords.includes(kw);
                          return (
                            <span key={kw} className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              hit
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                            )}>
                              {hit ? '✓' : '✗'} {kw}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student answer */}
              {currentAnswer && (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      {currentAnswer.name}（{currentAnswer.class}）的答案
                    </p>
                    <span className="text-xs text-green-600 font-medium">
                      命中 {hitKeywords.length}/{keywords.length} 关键词
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                    {highlighted.map((part, i) =>
                      part.hit
                        ? <mark key={i} className="bg-green-100 text-green-800 rounded px-0.5">{part.text}</mark>
                        : <span key={i}>{part.text}</span>
                    )}
                  </p>

                  <div className="pt-2 border-t space-y-3">
                    {/* Keyword hit list */}
                    {keywords.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {hitKeywords.map(kw => (
                          <div key={kw} className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 size={11} /> 命中「{kw}」
                          </div>
                        ))}
                        {missKeywords.map(kw => (
                          <div key={kw} className="flex items-center gap-1 text-gray-400">
                            <span className="text-gray-300">✗</span> 未命中「{kw}」
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Score stepper — short questions */}
                    {question.type !== 'essay' && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">系统建议：{suggestedScore} 分</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setScore(currentScore - 1)}
                            className="w-7 h-7 rounded border text-sm font-bold hover:bg-gray-100 flex items-center justify-center">
                            −
                          </button>
                          <input
                            type="number" min={0} max={question.score}
                            value={currentScore}
                            onChange={e => setScore(Number(e.target.value))}
                            className="w-14 h-7 border rounded text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <button onClick={() => setScore(currentScore + 1)}
                            className="w-7 h-7 rounded border text-sm font-bold hover:bg-gray-100 flex items-center justify-center">
                            +
                          </button>
                          <span className="text-xs text-muted-foreground">/ {question.score} 分</span>
                        </div>
                      </div>
                    )}

                    {/* Dimension scoring — essay questions */}
                    {question.type === 'essay' && (() => {
                      const dims = ESSAY_DIMS[question.id] ?? [
                        { name: '观点明确', max: 5 }, { name: '逻辑清晰', max: 5 },
                        { name: '论据充分', max: 5 }, { name: '语言表达', max: Math.max(0, question.score - 15) },
                      ];
                      const dimScores = entry.dimScores ?? dims.map(() => -1);
                      const dimTotal = dimScores.reduce((s, v) => s + (v === -1 ? 0 : v), 0);
                      return (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">评分维度</span>
                            <span className={cn('text-xs font-semibold', dimTotal > 0 ? 'text-blue-600' : 'text-muted-foreground')}>
                              总分：{dimTotal}/{question.score} 分（自动汇总）
                            </span>
                          </div>
                          {dims.map((dim, di) => (
                            <div key={dim.name} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-gray-700">{dim.name}</span>
                                <span className={dimScores[di] === -1 ? 'text-muted-foreground' : 'text-blue-600 font-medium'}>
                                  {dimScores[di] === -1 ? '未评' : `${dimScores[di]}/${dim.max}`}
                                </span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {Array.from({ length: dim.max + 1 }, (_, v) => (
                                  <button key={v}
                                    onClick={() => {
                                      const newDs = [...dimScores];
                                      newDs[di] = v;
                                      const total = newDs.reduce((s, x) => s + (x === -1 ? 0 : x), 0);
                                      setGradeMap(prev => ({
                                        ...prev,
                                        [key]: { ...entry, score: total, confirmed: false, dimScores: newDs },
                                      }));
                                    }}
                                    className={cn(
                                      'w-8 h-7 rounded border text-xs font-semibold transition-colors',
                                      dimScores[di] === v
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    )}>
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Comment */}
                    <Textarea
                      placeholder="评语（选填）"
                      rows={2}
                      value={entry.comment}
                      onChange={e => setComment(e.target.value)}
                      className="text-xs resize-none"
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('text-xs h-8 gap-1.5', entry.flagged ? 'border-orange-400 text-orange-600' : 'text-orange-500 border-orange-200 hover:border-orange-400')}
                        onClick={flagCurrent}
                      >
                        <Flag size={12} />
                        {entry.flagged ? '取消复审标记' : '标记待复审'}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 text-white text-xs h-8"
                        style={{ background: '#002045' }}
                        onClick={confirm}
                      >
                        <CheckCircle2 size={13} />
                        确认评分并下一份 (Enter)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* ── Right monitoring panel ─────────────────────────────────────── */}
      <aside className="w-48 flex-shrink-0 border-l bg-gray-50 flex flex-col overflow-y-auto">
        <div className="px-3 py-2.5 border-b bg-white">
          <p className="text-xs font-semibold text-gray-900">实时监控</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-red-600 font-medium">
              {MOCK_MONITOR.filter(s => s.status === 'offline').length} 人断线
            </span>
            &nbsp;· {MOCK_MONITOR.filter(s => s.status === 'anomaly').length} 人异常
          </p>
        </div>
        <div className="flex-1 p-2 space-y-1.5">
          {MOCK_MONITOR.map(s => {
            const cfg = MONITOR_CFG[s.status];
            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-xs',
                  s.status === 'offline' ? 'border-red-200 bg-red-50/40' :
                  s.status === 'anomaly' ? 'border-orange-200 bg-orange-50/40' :
                  'border-gray-100 bg-white'
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                  <span className="font-medium text-gray-900 truncate">{s.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium', cfg.text)}>{cfg.label}</span>
                  <span className="text-muted-foreground text-xs">{s.elapsed}分钟</span>
                </div>
                {s.status === 'offline' && (
                  <p className="text-red-500 text-xs mt-0.5">最后心跳：{s.lastSeen}</p>
                )}
                {s.status === 'anomaly' && (
                  <p className="text-orange-500 text-xs mt-0.5">多次切屏</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2.5 border-t bg-white text-center">
          <p className="text-xs text-muted-foreground">
            共 {MOCK_MONITOR.length} 人参考
          </p>
        </div>
      </aside>

      {/* ── Batch confirm dialog ──────────────────────────────────────── */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>批量确认评分</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            将使用系统建议分批量确认所有尚未手动评分的答卷。已人工评分的记录不受影响。
          </p>
          <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800">
            当前共 <span className="font-semibold">{totalAnswers - totalConfirmed}</span> 份答卷未确认
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchOpen(false)}>取消</Button>
            <Button size="sm" onClick={batchConfirm} style={{ background: '#002045' }} className="text-white">
              确认批量评分
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Completion dialog ─────────────────────────────────────────── */}
      <Dialog open={doneOpen} onOpenChange={setDoneOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 阅卷完成</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            本次考试所有主观题已批改完成，成绩即将发布。
          </p>
          <div className="grid grid-cols-3 gap-3 text-center py-2">
            <div>
              <p className="text-xl font-bold text-gray-900">{totalAnswers}</p>
              <p className="text-xs text-muted-foreground">总答卷</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{totalConfirmed}</p>
              <p className="text-xs text-muted-foreground">已确认</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-500">
                {GRADABLE_QS.reduce((s, q) => s + flaggedCountFor(q.id), 0)}
              </p>
              <p className="text-xs text-muted-foreground">待复审</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDoneOpen(false)}>
              继续检查
            </Button>
            <Button size="sm" className="flex-1 text-white" style={{ background: '#002045' }}
              onClick={() => router.push('/teacher/scores')}>
              查看成绩
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
