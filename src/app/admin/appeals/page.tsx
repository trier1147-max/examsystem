'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PBadge } from '@/components/ui/pbadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types & mock ──────────────────────────────────────────────────────────────

type AppealStatus = 'pending' | 'reviewing' | 'resolved';

interface Appeal {
  id: string;
  studentName: string; studentId: string; class: string;
  examTitle: string; questionNo: number; questionType: string;
  description: string;
  currentScore: number; totalScore: number; rank: string;
  submittedAt: string; deadlineDays: number;
  status: AppealStatus;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  scoreDelta?: number;
}

const INITIAL_APPEALS: Appeal[] = [
  {
    id: 'A001', studentName: '王五', studentId: '20220101', class: '计科2201',
    examTitle: '数据结构期末考试', questionNo: 3, questionType: '选择题',
    description: '选择题第3题B选项也应视为正确答案，老师出题时的标准答案存在争议。',
    currentScore: 72, totalScore: 100, rank: '28/45',
    submittedAt: '2026-03-27 14:30', deadlineDays: 3,
    status: 'pending',
  },
  {
    id: 'A002', studentName: '李四', studentId: '20220203', class: '软工2202',
    examTitle: '数据结构期末考试', questionNo: 11, questionType: '简答题',
    description: '关键词匹配遗漏，我的答案表述方式不同但含义正确，系统未能识别。',
    currentScore: 55, totalScore: 100, rank: '40/45',
    submittedAt: '2026-03-27 10:15', deadlineDays: 3,
    status: 'pending',
  },
  {
    id: 'A003', studentName: '赵六', studentId: '20220105', class: '计科2201',
    examTitle: '高等数学期末考试', questionNo: 7, questionType: '填空题',
    description: '填空题第7题答案格式有误，我填写的内容实际正确但系统未识别格式。',
    currentScore: 68, totalScore: 150, rank: '22/50',
    submittedAt: '2026-03-25 14:00', deadlineDays: 0,
    status: 'resolved',
    resolution: '经任课老师确认，答案格式等价，分数从0分修正为4分。',
    resolvedAt: '2026-03-26 16:00',
    resolvedBy: '李老师（教学秘书）',
    scoreDelta: 4,
  },
];

// Three-column review data (indexed by appeal id)
const REVIEW_QUESTIONS: Record<string, {
  no: number; type: string; content: string;
  studentAnswer: string; correctAnswer: string;
  judgeMethod: string; currentScore: number; maxScore: number; note?: string;
}[]> = {
  A001: [{
    no: 3, type: '选择题',
    content: '以下哪种数据结构适合实现"先进先出"（FIFO）的操作？',
    studentAnswer: 'B. 队列（Queue）', correctAnswer: 'C. 堆（Heap）',
    judgeMethod: '精确匹配', currentScore: 0, maxScore: 4,
  }, {
    no: 5, type: '选择题',
    content: '快速排序在最坏情况下的时间复杂度是？',
    studentAnswer: 'C. O(n²)', correctAnswer: 'C. O(n²)',
    judgeMethod: '精确匹配', currentScore: 4, maxScore: 4, note: '正确',
  }],
  A002: [{
    no: 11, type: '简答题',
    content: '请简述 TCP 和 UDP 协议的主要区别，并各举一个适用场景。',
    studentAnswer: 'TCP是可靠、面向连接的协议，适合文件传输；UDP是不可靠但快速的协议，适合视频流。',
    correctAnswer: '关键词：面向连接、可靠、无连接、实时性、TCP、UDP',
    judgeMethod: '关键词评分 4/6', currentScore: 5, maxScore: 8, note: '命中：面向连接、可靠、无连接、实时性；缺失：具体协议名对比',
  }],
};

const STATUS_CFG: Record<AppealStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: '待处理', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  reviewing: { label: '复核中', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  resolved:  { label: '已处理', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>(INITIAL_APPEALS);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Appeal | null>(null);

  // Correction form
  const [corrForm, setCorrForm] = useState({ qNo: '', score: '', reason: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Correction log
  const [corrLog, setCorrLog] = useState<{
    time: string; student: string; qNo: number; from: number; to: number; reason: string; totalBefore: number; totalAfter: number;
  }[]>([]);

  const pendingCount = appeals.filter(a => a.status === 'pending').length;

  const filtered = appeals.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchExam = examFilter === 'all' || a.examTitle.includes(examFilter);
    return matchStatus && matchExam;
  });

  function openReview(appeal: Appeal) {
    setSelected(appeal);
    if (appeal.status === 'pending') {
      setAppeals(prev => prev.map(a => a.id === appeal.id ? { ...a, status: 'reviewing' } : a));
    }
  }

  function applyCorrection() {
    if (!corrForm.qNo || !corrForm.score || !corrForm.reason) {
      toast.error('请填写完整修正信息'); return;
    }
    setConfirmOpen(true);
  }

  function confirmCorrection() {
    if (!selected) return;
    const qs = REVIEW_QUESTIONS[selected.id] ?? [];
    const q = qs.find(q => q.no === Number(corrForm.qNo));
    const fromScore = q?.currentScore ?? 0;
    const toScore = Number(corrForm.score);
    const delta = toScore - fromScore;

    setCorrLog(prev => [{
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      student: `${selected.studentName}(${selected.studentId})`,
      qNo: Number(corrForm.qNo), from: fromScore, to: toScore,
      reason: corrForm.reason,
      totalBefore: selected.currentScore, totalAfter: selected.currentScore + delta,
    }, ...prev]);

    setAppeals(prev => prev.map(a =>
      a.id === selected.id
        ? {
          ...a,
          status: 'resolved',
          currentScore: a.currentScore + delta,
          scoreDelta: (a.scoreDelta ?? 0) + delta,
          resolution: corrForm.reason,
          resolvedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          resolvedBy: '李老师（教学秘书）',
        }
        : a
    ));

    toast.success(`成绩已修正，总分 ${selected.currentScore} → ${selected.currentScore + delta}`);
    setConfirmOpen(false);
    setCorrForm({ qNo: '', score: '', reason: '' });
    setSelected(null);
  }

  // ── Detail view ──
  if (selected) {
    const qs = REVIEW_QUESTIONS[selected.id] ?? [];
    const cfg = STATUS_CFG[selected.status];
    return (
      <div className="p-6 space-y-5 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-gray-800"
            onClick={() => setSelected(null)}>
            <ChevronLeft size={15} /> 成绩申诉
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-gray-900">{selected.studentName} · {selected.examTitle}</span>
        </div>

        {/* Student summary */}
        <Card className="shadow-none border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900">{selected.studentName}</span>
                  <span className="text-xs text-muted-foreground">{selected.studentId} · {selected.class}</span>
                  <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>{cfg.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{selected.examTitle} · 第{selected.questionNo}题（{selected.questionType}）</p>
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-800">
                  <strong>申诉内容：</strong>{selected.description}
                </div>
              </div>
              <div className="text-right ml-6 flex-shrink-0">
                <p className="text-2xl font-bold text-gray-900">
                  {selected.currentScore}<span className="text-sm font-normal text-muted-foreground">/{selected.totalScore}</span>
                </p>
                <p className="text-xs text-muted-foreground">排名 {selected.rank}</p>
                {selected.deadlineDays > 0 && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center justify-end gap-1">
                    <Clock size={10} /> 距截止 {selected.deadlineDays} 天
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Three-column review */}
        {qs.length > 0 && (
          <Card className="shadow-none border">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">答卷复核 <PBadge p="P1" /></h3>
              <div className="space-y-3">
                {qs.map(q => (
                  <div key={q.no} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 flex justify-between">
                      <span>第{q.no}题 · {q.type} · {q.maxScore}分</span>
                      <span className={cn('font-semibold',
                        q.currentScore === q.maxScore ? 'text-green-600' : q.currentScore === 0 ? 'text-red-600' : 'text-yellow-600')}>
                        得 {q.currentScore}/{q.maxScore} 分
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-700 mb-2 leading-relaxed">{q.content}</p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">学生答案</p>
                          <p className="bg-yellow-50 rounded p-2 text-gray-800 leading-relaxed">{q.studentAnswer}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">标准答案</p>
                          <p className="bg-green-50 rounded p-2 text-gray-800 leading-relaxed">{q.correctAnswer}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">判分记录</p>
                          <div className="bg-gray-50 rounded p-2 space-y-1">
                            <p>判分方式：{q.judgeMethod}</p>
                            {q.note && <p className={cn(q.currentScore === q.maxScore ? 'text-green-600' : 'text-orange-600')}>{q.note}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Correction form */}
        {selected.status !== 'resolved' && (
          <Card className="shadow-none border border-orange-100">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">分数修正</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">修正题号</p>
                  <Input placeholder="如：3" className="h-8 text-xs"
                    value={corrForm.qNo} onChange={e => setCorrForm(f => ({ ...f, qNo: e.target.value }))} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">修正后得分</p>
                  <Input placeholder="如：4" className="h-8 text-xs"
                    value={corrForm.score} onChange={e => setCorrForm(f => ({ ...f, score: e.target.value }))} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">修正原因（必填）</p>
                  <Input placeholder="请填写原因..." className="h-8 text-xs"
                    value={corrForm.reason} onChange={e => setCorrForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle size={11} /> 分数修正将记入操作日志，不可撤销
                </p>
                <Button size="sm" className="text-white text-xs" style={{ background: '#002045' }}
                  onClick={applyCorrection}>确认修正</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution info for resolved */}
        {selected.status === 'resolved' && selected.resolution && (
          <Card className="shadow-none border border-green-200 bg-green-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">已处理</span>
              </div>
              <p className="text-xs text-gray-700">{selected.resolution}</p>
              {selected.scoreDelta && selected.scoreDelta > 0 && (
                <p className="text-xs text-green-700 mt-1 font-medium">
                  分数修正 +{selected.scoreDelta} 分
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                处理时间：{selected.resolvedAt} · 处理人：{selected.resolvedBy}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Correction log */}
        {corrLog.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">修正记录 <PBadge p="P1" /></p>
            {corrLog.map((c, i) => (
              <div key={i} className="text-xs border rounded-lg px-4 py-3 bg-gray-50/40 mb-2">
                <div className="text-muted-foreground mb-0.5">{c.time} · 李老师（教学秘书）</div>
                <p className="text-gray-800">
                  修正第 {c.qNo} 题：{c.from}分 → <strong className="text-green-700">{c.to}分</strong>
                </p>
                <p className="text-gray-600">原因：{c.reason}</p>
                <p className="text-muted-foreground">总分：{c.totalBefore} → {c.totalAfter}</p>
              </div>
            ))}
          </div>
        )}

        {/* Confirm dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-base">确认分数修正</DialogTitle></DialogHeader>
            <div className="py-2 space-y-2 text-sm">
              <p className="text-muted-foreground">此操作不可撤销，修正记录将永久保留。</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                <p>学生：{selected?.studentName}（{selected?.studentId}）</p>
                <p>题号：第 {corrForm.qNo} 题</p>
                <p>修正为：{corrForm.score} 分</p>
                <p>原因：{corrForm.reason}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button size="sm" className="text-white" style={{ background: '#002045' }} onClick={confirmCorrection}>
                确认修正
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">成绩申诉 <PBadge p="P1" /></h1>
          <p className="text-sm text-muted-foreground mt-0.5">复核答卷 · 修正分数 · 全程追溯</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="text-sm bg-red-100 text-red-700 border-red-200 px-3 py-1">
            <AlertCircle size={13} className="inline mr-1" />
            {pendingCount} 件待处理
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[
            { v: 'pending',  l: '待处理' },
            { v: 'resolved', l: '已处理' },
            { v: 'all',      l: '全部' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={cn('px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors',
                statusFilter === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}>
              {l}
              {v === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <Select value={examFilter} onValueChange={(v) => v && setExamFilter(v)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="考试筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部考试</SelectItem>
            <SelectItem value="数据结构">数据结构期末考试</SelectItem>
            <SelectItem value="高等数学">高等数学期末考试</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appeal list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {statusFilter === 'pending' ? '暂无待处理的申诉' : '无符合条件的申诉记录'}
          </div>
        )}
        {filtered.map(a => {
          const cfg = STATUS_CFG[a.status];
          return (
            <Card key={a.id}
              className={cn('shadow-none border transition-colors',
                a.status === 'pending' ? 'border-red-200 hover:border-red-300' : 'hover:border-gray-300'
              )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>
                        {a.status === 'pending' ? '🔴' : '✅'} {cfg.label}
                      </Badge>
                      <span className="font-medium text-gray-900">{a.studentName}</span>
                      <span className="text-xs text-muted-foreground">{a.studentId} · {a.class}</span>
                    </div>

                    <p className="text-xs text-gray-700 font-medium">
                      {a.examTitle} · 第{a.questionNo}题（{a.questionType}）
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {a.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span>提交：{a.submittedAt}</span>
                      {a.status !== 'resolved' && a.deadlineDays > 0 && (
                        <span className="flex items-center gap-1 text-orange-600 font-medium">
                          <Clock size={10} /> 距截止还有 {a.deadlineDays} 天
                        </span>
                      )}
                      {a.status === 'resolved' && a.resolvedAt && (
                        <span className="text-green-600">处理于 {a.resolvedAt}</span>
                      )}
                      {a.status === 'resolved' && a.scoreDelta && a.scoreDelta > 0 && (
                        <span className="text-green-700 font-medium">+{a.scoreDelta} 分</span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className={cn('text-xs flex-shrink-0 gap-1',
                      a.status !== 'resolved' ? 'text-white' : ''
                    )}
                    variant={a.status === 'resolved' ? 'outline' : 'default'}
                    style={a.status !== 'resolved' ? { background: '#002045' } : undefined}
                    onClick={() => openReview(a)}
                  >
                    {a.status === 'resolved' ? '查看处理记录' : '查看答卷并复核'}
                    <ChevronRight size={11} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
