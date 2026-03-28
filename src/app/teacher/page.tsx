'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, ClipboardList, PenLine, PlusCircle, ArrowRight,
  Clock, Monitor, CheckCircle2, AlertTriangle, ChevronRight,
  TrendingUp, Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { mockExams, mockTeacherStats, mockQuestions } from '@/mock/data';

// ── Mock grading progress (shared concept with exams page) ──────────────────

const GRADING_PROGRESS: Record<string, { done: number; total: number; deadline: string }> = {
  E006: { done: 198, total: 355, deadline: '2026-04-01' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function countdown(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return '已结束';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}分 ${s}秒`;
  return `${s}秒`;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr.split(' ')[0]);
  const today = new Date('2026-03-28');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function subjectColor(subject: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    '数据结构':   { color: '#002045', bg: '#eef2ff' },
    '计算机网络': { color: '#006c4a', bg: '#ecfdf5' },
    '高等数学':   { color: '#7c3aed', bg: '#f3f0ff' },
  };
  return map[subject] ?? { color: '#6b7280', bg: '#f3f4f6' };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TeacherHomePage() {
  const { currentUser } = useStore();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  // Live countdown tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Derived data
  const ongoingExams = mockExams.filter(e => e.status === 'ongoing');
  const upcomingExams = mockExams.filter(e => e.status === 'pending').slice(0, 2);
  const gradingExams = mockExams.filter(e => e.status === 'grading');

  // Per-subject question counts
  const subjectCounts = mockQuestions.reduce<Record<string, number>>((acc, q) => {
    acc[q.subject] = (acc[q.subject] ?? 0) + 1;
    return acc;
  }, {});

  // Today's task summary
  const totalPending = gradingExams.reduce((s, e) => {
    const p = GRADING_PROGRESS[e.id];
    return s + (p ? p.total - p.done : 0);
  }, 0);
  const notifCount = 2; // matches TeacherSidebar mock

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* ── Welcome header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            你好，{currentUser?.name ?? '老师'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.college} · {currentUser?.subject}
          </p>
        </div>
        {/* Today task summary pills */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {ongoingExams.length > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
              {ongoingExams.length} 场考试进行中
            </span>
          )}
          {totalPending > 0 && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
              <PenLine size={11} />
              {totalPending} 份待批改
            </span>
          )}
          <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100">
            <AlertTriangle size={11} />
            {notifCount} 条新通知
          </span>
        </div>
      </div>

      {/* ── Stat cards row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '题库总量',    value: mockTeacherStats.questionBankTotal.toLocaleString(), icon: BookOpen,     color: '#002045', bg: '#eef2ff', href: '/teacher/question-bank' },
          { label: '本学期考试',  value: mockTeacherStats.semesterExams,                       icon: ClipboardList, color: '#006c4a', bg: '#ecfdf5', href: '/teacher/exams' },
          { label: '待阅卷',      value: mockTeacherStats.pendingGrading,                       icon: PenLine,       color: '#dc2626', bg: '#fef2f2', href: '/teacher/grading' },
          { label: '本月新增题目', value: mockTeacherStats.monthlyNew,                           icon: PlusCircle,    color: '#d97706', bg: '#fffbeb', href: '/teacher/question-bank' },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="shadow-none border hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column: exams + grading ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Ongoing exams */}
          <Card className="shadow-none border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                进行中的考试
              </CardTitle>
              <Link href="/teacher/exams">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">
                  考试管理 <ArrowRight size={12} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {ongoingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无进行中的考试</p>
              ) : (
                ongoingExams.map(exam => {
                  const { color, bg } = subjectColor(exam.subject);
                  const timeLeft = countdown(exam.endTime);
                  return (
                    <div key={exam.id} className="flex items-center gap-4 p-3 rounded-xl border bg-blue-50/40 border-blue-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <ClipboardList size={18} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exam.class} · {exam.subject} · 结束于 {exam.endTime.split(' ')[1]}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          <Clock size={10} />
                          {timeLeft}
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => router.push(`/teacher/grading/${exam.id}`)}
                        >
                          <Monitor size={11} /> 监考视图
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Grading tasks */}
          {gradingExams.length > 0 && (
            <Card className="shadow-none border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <PenLine size={14} className="text-amber-600" />
                  待批改任务
                </CardTitle>
                <Link href="/teacher/grading">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">
                    阅卷中心 <ArrowRight size={12} />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {gradingExams.map(exam => {
                  const progress = GRADING_PROGRESS[exam.id];
                  const done = progress?.done ?? 0;
                  const total = progress?.total ?? 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const days = progress ? daysUntil(progress.deadline) : null;
                  const urgent = days !== null && days <= 3;
                  return (
                    <div key={exam.id} className="p-3 rounded-xl border space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{exam.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exam.class} · {exam.subject}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => router.push(`/teacher/grading/${exam.id}`)}
                        >
                          去阅卷 <ChevronRight size={11} />
                        </Button>
                      </div>
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>已批改 {done}/{total} 份</span>
                          <span className={urgent ? 'text-red-600 font-semibold flex items-center gap-1' : ''}>
                            {urgent && <AlertTriangle size={10} />}
                            {days !== null ? (days <= 0 ? '已逾期' : `截止还剩 ${days} 天`) : ''}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: urgent ? '#dc2626' : '#d97706',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Upcoming exams */}
          {upcomingExams.length > 0 && (
            <Card className="shadow-none border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">即将开始的考试</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingExams.map(exam => {
                  const days = daysUntil(exam.startTime);
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exam.startTime} · {exam.class}
                        </p>
                      </div>
                      <Badge variant={days <= 3 ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                        {days <= 0 ? '今天' : `${days} 天后`}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column: question bank overview + quick actions ─────────── */}
        <div className="space-y-5">

          {/* Question bank overview */}
          <Card className="shadow-none border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Layers size={14} className="text-gray-500" />
                我的题库概览
              </CardTitle>
              <Link href="/teacher/question-bank">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">
                  管理 <ArrowRight size={12} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(subjectCounts).map(([subject, count]) => {
                const { color, bg } = subjectColor(subject);
                return (
                  <div key={subject} className="flex items-center gap-3 p-2.5 rounded-lg border">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <BookOpen size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{subject}</p>
                      <p className="text-xs text-muted-foreground">{count} 道题</p>
                    </div>
                    <TrendingUp size={12} className="text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })}
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-50">
                  <BookOpen size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">全部科目合计</p>
                  <p className="text-xs text-muted-foreground">{mockTeacherStats.questionBankTotal.toLocaleString()} 道题</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="shadow-none border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: '新增题目',   href: '/teacher/question-bank', color: '#002045', icon: PlusCircle },
                { label: '创建考试',   href: '/teacher/create-exam',   color: '#006c4a', icon: ClipboardList },
                { label: '阅卷中心',   href: '/teacher/grading',        color: '#d97706', icon: PenLine },
                { label: '成绩统计',   href: '/teacher/scores',         color: '#7c3aed', icon: TrendingUp },
              ].map(({ label, href, color, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border hover:bg-muted/40 transition-colors text-sm font-medium"
                    style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={13} style={{ color }} />
                      {label}
                    </span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                  </button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Completion status summary */}
          <Card className="shadow-none border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">本学期完成情况</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: '已完成考试', value: mockExams.filter(e => e.status === 'finished').length, total: mockTeacherStats.semesterExams, color: '#006c4a' },
                { label: '阅卷完成率', value: 68, total: 100, color: '#d97706', suffix: '%' },
                { label: '成绩发布率', value: mockExams.filter(e => e.status === 'finished').length, total: mockTeacherStats.semesterExams, color: '#002045' },
              ].map(({ label, value, total, color, suffix }) => {
                const pct = suffix ? value : Math.round((value / total) * 100);
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-gray-800">
                        {suffix ? `${value}${suffix}` : `${value}/${total}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
