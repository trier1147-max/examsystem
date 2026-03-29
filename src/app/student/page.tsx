'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Clock, BookOpen, ChevronRight, CalendarDays, Info, FileX2,
  FileQuestion, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { mockExams, mockStudentScores, mockQuestions } from '@/mock/data';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-03-28T09:36:00'); // demo "now"

const upcomingExams = mockExams
  .filter(e => e.status === 'pending' || e.status === 'ongoing')
  .sort((a, b) => {
    if (a.status === 'ongoing') return -1;
    if (b.status === 'ongoing') return 1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

const avgPct = mockStudentScores.length
  ? Math.round(mockStudentScores.reduce((s, r) => s + (r.score / r.totalScore) * 100, 0) / mockStudentScores.length)
  : 0;
const latestRank = mockStudentScores[0];

const DEFER_REASONS = [
  '因病（需提供病假证明）',
  '参加公务活动',
  '家庭紧急情况',
  '其他原因',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(seconds: number) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(dateStr: string) {
  const days = daysUntil(dateStr);
  if (days <= 0) return { text: '即将开始', color: 'text-red-600', bg: 'bg-red-50' };
  if (days === 1) return { text: '明天开始', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { text: `还有 ${days} 天`, color: 'text-muted-foreground', bg: 'bg-gray-50' };
}

function getTypeBreakdown(questionIds: string[]) {
  const qs = mockQuestions.filter(q => questionIds.includes(q.id));
  const groups: Record<string, { count: number; score: number }> = {};
  for (const q of qs) {
    const label = q.type === 'choice' ? '选择题' : q.type === 'fill' ? '填空题' : q.type === 'short' ? '简答题' : '论述题';
    groups[label] = groups[label] ?? { count: 0, score: 0 };
    groups[label].count += 1;
    groups[label].score += q.score;
  }
  return Object.entries(groups).map(([label, v]) => ({ label, ...v }));
}

// Mock deferred exams (approved by admin)
const DEFERRED_EXAMS = [
  {
    id: 'E003-defer',
    title: '高等数学 期末考试',
    subject: '高等数学',
    originalTime: '2026-03-25 14:00',
    supplementTime: '2026-04-15 09:00',
    duration: 120,
    reason: '因病请假（已审批 · 2026-03-24）',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function StudentHomePage() {
  const { currentUser } = useStore();
  const [noticeExam, setNoticeExam] = useState<typeof upcomingExams[0] | null>(null);

  // ── Defer apply state ──
  const [deferExam, setDeferExam] = useState<typeof upcomingExams[0] | null>(null);
  const [deferReason, setDeferReason] = useState('');
  const [deferNote, setDeferNote] = useState('');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleDeferSubmit = () => {
    if (!deferExam) return;
    if (!deferReason) { toast.error('请选择缓考原因'); return; }
    setAppliedIds(prev => new Set(prev).add(deferExam.id));
    toast.success('缓考申请已提交，等待教学秘书审批');
    setDeferExam(null);
    setDeferReason('');
    setDeferNote('');
  };

  // ── Countdown for ongoing exam ──
  const ongoingExam = upcomingExams.find(e => e.status === 'ongoing');
  const [countdownSec, setCountdownSec] = useState(() => {
    if (!ongoingExam) return 0;
    return Math.max(0, Math.floor((new Date(ongoingExam.endTime).getTime() - NOW.getTime()) / 1000));
  });

  useEffect(() => {
    if (!ongoingExam) return;
    const id = setInterval(() => setCountdownSec(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [ongoingExam]);

  const noticeBreakdown = noticeExam ? getTypeBreakdown(noticeExam.questionIds) : [];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* ── Personal info card ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #002045 0%, #003575 100%)' }}
      >
        <p className="text-white/60 text-xs mb-1">欢迎回来</p>
        <h1 className="text-xl font-bold">{currentUser?.name ?? '同学'}</h1>
        <p className="text-white/60 text-sm mt-0.5">
          {currentUser?.grade} · {currentUser?.class}
        </p>

        <div className="flex gap-5 mt-5">
          <div>
            <p className="text-2xl font-bold">{upcomingExams.length}</p>
            <p className="text-xs text-white/60 mt-0.5">待参加考试</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">{avgPct}<span className="text-base font-medium ml-0.5">分</span></p>
            <p className="text-xs text-white/60 mt-0.5">本学期平均成绩</p>
            <p className="text-xs text-green-300 mt-0.5">↑3.2 vs 上学期</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">
              {latestRank ? latestRank.rank : '—'}
              <span className="text-base font-medium ml-0.5">/{latestRank?.classSize ?? '—'}</span>
            </p>
            <p className="text-xs text-white/60 mt-0.5">班级排名</p>
          </div>
        </div>
      </div>

      {/* ── Upcoming exams ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-gray-900">待参加考试</h2>
        </div>

        {upcomingExams.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <CalendarDays size={28} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">暂无待参加的考试</p>
            <p className="text-xs text-muted-foreground/60 mt-1">当前没有安排考试，请关注老师通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingExams.map(exam => {
              const isOngoing = exam.status === 'ongoing';
              const urgency = isOngoing ? null : urgencyLabel(exam.startTime);
              const hasApplied = appliedIds.has(exam.id);

              return (
                <div
                  key={exam.id}
                  className={cn(
                    'rounded-xl border bg-white overflow-hidden',
                    isOngoing && 'border-red-300 border-l-4 border-l-red-500'
                  )}
                >
                  <div className={cn('px-4 pt-4 pb-3', isOngoing && 'bg-red-50/30')}>
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5',
                          isOngoing ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        )}>
                          {isOngoing ? '进行中' : '未开始'}
                        </span>
                        <p className="font-semibold text-sm text-gray-900 truncate">{exam.title}</p>
                      </div>
                      {!isOngoing && urgency && (
                        <span className={cn('text-xs font-medium flex-shrink-0', urgency.color)}>
                          {urgency.text}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {exam.startTime} · {exam.duration} 分钟 · {exam.totalScore} 分
                    </p>

                    {/* Countdown for ongoing */}
                    {isOngoing && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={13} className="text-red-500" />
                        <span className="text-sm font-semibold text-red-600 tabular-nums">
                          距考试结束还有 {formatCountdown(countdownSec)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={cn(
                    'flex items-center justify-between px-4 py-2.5 border-t',
                    isOngoing ? 'bg-red-50/20 border-red-100' : 'bg-gray-50/50 border-gray-100'
                  )}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setNoticeExam(exam)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-900 transition-colors"
                      >
                        <Info size={13} />
                        考试须知
                      </button>
                      {/* 申请缓考：仅未开始的考试可申请 */}
                      {!isOngoing && (
                        hasApplied ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 size={12} />
                            已申请缓考
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeferExam(exam)}
                            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors"
                          >
                            <FileQuestion size={13} />
                            申请缓考
                          </button>
                        )
                      )}
                    </div>
                    {isOngoing && (
                      <Link href={`/student/exam/${exam.id}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs text-white gap-1.5"
                          style={{ background: '#dc2626' }}
                        >
                          进入考试 <ChevronRight size={13} />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Deferred exams ───────────────────────────────────────── */}
      {DEFERRED_EXAMS.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileX2 size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-gray-900">缓考安排</h2>
          </div>
          <div className="space-y-3">
            {DEFERRED_EXAMS.map(exam => (
              <div key={exam.id} className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 flex-shrink-0 mt-0.5">
                      已缓考
                    </span>
                    <p className="font-semibold text-sm text-gray-700">{exam.title}</p>
                  </div>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>原考试时间：<span className="line-through">{exam.originalTime}</span></p>
                    <p>补考时间：<span className="text-blue-600 font-medium">{exam.supplementTime}</span> · {exam.duration} 分钟</p>
                    <p className="text-gray-400 mt-1">{exam.reason}</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t bg-gray-100/60">
                  <span className="text-xs text-muted-foreground">请在补考日期前保持手机畅通，如有疑问请联系教学秘书</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exam notice dialog ────────────────────────────────────── */}
      <Dialog open={!!noticeExam} onOpenChange={open => !open && setNoticeExam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen size={16} />
              考试须知
            </DialogTitle>
          </DialogHeader>

          {noticeExam && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-gray-50 border p-3 space-y-0.5">
                <p className="font-semibold text-gray-900">{noticeExam.title}</p>
                <p className="text-xs text-muted-foreground">
                  时间：{noticeExam.startTime} — {noticeExam.endTime}（{noticeExam.duration} 分钟）
                </p>
                <p className="text-xs text-muted-foreground">
                  总分：{noticeExam.totalScore} 分 · 共 {noticeExam.questionIds.length} 题
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-800">⚠️ 考试规则</p>
                {[
                  '考试期间浏览器将进入全屏模式',
                  '禁止切换到其他页面或应用程序',
                  '离开考试页面累计 3 次将自动交卷',
                  '禁止复制、粘贴操作（Ctrl+C / Ctrl+V）',
                  '考试结束时间到将自动提交试卷',
                  '答案每 60 秒自动保存，断网后恢复不丢失',
                ].map((rule, i) => (
                  <p key={i} className="text-xs text-amber-700">{i + 1}. {rule}</p>
                ))}
              </div>

              {noticeBreakdown.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">📋 题型分布</p>
                  <div className="flex flex-wrap gap-2">
                    {noticeBreakdown.map(({ label, count, score }) => (
                      <span key={label} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {label} {count} 题（{score} 分）
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              className="text-white w-full"
              style={{ background: '#002045' }}
              onClick={() => setNoticeExam(null)}
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Defer apply dialog ───────────────────────────────────── */}
      <Dialog open={!!deferExam} onOpenChange={open => { if (!open) { setDeferExam(null); setDeferReason(''); setDeferNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion size={16} className="text-amber-600" />
              申请缓考
            </DialogTitle>
            <DialogDescription>
              申请提交后将由教学秘书审核，请如实填写原因
            </DialogDescription>
          </DialogHeader>

          {deferExam && (
            <div className="space-y-4">
              {/* Exam info */}
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="font-semibold text-sm text-gray-900">{deferExam.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  考试时间：{deferExam.startTime} · {deferExam.duration} 分钟
                </p>
              </div>

              {/* Reason select */}
              <div className="space-y-1.5">
                <Label className="text-sm">缓考原因 <span className="text-red-500">*</span></Label>
                <Select value={deferReason} onValueChange={(v) => setDeferReason(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择原因" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFER_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note textarea */}
              <div className="space-y-1.5">
                <Label className="text-sm">
                  详细说明
                  <span className="text-xs text-muted-foreground ml-1">（可选，最多 200 字）</span>
                </Label>
                <Textarea
                  placeholder="请补充说明具体情况，如就医日期、证明材料等"
                  value={deferNote}
                  onChange={e => setDeferNote(e.target.value.slice(0, 200))}
                  className="resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">{deferNote.length}/200</p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700">
                  提交后需上传相关证明材料（病假单、公务证明等），请前往"成绩与申请"页面补充附件
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDeferExam(null); setDeferReason(''); setDeferNote(''); }}>
              取消
            </Button>
            <Button
              size="sm"
              className="text-white gap-1"
              style={{ background: '#d97706' }}
              onClick={handleDeferSubmit}
              disabled={!deferReason}
            >
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
