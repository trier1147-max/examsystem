'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Clock, Users, BookOpen, Calendar, Eye, BarChart2, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Monitor, ChevronDown, Download, RefreshCw,
  Copy, Send, Bell,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { mockExams, mockMonitorStudents, type Exam, type ExamStatus } from '@/mock/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PBadge } from '@/components/ui/pbadge';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:  { label: '未开始', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', dot: 'bg-blue-500' },
  ongoing:  { label: '进行中', color: '#16a34a', bg: '#dcfce7', border: '#86efac', dot: 'bg-green-500 animate-pulse' },
  grading:  { label: '阅卷中', color: '#d97706', bg: '#fef9c3', border: '#fcd34d', dot: 'bg-yellow-400' },
  finished: { label: '已结束', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db', dot: 'bg-gray-400' },
};

// ── Grading progress mock ─────────────────────────────────────────────────────

const GRADING_PROGRESS: Record<string, { done: number; total: number; deadline: string; isDone: boolean }> = {
  E003: { done: 198, total: 320, deadline: '2026-04-01', isDone: false },
  E004: { done: 135, total: 280, deadline: '2026-04-05', isDone: false },
  E005: { done: 900, total: 900, deadline: '2026-02-20', isDone: true },
};

// ── Teacher notifications ─────────────────────────────────────────────────────

const TEACHER_NOTIFS = [
  {
    id: 1,
    title: '阅卷催促',
    body: '教务办提醒：高等数学期末考试阅卷截止还有4天，当前进度62%',
    time: '10分钟前',
    href: '/teacher/grading',
    action: '去阅卷',
  },
  {
    id: 2,
    title: '成绩修正通知',
    body: '教务办已修正王五数据结构期末考试第3题成绩：0分→4分',
    time: '2小时前',
    href: '/teacher/scores',
    action: '查看',
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_SUBJECTS  = ['全部', '数据结构', '计算机网络', '高等数学', '操作系统', '数据库'];
const ALL_SEMESTERS = ['本学期', '上学期', '全部'];
const ALL_CLASSES   = ['计科2201', '计科2202', '计科2203', '软工2201', '软工2202'];
const DURATIONS     = [60, 90, 120, 150, 180];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 864e5);
}

function relativeTime(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 10) return '刚刚';
  if (sec < 60) return `${sec}秒前`;
  return `${Math.floor(sec / 60)}分钟前`;
}

function formatEndTime(date: string, time: string, durationMin: number) {
  if (!date || !time) return '—';
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + durationMin;
  return `${date} ${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type NewExam = {
  title: string; subject: string; duration: string;
  startDate: string; startTime: string; allowEarly: boolean;
  college: string; classes: string[];
  antiCheat: { noSwitch: boolean; noCopy: boolean; fullscreen: boolean; randomOrder: boolean; randomOptions: boolean; maxViolations: number };
  paperName: string;
};

const defaultNewExam = (): NewExam => ({
  title: '', subject: '', duration: '120',
  startDate: '', startTime: '09:00', allowEarly: true,
  college: '信息学院', classes: [],
  antiCheat: { noSwitch: true, noCopy: true, fullscreen: true, randomOrder: true, randomOptions: true, maxViolations: 3 },
  paperName: '',
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const router = useRouter();

  // filter state
  const [statusFilter,   setStatusFilter]   = useState<string>('all');
  const [subjectFilter,  setSubjectFilter]   = useState<string>('全部');
  const [semesterFilter, setSemesterFilter]  = useState('本学期');

  // dialog state
  const [createOpen,       setCreateOpen]       = useState(false);
  const [monitorExam,      setMonitorExam]       = useState<Exam | null>(null);
  const [detailExam,       setDetailExam]        = useState<Exam | null>(null);
  const [deleteTarget,     setDeleteTarget]      = useState<Exam | null>(null);
  const [forceCollectExam, setForceCollectExam]  = useState<Exam | null>(null);

  // dropdown state
  const [openMoreId,   setOpenMoreId]   = useState<string | null>(null);
  const [exportDropId, setExportDropId] = useState<string | null>(null);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<number>>(new Set());

  // data state
  const [exams,   setExams]   = useState<Exam[]>(mockExams);
  const [newExam, setNewExam] = useState<NewExam>(defaultNewExam());

  // auto-refresh
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [, setRefreshTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setLastRefreshed(new Date());
      setRefreshTick(n => n + 1);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // monitor data
  const monitorStudents = mockMonitorStudents;
  const submitted    = monitorStudents.filter(s => s.status === 'submitted').length;
  const answering    = monitorStudents.filter(s => s.status === 'answering').length;
  const abnormal     = monitorStudents.filter(s => s.violations > 0 && s.status !== 'submitted').length;
  const anomalies    = monitorStudents.filter(s => s.violations > 0);
  const disconnected = monitorStudents.filter(s => s.status === 'not_started');

  const unreadCount = TEACHER_NOTIFS.filter(n => !readNotifIds.has(n.id)).length;

  const filtered = exams.filter(e =>
    (statusFilter === 'all'  || e.status === statusFilter) &&
    (subjectFilter === '全部' || e.subject === subjectFilter)
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSave(publish: boolean) {
    if (!newExam.title.trim())       { toast.error('请填写考试名称');   return; }
    if (!newExam.paperName)          { toast.error('请选择关联试卷');   return; }
    if (!newExam.startDate)          { toast.error('请选择开始日期');   return; }
    if (!newExam.classes.length)     { toast.error('请选择参加班级');   return; }
    const created: Exam = {
      id: `E${Date.now()}`,
      title: newExam.title,
      subject: newExam.subject || '未分类',
      status: 'pending',
      startTime: `${newExam.startDate} ${newExam.startTime}`,
      endTime: formatEndTime(newExam.startDate, newExam.startTime, Number(newExam.duration)),
      duration: Number(newExam.duration),
      totalScore: 100,
      questionIds: [],
      class: newExam.classes.join('、'),
      college: newExam.college,
      createdBy: 'T001',
    };
    setExams(prev => [created, ...prev]);
    setCreateOpen(false);
    setNewExam(defaultNewExam());
    toast.success(publish ? '考试已创建并发布' : '考试已保存为草稿');
  }

  function handleCopyExam(exam: Exam) {
    setNewExam({
      title: exam.title + '（副本）',
      subject: exam.subject,
      duration: String(exam.duration),
      startDate: '',
      startTime: '09:00',
      allowEarly: true,
      college: exam.college || '信息学院',
      classes: exam.class ? exam.class.split('、').filter(Boolean) : [],
      antiCheat: { noSwitch: true, noCopy: true, fullscreen: true, randomOrder: true, randomOptions: true, maxViolations: 3 },
      paperName: '',
    });
    setOpenMoreId(null);
    setCreateOpen(true);
    toast.info(`已复制「${exam.title}」配置，请设置新的考试时间`);
  }

  function handlePublishScores(exam: Exam) {
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'finished' } : e));
    toast.success('成绩已发布，学生现在可以查看');
  }

  function handleForceCollect() {
    if (!forceCollectExam) return;
    toast.success('强制收卷成功，所有未交卷学生答卷已自动提交');
    setForceCollectExam(null);
  }

  function toggleClass(c: string) {
    setNewExam(prev => ({
      ...prev,
      classes: prev.classes.includes(c) ? prev.classes.filter(x => x !== c) : [...prev.classes, c],
    }));
  }

  const antiCheatItems = [
    { key: 'noSwitch' as const,      label: '禁止切换页面（离开自动警告）' },
    { key: 'noCopy' as const,        label: '禁止复制粘贴' },
    { key: 'fullscreen' as const,    label: '全屏锁定模式' },
    { key: 'randomOrder' as const,   label: '答题顺序随机' },
    { key: 'randomOptions' as const, label: '选项顺序随机（仅选择题）' },
  ];

  // ── Export dropdown (shared) ─────────────────────────────────────────────────

  function ExportDropdown({ examId }: { examId: string }) {
    return (
      <div className="relative">
        <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
          onClick={() => setExportDropId(exportDropId === examId ? null : examId)}>
          <Download size={13} /> 导出成绩 <ChevronDown size={11} />
        </Button>
        {exportDropId === examId && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setExportDropId(null)} />
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border rounded-lg shadow-lg z-20 py-1">
              <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-gray-700 hover:bg-muted transition-colors"
                onClick={() => { toast.success('成绩明细已导出（Excel）'); setExportDropId(null); }}>
                📊 导出成绩明细（Excel）
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-gray-700 hover:bg-muted transition-colors"
                onClick={() => { toast.success('成绩分析报告已导出（PDF）'); setExportDropId(null); }}>
                📄 导出成绩分析报告（PDF）
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">考试管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">共 {exams.length} 场考试</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-1.5 h-9 relative"
              onClick={() => setNotifOpen(v => !v)}>
              <Bell size={15} />
              消息通知
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </Button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b">
                  <span className="text-sm font-semibold">消息通知</span>
                  <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => setNotifOpen(false)}>关闭</button>
                </div>
                {TEACHER_NOTIFS.map(n => {
                  const isRead = readNotifIds.has(n.id);
                  return (
                    <div key={n.id} className={cn(
                      'px-4 py-3 border-b last:border-0 hover:bg-muted/30',
                      !isRead && 'bg-red-50/30'
                    )}>
                      <div className="flex items-start gap-2">
                        {!isRead && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs font-semibold text-red-600">{n.title}</span>
                            <span className="text-xs text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{n.body}</p>
                          <button className="mt-1.5 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => { router.push(n.href); setReadNotifIds(p => new Set([...p, n.id])); setNotifOpen(false); }}>
                            {n.action} →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="px-4 py-2.5 text-center border-t">
                  <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => setNotifOpen(false)}>
                    查看全部通知 →
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button className="gap-2 text-white" style={{ background: '#002045' }} onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> 创建考试 <PBadge p="P0" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {[
            { v: 'all',      label: '全部'   },
            { v: 'ongoing',  label: '进行中' },
            { v: 'grading',  label: '阅卷中' },
            { v: 'pending',  label: '未开始' },
            { v: 'finished', label: '已结束' },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                statusFilter === v
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">学科</span>
          <Select value={subjectFilter} onValueChange={v => v && setSubjectFilter(v)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue>{subjectFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">学期</span>
          <Select value={semesterFilter} onValueChange={v => v && setSemesterFilter(v)}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue>{semesterFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exam cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">暂无考试</div>
        )}
        {filtered.map(exam => {
          const cfg   = STATUS_CONFIG[exam.status];
          const qCnt  = exam.questionIds.length;
          const gp    = GRADING_PROGRESS[exam.id];
          const gradingDone = gp?.isDone ?? false;

          return (
            <Card key={exam.id} className="shadow-none border hover:shadow-sm transition-shadow overflow-visible">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <span className={cn('inline-block w-2.5 h-2.5 rounded-full', cfg.dot)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h2 className="font-semibold text-gray-900 text-base">{exam.title}</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={12} />{exam.startTime} — {exam.endTime}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{exam.duration} 分钟</span>
                      <span className="flex items-center gap-1"><BookOpen size={12} />{exam.totalScore} 分 · {qCnt} 题</span>
                      <span className="flex items-center gap-1"><Users size={12} />{exam.class}</span>
                    </div>

                    {/* Status-specific status line */}
                    {exam.status === 'ongoing' && (
                      <div className="mt-2 flex items-center gap-3 text-xs flex-wrap">
                        <span className="text-green-700 font-medium">
                          已交卷：{submitted}/{monitorStudents.length} &nbsp;·&nbsp; 答题中：{answering}
                        </span>
                        {abnormal > 0 && (
                          <button
                            className="flex items-center gap-1 text-red-600 font-medium hover:underline"
                            onClick={() => setMonitorExam(exam)}>
                            <AlertTriangle size={12} /> 异常 {abnormal} 人 →
                          </button>
                        )}
                        <span className="text-muted-foreground flex items-center gap-1 ml-auto">
                          <RefreshCw size={10} /> 最后更新：{relativeTime(lastRefreshed)}
                          <button className="ml-1 text-blue-500 hover:text-blue-700 text-xs"
                            onClick={() => { setLastRefreshed(new Date()); }}>
                            刷新
                          </button>
                        </span>
                      </div>
                    )}
                    {exam.status === 'grading' && gp && (
                      <div className="mt-2">
                        {gradingDone ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 size={12} /> 阅卷已完成 · 成绩待发布
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-yellow-700">
                              <span className="font-medium">阅卷进度：{Math.round(gp.done / gp.total * 100)}%</span>
                              <span>· 待批改 {gp.total - gp.done} 份</span>
                              {daysUntil(gp.deadline) <= 5 && (
                                <span className="flex items-center gap-1 text-red-600 font-medium">
                                  <AlertTriangle size={11} /> 距截止还有 {daysUntil(gp.deadline)} 天
                                </span>
                              )}
                            </div>
                            <div className="w-52 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${Math.round(gp.done / gp.total * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {exam.status === 'finished' && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" /> 全部批改完成 · 成绩已发布
                      </div>
                    )}
                  </div>

                  {/* ── Action buttons per status ── */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">

                    {/* PENDING */}
                    {exam.status === 'pending' && (<>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => setDetailExam(exam)}>
                        <Pencil size={13} /> 编辑
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => setDetailExam(exam)}>
                        <Eye size={13} /> 查看详情
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => toast.info('考试通知已发送给所有参考学生')}>
                        <Send size={13} /> 发送通知
                      </Button>
                      <div className="relative">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2.5"
                          onClick={() => setOpenMoreId(openMoreId === exam.id ? null : exam.id)}>
                          更多 <ChevronDown size={11} />
                        </Button>
                        {openMoreId === exam.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMoreId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border rounded-lg shadow-lg z-20 py-1">
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-muted transition-colors"
                                onClick={() => handleCopyExam(exam)}>
                                <Copy size={12} /> 复制考试 <PBadge p="P2" />
                              </button>
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => { setDeleteTarget(exam); setOpenMoreId(null); }}>
                                <Trash2 size={12} /> 删除考试
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>)}

                    {/* ONGOING */}
                    {exam.status === 'ongoing' && (<>
                      <Button size="sm" className="gap-1.5 text-xs h-8 text-white"
                        style={{ background: '#16a34a' }}
                        onClick={() => setMonitorExam(exam)}>
                        <Monitor size={13} /> 监考视图 <PBadge p="P1" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => setDetailExam(exam)}>
                        <Eye size={13} /> 查看详情
                      </Button>
                      <div className="relative">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2.5"
                          onClick={() => setOpenMoreId(openMoreId === exam.id ? null : exam.id)}>
                          更多 <ChevronDown size={11} />
                        </Button>
                        {openMoreId === exam.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMoreId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-20 py-1">
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => { setForceCollectExam(exam); setOpenMoreId(null); }}>
                                <AlertTriangle size={12} /> 强制收卷
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>)}

                    {/* GRADING */}
                    {exam.status === 'grading' && (<>
                      {gradingDone ? (
                        <Button size="sm" className="gap-1.5 text-xs h-8 text-white"
                          style={{ background: '#16a34a' }}
                          onClick={() => handlePublishScores(exam)}>
                          <CheckCircle2 size={13} /> 发布成绩
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1.5 text-xs h-8 text-white"
                          style={{ background: '#d97706' }}
                          onClick={() => router.push('/teacher/grading')}>
                          <Pencil size={13} /> 去阅卷
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => setDetailExam(exam)}>
                        <Eye size={13} /> 查看详情
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => router.push('/teacher/scores')}>
                        <BarChart2 size={13} /> 成绩统计
                      </Button>
                      {gradingDone && <ExportDropdown examId={exam.id} />}
                    </>)}

                    {/* FINISHED */}
                    {exam.status === 'finished' && (<>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => setDetailExam(exam)}>
                        <Eye size={13} /> 查看详情
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                        onClick={() => router.push('/teacher/scores')}>
                        <BarChart2 size={13} /> 成绩统计
                      </Button>
                      <ExportDropdown examId={exam.id} />
                      <div className="relative">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2.5"
                          onClick={() => setOpenMoreId(openMoreId === exam.id ? null : exam.id)}>
                          更多 <ChevronDown size={11} />
                        </Button>
                        {openMoreId === exam.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMoreId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border rounded-lg shadow-lg z-20 py-1">
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-muted transition-colors"
                                onClick={() => handleCopyExam(exam)}>
                                <Copy size={12} /> 复制考试 <PBadge p="P2" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Monitor Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!monitorExam} onOpenChange={() => setMonitorExam(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor size={18} /> {monitorExam?.title} — 监考视图
            </DialogTitle>
            <DialogDescription>剩余时间：01:23:45（模拟）</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-3 my-1">
            {[
              { label: '总人数',  value: monitorStudents.length,  color: 'text-gray-900' },
              { label: '已登录',  value: monitorStudents.length - 1, color: 'text-blue-600' },
              { label: '答题中',  value: answering,                color: 'text-green-600' },
              { label: '已交卷',  value: submitted,               color: 'text-gray-500'  },
              { label: '异常',    value: anomalies.length,         color: 'text-red-600'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-gray-50 border">
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {anomalies.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-700 mb-1">异常提醒</p>
              {anomalies.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle size={12} />
                  <span className="font-medium">{s.name}（{s.class}）</span>
                  切出考试页面第 {s.violations} 次
                  {s.violations >= 3 && <span className="font-bold text-red-800">→ 已自动交卷</span>}
                </div>
              ))}
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['姓名', '班级', '状态', '答题进度', '异常次数'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monitorStudents.map(s => (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-sm">{s.name}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{s.class}</td>
                    <td className="py-2 px-3">
                      {s.status === 'answering'   && <span className="text-green-600  text-xs font-medium">答题中</span>}
                      {s.status === 'submitted'   && <span className="text-gray-400   text-xs">已交卷</span>}
                      {s.status === 'not_started' && <span className="text-blue-500   text-xs">未开始</span>}
                      {s.status === 'abnormal'    && <span className="text-red-600    text-xs font-medium">异常</span>}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {s.status === 'submitted'
                        ? <span className="text-gray-400">已提交</span>
                        : <span>{s.progress}/{s.totalQuestions}</span>}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {s.violations === 0
                        ? <span className="text-gray-400">0</span>
                        : s.violations >= 3
                        ? <span className="text-red-600 font-bold">{s.violations} ❌</span>
                        : <span className="text-yellow-600 font-medium">{s.violations} ⚠️</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMonitorExam(null)}>关闭</Button>
            <Button className="gap-1.5 text-white bg-red-600 hover:bg-red-700"
              onClick={() => { if (monitorExam) setForceCollectExam(monitorExam); setMonitorExam(null); }}>
              强制收卷 <PBadge p="P1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Force Collect Confirm ─────────────────────────────────────────────── */}
      <Dialog open={!!forceCollectExam} onOpenChange={() => setForceCollectExam(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={18} /> 确认强制收卷 <PBadge p="P1" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1 text-sm">
            <p className="text-gray-700">
              确认对 <span className="font-semibold">「{forceCollectExam?.title}」</span> 执行强制收卷？
            </p>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1 text-xs text-red-700">
              <p className="font-medium mb-1">当前状态：</p>
              <p>· 已交卷：{submitted} 人</p>
              <p>· 答题中：{answering} 人 &nbsp;← 答卷将自动提交</p>
              {disconnected.length > 0 && (
                <p>· 断线中：{disconnected.length} 人 &nbsp;← 提交最后暂存版本</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">此操作不可撤销。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceCollectExam(null)}>取消</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleForceCollect}>
              确认强制收卷
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!detailExam} onOpenChange={() => setDetailExam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>考试详情</DialogTitle></DialogHeader>
          {detailExam && (
            <div className="space-y-3 text-sm">
              {[
                { label: '考试名称', value: detailExam.title },
                { label: '科目',     value: detailExam.subject },
                { label: '开始时间', value: detailExam.startTime },
                { label: '结束时间', value: detailExam.endTime },
                { label: '考试时长', value: `${detailExam.duration} 分钟` },
                { label: '总分',     value: `${detailExam.totalScore} 分` },
                { label: '题目数量', value: `${detailExam.questionIds.length} 题` },
                { label: '参考班级', value: detailExam.class },
                { label: '所属学院', value: detailExam.college },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailExam(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除考试</DialogTitle>
            <DialogDescription>
              该考试尚未开始，删除后关联的试卷不会被删除。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700 py-1">
            确认删除 <span className="font-semibold">「{deleteTarget?.title}」</span>？
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setExams(prev => prev.filter(e => e.id !== deleteTarget?.id));
                toast.success('考试已删除');
                setDeleteTarget(null);
              }}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Exam Dialog ───────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              {newExam.title.includes('（副本）') ? <>复制考试 <PBadge p="P2" /></> : <>创建考试 <PBadge p="P0" /></>}
            </DialogTitle>
            {newExam.title.includes('（副本）') && (
              <DialogDescription>已预填原考试配置，请设置新的考试时间后保存。</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-6 py-1">
            {/* Basic info */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">基本信息</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">考试名称</Label>
                  <Input className="mt-1 h-9" placeholder="如：2024-2025第二学期 数据结构 期末考试"
                    value={newExam.title}
                    onChange={e => setNewExam(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">关联试卷</Label>
                    <Select value={newExam.paperName} onValueChange={v => v && setNewExam(p => ({ ...p, paperName: v }))}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue placeholder="选择已保存的试卷">{newExam.paperName || '选择已保存的试卷'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="数据结构期末试卷A">数据结构期末试卷A（100分·18题）</SelectItem>
                        <SelectItem value="计算机网络综合卷">计算机网络综合卷（100分·20题）</SelectItem>
                        <SelectItem value="数据结构小测卷">数据结构小测卷（50分·10题）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">考试时长</Label>
                    <Select value={newExam.duration} onValueChange={v => v && setNewExam(p => ({ ...p, duration: v }))}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue>{newExam.duration} 分钟</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map(d => <SelectItem key={d} value={String(d)}>{d} 分钟</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            {/* Time */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">考试时间</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">开始日期</Label>
                  <Input type="date" className="mt-1 h-9 text-xs"
                    value={newExam.startDate}
                    onChange={e => setNewExam(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">开始时间</Label>
                  <Input type="time" className="mt-1 h-9 text-xs"
                    value={newExam.startTime}
                    onChange={e => setNewExam(p => ({ ...p, startTime: e.target.value }))} />
                </div>
              </div>
              {newExam.startDate && (
                <p className="text-xs text-muted-foreground mt-2">
                  预计结束时间：{formatEndTime(newExam.startDate, newExam.startTime, Number(newExam.duration))}
                </p>
              )}
              <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                <input type="checkbox" checked={newExam.allowEarly}
                  onChange={e => setNewExam(p => ({ ...p, allowEarly: e.target.checked }))} className="rounded" />
                允许提前交卷
              </label>
            </section>

            {/* Classes */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">参加班级</p>
              <div className="mb-2">
                <Select value={newExam.college} onValueChange={v => v && setNewExam(p => ({ ...p, college: v }))}>
                  <SelectTrigger className="h-9 text-xs w-40">
                    <SelectValue>{newExam.college}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {['信息学院', '经济学院', '理工学院', '文学院'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox"
                    checked={newExam.classes.length === ALL_CLASSES.length}
                    onChange={e => setNewExam(p => ({ ...p, classes: e.target.checked ? [...ALL_CLASSES] : [] }))}
                    className="rounded" />
                  全选
                </label>
                {ALL_CLASSES.map(c => (
                  <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={newExam.classes.includes(c)}
                      onChange={() => toggleClass(c)} className="rounded" />
                    {c}
                  </label>
                ))}
              </div>
              {newExam.classes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  已选：{newExam.classes.length} 个班，约 {newExam.classes.length * 44} 人
                </p>
              )}
            </section>

            {/* Anti-cheat */}
            <section>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">防作弊设置 <PBadge p="P0" /></p>
              <div className="space-y-2">
                {antiCheatItems.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={newExam.antiCheat[key]}
                      onChange={e => setNewExam(p => ({ ...p, antiCheat: { ...p.antiCheat, [key]: e.target.checked } }))}
                      className="rounded" />
                    {label}
                  </label>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">最大离屏次数</span>
                  <input type="number" min={1} max={10}
                    value={newExam.antiCheat.maxViolations}
                    onChange={e => setNewExam(p => ({ ...p, antiCheat: { ...p.antiCheat, maxViolations: Number(e.target.value) } }))}
                    className="w-14 h-7 border rounded text-xs text-center px-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <span className="text-xs text-muted-foreground">次（超过自动交卷）</span>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button variant="outline" onClick={() => handleSave(false)}>保存草稿</Button>
            <Button className="text-white" style={{ background: '#002045' }} onClick={() => handleSave(true)}>
              保存并发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
