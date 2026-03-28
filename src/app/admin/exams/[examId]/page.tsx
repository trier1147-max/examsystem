'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, AlertCircle, CheckCircle2, Search, Bell, Users, FileText, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Mock exam data ────────────────────────────────────────────────────────────

const EXAM_MAP: Record<string, {
  id: string; title: string; subject: string; teacher: string;
  startTime: string; endTime: string; duration: number; totalScore: number;
  classes: string[]; location: string; status: 'ongoing' | 'pending' | 'grading' | 'finished';
  totalStudents: number; submitted: number; anomalies: number;
}> = {
  E001: {
    id: 'E001', title: '数据结构 期末考试', subject: '数据结构', teacher: '李明华',
    startTime: '2026-03-28 09:00', endTime: '2026-03-28 11:00', duration: 120, totalScore: 100,
    classes: ['计科2201', '计科2202', '计科2203', '软工2201', '软工2202'],
    location: '第三教学楼 机房A/B/C', status: 'ongoing',
    totalStudents: 320, submitted: 156, anomalies: 2,
  },
  E002: {
    id: 'E002', title: '计算机网络 期末考试', subject: '计算机网络', teacher: '王建国',
    startTime: '2026-04-10 14:00', endTime: '2026-04-10 16:00', duration: 120, totalScore: 100,
    classes: ['计科2201', '计科2202', '计科2203'],
    location: '第二教学楼 机房D/E', status: 'pending',
    totalStudents: 180, submitted: 0, anomalies: 0,
  },
  E003: {
    id: 'E003', title: '高等数学 期末考试', subject: '高等数学', teacher: '张伟',
    startTime: '2026-03-25 14:00', endTime: '2026-03-25 16:00', duration: 120, totalScore: 150,
    classes: ['计科2201', '计科2202', '计科2203', '软工2201', '软工2202'],
    location: '第一教学楼 A101-A105', status: 'grading',
    totalStudents: 580, submitted: 580, anomalies: 0,
  },
};

// ── Student data ──────────────────────────────────────────────────────────────

type StudentStatus = 'normal' | 'deferred' | 'cancelled';

interface Student {
  id: string; name: string; class: string; status: StudentStatus; note?: string;
}

const INITIAL_STUDENTS: Student[] = [
  { id: '20220101', name: '王五',  class: '计科2201', status: 'normal' },
  { id: '20220102', name: '张三',  class: '计科2201', status: 'deferred',  note: '突发疾病' },
  { id: '20220103', name: '李四',  class: '计科2201', status: 'normal' },
  { id: '20220104', name: '赵六',  class: '计科2202', status: 'cancelled', note: '违纪处分' },
  { id: '20220105', name: '钱七',  class: '计科2202', status: 'normal' },
  { id: '20220106', name: '孙八',  class: '计科2202', status: 'normal' },
  { id: '20220107', name: '周九',  class: '计科2203', status: 'deferred',  note: '时间冲突' },
  { id: '20220108', name: '吴十',  class: '计科2203', status: 'normal' },
  { id: '20220109', name: '郑一',  class: '软工2201', status: 'normal' },
  { id: '20220110', name: '冯二',  class: '软工2201', status: 'normal' },
];

const STATUS_CFG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  normal:    { label: '正常',  color: 'text-gray-700',   bg: 'bg-gray-100' },
  deferred:  { label: '缓考',  color: 'text-yellow-700', bg: 'bg-yellow-50' },
  cancelled: { label: '取消',  color: 'text-red-700',    bg: 'bg-red-50' },
};

const DEFER_REASONS = [
  { value: 'sick',     label: '突发疾病' },
  { value: 'conflict', label: '教室/时间冲突' },
  { value: 'other',    label: '其他（请说明）' },
];

const BATCHES = [
  { value: 'b2', label: '第二批  3/28 14:00 机房A/B/C' },
  { value: 'b3', label: '第三批  3/29 09:00 机房A/B/C' },
];

// Live monitor mock data
const ROOM_STATUS = [
  { room: '机房A', capacity: 60, online: 58, submitted: 32, anomalies: 1 },
  { room: '机房B', capacity: 60, online: 55, submitted: 28, anomalies: 1 },
  { room: '机房C', capacity: 60, online: 43, submitted: 20, anomalies: 0 },
];

const ANOMALY_LOG = [
  { time: '09:45', student: '王五（计科2201）', room: '机房A', type: '切换标签', count: 1 },
  { time: '10:12', student: '李四（计科2202）', room: '机房B', type: '切换标签', count: 3 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const exam = EXAM_MAP[examId] ?? EXAM_MAP['E001'];

  const [tab, setTab] = useState<'info' | 'students' | 'monitor'>('info');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('全部');

  const [deferDialog, setDeferDialog] = useState<Student | null>(null);
  const [batchDialog, setBatchDialog] = useState<Student | null>(null);
  const [deferReason, setDeferReason] = useState('sick');
  const [deferNote, setDeferNote] = useState('');
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [notifyTeacher, setNotifyTeacher] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState('b2');
  const [batchReason, setBatchReason] = useState('');

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (classFilter === '全部' || s.class === classFilter)
      && (!search || s.name.includes(q) || s.id.includes(q));
  });

  const counts = {
    normal:    students.filter(s => s.status === 'normal').length,
    deferred:  students.filter(s => s.status === 'deferred').length,
    cancelled: students.filter(s => s.status === 'cancelled').length,
  };

  function applyDefer() {
    if (!deferDialog) return;
    const note = deferReason === 'other' ? deferNote
      : DEFER_REASONS.find(r => r.value === deferReason)?.label ?? '';
    setStudents(prev => prev.map(s => s.id === deferDialog.id ? { ...s, status: 'deferred', note } : s));
    const notifs = [notifyStudent && '已通知学生 ✅', notifyTeacher && '已通知任课老师 ✅'].filter(Boolean).join('  ');
    toast.success(`已将 ${deferDialog.name} 标记为缓考${notifs ? '，' + notifs : ''}`);
    setDeferDialog(null); setDeferNote(''); setDeferReason('sick');
  }

  function applyBatch() {
    if (!batchDialog) return;
    const label = BATCHES.find(b => b.value === selectedBatch)?.label.split(' ')[0] ?? '';
    toast.success(`${batchDialog.name} 已调整到 ${label}`);
    setBatchDialog(null); setBatchReason('');
  }

  const STATUS_COLOR: Record<string, string> = {
    ongoing:  'text-green-700 bg-green-100',
    pending:  'text-blue-700 bg-blue-100',
    grading:  'text-orange-700 bg-orange-100',
    finished: 'text-gray-600 bg-gray-100',
  };
  const STATUS_LABEL: Record<string, string> = {
    ongoing: '进行中', pending: '待开始', grading: '阅卷中', finished: '已完成',
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-800 transition-colors"
          onClick={() => router.push('/admin/exams')}
        >
          <ChevronLeft size={15} /> 考试管理
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-gray-900">{exam.title}</span>
        <Badge variant="secondary" className={cn('text-xs ml-1', STATUS_COLOR[exam.status])}>
          {STATUS_LABEL[exam.status]}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {([
          { key: 'info',     label: '考试信息', icon: FileText },
          { key: 'students', label: '考生管理', icon: Users },
          { key: 'monitor',  label: '监考状态', icon: Clock },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-muted-foreground hover:text-gray-700'
            )}
          >
            <Icon size={13} /> {label}
            {key === 'students' && (counts.deferred + counts.cancelled) > 0 && (
              <span className="ml-1 min-w-4 h-4 px-1 bg-orange-400 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {counts.deferred + counts.cancelled}
              </span>
            )}
            {key === 'monitor' && exam.anomalies > 0 && (
              <span className="ml-1 min-w-4 h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {exam.anomalies}
              </span>
            )}
          </button>
        ))}

        {/* Export button top-right */}
        <div className="ml-auto flex items-center pb-1">
          <Button size="sm" variant="outline" className="text-xs gap-1 h-7"
            onClick={() => toast.info('导出成绩Excel（演示）')}>
            导出 ▾
          </Button>
        </div>
      </div>

      {/* ── Tab: 考试信息 ── */}
      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-none border">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">基本信息</p>
              {[
                ['课程名称', exam.title],
                ['科目',     exam.subject],
                ['任课老师', exam.teacher],
                ['考试时长', `${exam.duration} 分钟`],
                ['总分',     `${exam.totalScore} 分`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{k}</span>
                  <span className="text-xs text-gray-900 font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none border">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">时间 · 地点</p>
              {[
                ['开始时间', exam.startTime],
                ['结束时间', exam.endTime],
                ['考试地点', exam.location],
                ['参加班级', exam.classes.join('、')],
                ['参考人数', `${exam.totalStudents} 人`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{k}</span>
                  <span className="text-xs text-gray-900 font-medium leading-relaxed">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {exam.status !== 'pending' && (
            <Card className="shadow-none border col-span-2">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">交卷进度</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={Math.round(exam.submitted / exam.totalStudents * 100)} className="h-2" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">
                    {exam.submitted} / {exam.totalStudents} 人
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round(exam.submitted / exam.totalStudents * 100)}%)
                  </span>
                </div>
                {exam.anomalies > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-orange-600 text-xs">
                    <AlertCircle size={12} /> {exam.anomalies} 人发生异常行为，已记录
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: 考生管理 ── */}
      {tab === 'students' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-green-500" /> 正常 <strong>{counts.normal}</strong></span>
            <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-yellow-500" /> 缓考 <strong>{counts.deferred}</strong></span>
            <span className="flex items-center gap-1.5 text-red-600"><AlertCircle size={13} /> 取消 <strong>{counts.cancelled}</strong></span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-44 max-w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索姓名 / 学号" className="pl-7 h-8 text-xs"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {['全部', ...exam.classes].map(c => (
              <button key={c} onClick={() => setClassFilter(c)}
                className={cn('px-2.5 py-1 rounded-lg text-xs border transition-colors',
                  classFilter === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                )}>
                {c}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card className="shadow-none border">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    {['学号', '姓名', '班级', '状态', '备注', '操作'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const cfg = STATUS_CFG[s.status];
                    return (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/40">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.id}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{s.class}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.note ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            {s.status === 'normal' && (
                              <>
                                <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                                  onClick={() => setDeferDialog(s)}>缓考</Button>
                                <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                                  onClick={() => setBatchDialog(s)}>调批次</Button>
                              </>
                            )}
                            {s.status === 'deferred' && (
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                                onClick={() => {
                                  setStudents(prev => prev.map(p => p.id === s.id ? { ...p, status: 'normal', note: undefined } : p));
                                  toast.info(`${s.name} 缓考已取消`);
                                }}>
                                取消缓考
                              </Button>
                            )}
                            {s.status === 'cancelled' && (
                              <span className="text-xs text-muted-foreground px-2">{s.note}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">无符合条件的考生</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: 监考状态 ── */}
      {tab === 'monitor' && (
        <div className="space-y-4">
          {exam.status === 'pending' ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              考试尚未开始，监考状态暂不可用
            </div>
          ) : (
            <>
              {/* Room cards */}
              <div className="grid grid-cols-3 gap-3">
                {ROOM_STATUS.map(r => (
                  <Card key={r.room} className={cn('shadow-none border', r.anomalies > 0 ? 'border-orange-200' : '')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{r.room}</span>
                        {r.anomalies > 0 && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            <AlertCircle size={10} className="inline mr-0.5" />{r.anomalies}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between"><span>在线</span><span className="font-medium text-gray-900">{r.online}/{r.capacity}</span></div>
                        <div className="flex justify-between"><span>已交卷</span><span className="font-medium text-green-600">{r.submitted}</span></div>
                      </div>
                      <div className="mt-2">
                        <Progress value={Math.round(r.submitted / r.capacity * 100)} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total progress */}
              <Card className="shadow-none border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">全场总进度</span>
                    <span className="text-sm text-muted-foreground">
                      {exam.submitted} / {exam.totalStudents} 已交卷
                    </span>
                  </div>
                  <Progress value={Math.round(exam.submitted / exam.totalStudents * 100)} className="h-2" />
                </CardContent>
              </Card>

              {/* Anomaly log */}
              {ANOMALY_LOG.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">异常行为记录</p>
                  <div className="space-y-2">
                    {ANOMALY_LOG.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs border border-orange-200 bg-orange-50/50 rounded-lg px-4 py-2.5">
                        <span className="text-muted-foreground font-mono">{log.time}</span>
                        <span className="font-medium text-gray-900">{log.student}</span>
                        <span className="text-muted-foreground">{log.room}</span>
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">{log.type}</Badge>
                        <span className="text-muted-foreground">第 {log.count} 次</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 缓考 Dialog ── */}
      <Dialog open={!!deferDialog} onOpenChange={open => !open && setDeferDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">标记缓考</DialogTitle></DialogHeader>
          {deferDialog && (
            <div className="space-y-4 py-1">
              <div className="text-sm bg-gray-50 rounded-lg p-3">
                <p>学生：<strong className="text-gray-900">{deferDialog.name}（{deferDialog.id}）{deferDialog.class}</strong></p>
                <p className="mt-0.5 text-muted-foreground">考试：{exam.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">缓考原因</p>
                <RadioGroup value={deferReason} onValueChange={setDeferReason} className="space-y-2">
                  {DEFER_REASONS.map(r => (
                    <div key={r.value} className="flex items-center gap-2">
                      <RadioGroupItem value={r.value} id={`dr-${r.value}`} />
                      <Label htmlFor={`dr-${r.value}`} className="text-sm cursor-pointer">{r.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {deferReason === 'other' && (
                  <Input className="mt-2 text-sm" placeholder="请说明..."
                    value={deferNote} onChange={e => setDeferNote(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={notifyStudent} onChange={e => setNotifyStudent(e.target.checked)} />
                  同时发送缓考通知给该学生
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={notifyTeacher} onChange={e => setNotifyTeacher(e.target.checked)} />
                  同时通知任课老师
                </label>
              </div>
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-3 py-2">
                <AlertCircle size={11} className="inline mr-1" />
                缓考后该学生本场成绩不计入统计，后续可安排补考。
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeferDialog(null)}>取消</Button>
            <Button size="sm" className="text-white" style={{ background: '#002045' }} onClick={applyDefer}>
              确认标记缓考
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 调批次 Dialog ── */}
      <Dialog open={!!batchDialog} onOpenChange={open => !open && setBatchDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">调整考试批次</DialogTitle></DialogHeader>
          {batchDialog && (
            <div className="space-y-4 py-1">
              <div className="text-sm bg-gray-50 rounded-lg p-3">
                <p>学生：<strong className="text-gray-900">{batchDialog.name}（{batchDialog.id}）</strong></p>
                <p className="mt-0.5 text-muted-foreground">当前批次：第一批（3/28 09:00 机房A/B/C）</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">调整到</p>
                <RadioGroup value={selectedBatch} onValueChange={setSelectedBatch} className="space-y-2">
                  {BATCHES.map(b => (
                    <div key={b.value} className="flex items-center gap-2">
                      <RadioGroupItem value={b.value} id={`b-${b.value}`} />
                      <Label htmlFor={`b-${b.value}`} className="text-sm cursor-pointer">{b.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">调整原因</p>
                <Input placeholder="请填写..." className="text-sm"
                  value={batchReason} onChange={e => setBatchReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchDialog(null)}>取消</Button>
            <Button size="sm" className="text-white" style={{ background: '#002045' }} onClick={applyBatch}>
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
