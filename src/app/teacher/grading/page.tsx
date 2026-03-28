'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart2, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TypeBreakdown {
  label: string;
  qCount: number;
  status: 'auto' | 'partial' | 'todo' | 'done';
  done: number;
  total: number;
}

interface GradingExam {
  id: string;
  title: string;
  subject: string;
  date: string;
  submissionCount: number;
  urgency: 'urgent' | 'partial' | 'done';
  typeBreakdown: TypeBreakdown[];
  progress: number;
  remaining: number;
}

const GRADING_EXAMS: GradingExam[] = [
  {
    id: 'E006',
    title: '高等数学 期末考试',
    subject: '高等数学',
    date: '2026-03-25',
    submissionCount: 320,
    urgency: 'urgent',
    typeBreakdown: [
      { label: '选择题', qCount: 10, status: 'auto', done: 3200, total: 3200 },
      { label: '填空题', qCount: 5, status: 'auto', done: 1600, total: 1600 },
      { label: '简答题', qCount: 2, status: 'partial', done: 185, total: 640 },
      { label: '论述题', qCount: 1, status: 'todo', done: 0, total: 320 },
    ],
    progress: 62,
    remaining: 775,
  },
  {
    id: 'E004',
    title: '数据结构 期末考试',
    subject: '数据结构',
    date: '2026-03-20',
    submissionCount: 280,
    urgency: 'partial',
    typeBreakdown: [
      { label: '选择题', qCount: 8, status: 'auto', done: 2240, total: 2240 },
      { label: '填空题', qCount: 3, status: 'auto', done: 840, total: 840 },
      { label: '简答题', qCount: 3, status: 'partial', done: 120, total: 840 },
      { label: '论述题', qCount: 1, status: 'todo', done: 0, total: 280 },
    ],
    progress: 48,
    remaining: 1000,
  },
  {
    id: 'E005',
    title: '计算机网络 期末考试',
    subject: '计算机网络',
    date: '2026-01-10',
    submissionCount: 300,
    urgency: 'done',
    typeBreakdown: [
      { label: '选择题', qCount: 8, status: 'done', done: 2400, total: 2400 },
      { label: '填空题', qCount: 3, status: 'done', done: 900, total: 900 },
      { label: '简答题', qCount: 3, status: 'done', done: 900, total: 900 },
      { label: '论述题', qCount: 1, status: 'done', done: 300, total: 300 },
    ],
    progress: 100,
    remaining: 0,
  },
];

const URGENCY_CFG = {
  urgent:  { dot: 'bg-red-500',    label: '待阅卷', text: 'text-red-600',    badge: 'bg-red-100',    border: 'border-l-red-500' },
  partial: { dot: 'bg-yellow-400', label: '待终审', text: 'text-yellow-600', badge: 'bg-yellow-100', border: 'border-l-yellow-400' },
  done:    { dot: 'bg-green-500',  label: '已完成', text: 'text-green-600',  badge: 'bg-green-100',  border: '' },
};

const TYPE_CFG = {
  auto:    { icon: '✅', label: '自动批改完成', color: 'text-green-600' },
  partial: { icon: '🟡', label: '待终审',      color: 'text-yellow-600' },
  todo:    { icon: '🔴', label: '待批改',      color: 'text-red-600' },
  done:    { icon: '✅', label: '已完成',      color: 'text-green-600' },
};

const STATUS_LABELS: Record<string, string> = {
  all: '全部', urgent: '待阅卷', partial: '待终审', done: '已完成',
};

export default function GradingPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('全部');

  const filtered = GRADING_EXAMS.filter(e => {
    const ms = statusFilter === 'all' || e.urgency === statusFilter;
    const mj = subjectFilter === '全部' || e.subject === subjectFilter;
    return ms && mj;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">阅卷中心</h1>
        <p className="text-sm text-muted-foreground mt-0.5">选择考试开始批改</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {(['all', 'urgent', 'partial', 'done'] as const).map(v => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                statusFilter === v
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}
            >
              {STATUS_LABELS[v]}
            </button>
          ))}
        </div>
        <Select value={subjectFilter} onValueChange={v => v && setSubjectFilter(v)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue>{subjectFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {['全部', '高等数学', '数据结构', '计算机网络'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filtered.map(exam => {
          const urg = URGENCY_CFG[exam.urgency];
          return (
            <Card
              key={exam.id}
              className={cn(
                'shadow-none border',
                exam.urgency !== 'done' && cn('border-l-4', urg.border)
              )}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', urg.dot)} />
                      <h2 className="font-semibold text-gray-900 text-base">{exam.title}</h2>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', urg.text, urg.badge)}>
                        {urg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-4">
                      {exam.date} &nbsp;·&nbsp; {exam.submissionCount} 份试卷
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {exam.urgency === 'done' ? (
                      <>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                          onClick={() => router.push('/teacher/scores')}>
                          <BarChart2 size={13} /> 查看成绩
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8"
                          onClick={() => alert('导出报告演示')}>
                          <Download size={13} /> 导出报告
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2 text-white text-xs h-8"
                        style={{ background: exam.urgency === 'urgent' ? '#dc2626' : '#d97706' }}
                        onClick={() => router.push(`/teacher/grading/${exam.id}`)}
                      >
                        进入阅卷 <ArrowRight size={13} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Type breakdown */}
                {exam.urgency !== 'done' && (
                  <div className="rounded-lg border bg-gray-50 divide-y mb-4 text-xs">
                    {exam.typeBreakdown.map(t => {
                      const tc = TYPE_CFG[t.status];
                      return (
                        <div key={t.label} className="flex items-center gap-4 px-4 py-2.5">
                          <span className="w-4 text-center flex-shrink-0">{tc.icon}</span>
                          <span className="font-medium text-gray-800 w-20 flex-shrink-0">
                            {t.label} {t.qCount}题
                          </span>
                          <span className={cn('flex-1', tc.color)}>{tc.label}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {t.done.toLocaleString()}/{t.total.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">整体进度</span>
                    <span className="font-semibold text-gray-700">{exam.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${exam.progress}%`,
                        background:
                          exam.progress === 100 ? '#16a34a' :
                          exam.progress >= 60 ? '#d97706' : '#dc2626',
                      }}
                    />
                  </div>
                  {exam.remaining > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      预计剩余工作量：约 {exam.remaining.toLocaleString()} 份主观题待处理
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">全部批改完成 · 成绩已发布</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">暂无符合条件的考试</div>
        )}
      </div>
    </div>
  );
}
