'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types & mock data ─────────────────────────────────────────────────────────

type StudentStatus = 'normal' | 'deferred' | 'cancelled';

interface Student {
  id: string;
  name: string;
  class: string;
  status: StudentStatus;
  note?: string;
}

interface LogEntry {
  time: string;
  operator: string;
  action: string;
  detail: string;
}

const INITIAL_STUDENTS: Student[] = [
  { id: '20220101', name: '王五',   class: '计科2201', status: 'normal' },
  { id: '20220102', name: '张三',   class: '计科2201', status: 'deferred',  note: '突发疾病' },
  { id: '20220103', name: '李四',   class: '计科2201', status: 'normal' },
  { id: '20220104', name: '赵六',   class: '计科2202', status: 'cancelled', note: '违纪处分' },
  { id: '20220105', name: '钱七',   class: '计科2202', status: 'normal' },
  { id: '20220106', name: '孙八',   class: '计科2202', status: 'normal' },
  { id: '20220107', name: '周九',   class: '计科2203', status: 'deferred',  note: '时间冲突' },
  { id: '20220108', name: '吴十',   class: '计科2203', status: 'normal' },
  { id: '20220109', name: '郑一',   class: '软工2201', status: 'normal' },
  { id: '20220110', name: '冯二',   class: '软工2201', status: 'normal' },
];

const INITIAL_LOG: LogEntry[] = [
  {
    time: '2026-03-28 15:32', operator: '李老师（教学秘书）',
    action: '标记缓考',
    detail: '将 张三(20220102) 标记为缓考｜原因：突发疾病｜已通知学生 ✅  已通知任课老师 ✅',
  },
  {
    time: '2026-03-28 14:18', operator: '李老师（教学秘书）',
    action: '取消资格',
    detail: '将 赵六(20220104) 取消考试资格｜原因：违纪处分',
  },
];

const STATUS_CFG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  normal:    { label: '正常',  color: 'text-gray-700',  bg: 'bg-gray-100' },
  deferred:  { label: '缓考',  color: 'text-yellow-700', bg: 'bg-yellow-50' },
  cancelled: { label: '取消',  color: 'text-red-700',   bg: 'bg-red-50' },
};

const CLASSES = ['全部', '计科2201', '计科2201', '计科2202', '计科2203', '软工2201', '软工2202'];

const DEFERRED_REASONS = [
  { value: 'sick', label: '突发疾病' },
  { value: 'conflict', label: '教室/时间冲突' },
  { value: 'other', label: '其他（请说明）' },
];

const BATCHES = [
  { value: 'b1', label: '第一批（当前）3/28 09:00 机房A/B/C' },
  { value: 'b2', label: '第二批  3/28 14:00 机房A/B/C' },
  { value: 'b3', label: '第三批  3/29 09:00 机房A/B/C' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExamStudentsPage() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');

  // Dialogs
  const [deferDialog, setDeferDialog] = useState<Student | null>(null);
  const [batchDialog, setBatchDialog] = useState<Student | null>(null);
  const [deferReason, setDeferReason] = useState('sick');
  const [deferNote, setDeferNote] = useState('');
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [notifyTeacher, setNotifyTeacher] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState('b2');
  const [batchReason, setBatchReason] = useState('');

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.includes(search) || s.id.includes(search);
    const matchClass = classFilter === '全部' || s.class === classFilter;
    const matchStatus = statusFilter === '全部' || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const counts = {
    normal: students.filter(s => s.status === 'normal').length,
    deferred: students.filter(s => s.status === 'deferred').length,
    cancelled: students.filter(s => s.status === 'cancelled').length,
  };

  function applyDefer() {
    if (!deferDialog) return;
    const reasonLabel = DEFERRED_REASONS.find(r => r.value === deferReason)?.label ?? '';
    const note = deferReason === 'other' ? deferNote : reasonLabel;
    setStudents(prev => prev.map(s =>
      s.id === deferDialog.id ? { ...s, status: 'deferred', note } : s
    ));
    const notifs = [notifyStudent && '已通知学生 ✅', notifyTeacher && '已通知任课老师 ✅'].filter(Boolean).join('  ');
    setLog(prev => [{
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      operator: '李老师（教学秘书）',
      action: '标记缓考',
      detail: `将 ${deferDialog.name}(${deferDialog.id}) 标记为缓考｜原因：${note}${notifs ? '｜' + notifs : ''}`,
    }, ...prev]);
    toast.success(`已将 ${deferDialog.name} 标记为缓考`);
    setDeferDialog(null);
    setDeferNote('');
    setDeferReason('sick');
  }

  function applyBatch() {
    if (!batchDialog) return;
    const batchLabel = BATCHES.find(b => b.value === selectedBatch)?.label.split(' ')[0] ?? '';
    setLog(prev => [{
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      operator: '李老师（教学秘书）',
      action: '调整批次',
      detail: `将 ${batchDialog.name}(${batchDialog.id}) 调整至${batchLabel}｜原因：${batchReason || '未填写'}`,
    }, ...prev]);
    toast.success(`${batchDialog.name} 已调整到 ${batchLabel}`);
    setBatchDialog(null);
    setBatchReason('');
  }

  function undoDefer(student: Student) {
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'normal', note: undefined } : s));
    toast.info(`${student.name} 缓考已取消`);
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">考生管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">数据结构 期末考试 · 共 {students.length} 人</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={14} className="text-green-600" />
          <span>正常 <strong>{counts.normal}</strong> 人</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle size={14} className="text-yellow-500" />
          <span>缓考 <strong>{counts.deferred}</strong> 人</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <X size={14} className="text-red-500" />
          <span>取消 <strong>{counts.cancelled}</strong> 人</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索姓名/学号"
            className="pl-7 h-8 text-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {['全部', '计科2201', '计科2202', '计科2203', '软工2201'].map(c => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={cn('px-2.5 py-1 rounded-lg text-xs border transition-colors',
                classFilter === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['全部', '正常', '缓考', '取消'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-2.5 py-1 rounded-lg text-xs border transition-colors',
                statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Student table */}
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
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{s.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-gray-700 text-xs">{s.class}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.note ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {s.status === 'normal' && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                              onClick={() => setDeferDialog(s)}>缓考</Button>
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                              onClick={() => setBatchDialog(s)}>调批次</Button>
                          </>
                        )}
                        {s.status === 'deferred' && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                              onClick={() => undoDefer(s)}>取消缓考</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground"
                              onClick={() => toast.info(`${s.name} 缓考原因：${s.note}`)}>查看</Button>
                          </>
                        )}
                        {s.status === 'cancelled' && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground"
                            onClick={() => toast.info(`${s.name} 取消原因：${s.note}`)}>查看</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">无符合条件的考生</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Operation log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">操作记录</h2>
          <button className="text-xs text-blue-600 hover:underline" onClick={() => toast.info('导出日志功能（演示）')}>
            导出日志
          </button>
        </div>
        {log.length === 0 && <p className="text-xs text-muted-foreground">暂无操作记录</p>}
        <div className="space-y-2">
          {log.map((entry, i) => (
            <div key={i} className="text-xs border rounded-lg px-4 py-3 bg-gray-50/40">
              <div className="flex items-center gap-2 mb-0.5 text-muted-foreground">
                <span>{entry.time}</span>
                <span>·</span>
                <span>{entry.operator}</span>
                <Badge variant="secondary" className="text-xs">{entry.action}</Badge>
              </div>
              <p className="text-gray-700">{entry.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 缓考 Dialog ── */}
      <Dialog open={!!deferDialog} onOpenChange={open => !open && setDeferDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">标记缓考</DialogTitle>
          </DialogHeader>
          {deferDialog && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                <p>学生：<strong className="text-gray-900">{deferDialog.name}（{deferDialog.id}）{deferDialog.class}</strong></p>
                <p className="mt-0.5">考试：数据结构 期末考试</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">缓考原因</p>
                <RadioGroup value={deferReason} onValueChange={setDeferReason} className="space-y-2">
                  {DEFERRED_REASONS.map(r => (
                    <div key={r.value} className="flex items-center gap-2">
                      <RadioGroupItem value={r.value} id={`dr-${r.value}`} />
                      <Label htmlFor={`dr-${r.value}`} className="text-sm cursor-pointer">{r.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {deferReason === 'other' && (
                  <Textarea
                    placeholder="请说明原因..."
                    className="mt-2 text-sm"
                    rows={2}
                    value={deferNote}
                    onChange={e => setDeferNote(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={notifyStudent} onChange={e => setNotifyStudent(e.target.checked)} className="rounded" />
                  <span className="text-sm">同时发送缓考通知给该学生</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={notifyTeacher} onChange={e => setNotifyTeacher(e.target.checked)} className="rounded" />
                  <span className="text-sm">同时通知任课老师</span>
                </label>
              </div>

              <div className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <AlertCircle size={11} className="inline mr-1 text-orange-500" />
                缓考后该学生本场成绩不计入统计，后续可安排补考。
              </div>
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
          <DialogHeader>
            <DialogTitle className="text-base">调整考试批次</DialogTitle>
          </DialogHeader>
          {batchDialog && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                <p>学生：<strong className="text-gray-900">{batchDialog.name}（{batchDialog.id}）</strong></p>
                <p className="mt-0.5">当前批次：第一批（3/28 09:00 机房A/B/C）</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">调整到</p>
                <RadioGroup value={selectedBatch} onValueChange={setSelectedBatch} className="space-y-2">
                  {BATCHES.slice(1).map(b => (
                    <div key={b.value} className="flex items-center gap-2">
                      <RadioGroupItem value={b.value} id={`batch-${b.value}`} />
                      <Label htmlFor={`batch-${b.value}`} className="text-sm cursor-pointer">{b.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">调整原因</p>
                <Input
                  placeholder="请填写原因..."
                  className="text-sm"
                  value={batchReason}
                  onChange={e => setBatchReason(e.target.value)}
                />
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
