'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Bell, CheckCircle2, ChevronRight,
  Clock, Play, FileText, TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PBadge } from '@/components/ui/pbadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Mock data ─────────────────────────────────────────────────────────────────

const LIVE_EXAM = {
  title: '数据结构 期末考试',
  teacher: '李明华',
  startTime: '2026-03-28 09:00',
  endTime: '2026-03-28 11:00',
  classes: ['计科2201', '计科2202', '计科2203', '软工2201', '软工2202'],
  total: 320,
  submitted: 156,
  anomalies: 2,
};

const UPCOMING_EXAM = {
  title: '计算机网络 期末考试',
  teacher: '王建国',
  startTime: '2026-04-10 14:00',
  endTime: '2026-04-10 16:00',
  classes: ['计科2201', '计科2202', '计科2203'],
  total: 180,
};

const GRADING_PROGRESS = [
  { id: 'g1', title: '高等数学 期末考试', teacher: '张伟', endDate: '2026-03-25', progress: 62, pending: 355, deadlineDays: 4 },
  { id: 'g2', title: '大学物理 期末考试', teacher: '陈芳', endDate: '2026-03-24', progress: 100, pending: 0, deadlineDays: null },
];

const RECENT_SCORES = [
  { id: 'r1', title: '大学物理',      avg: 72.5, passRate: 82, worstClass: '计科2203', published: false, alert: false },
  { id: 'r2', title: 'C语言程序设计', avg: 68.3, passRate: 75, worstClass: '软工2202', published: true,  alert: true  },
  { id: 'r3', title: '思想政治',      avg: 81.2, passRate: 95, worstClass: '—',        published: true,  alert: false },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [notifCount] = useState(3);
  const [published, setPublished] = useState<Record<string, boolean>>({ r2: true, r3: true });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">信息学院 — 教学管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">2025-2026 第二学期 · 李老师（教学秘书）</p>
        </div>
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => router.push('/admin/notifications')}
        >
          <Bell size={18} className="text-gray-600" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {notifCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 当前考试动态 ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">当前考试动态 <PBadge p="P0" /></h2>
        <div className="space-y-3">
          {/* Live */}
          <Card className="shadow-none border-2 border-green-200 bg-green-50/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">进行中</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{LIVE_EXAM.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {LIVE_EXAM.startTime} — {LIVE_EXAM.endTime.slice(11)} · {LIVE_EXAM.teacher}老师
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    参加班级：{LIVE_EXAM.classes.join('、')}（共 {LIVE_EXAM.total} 人）
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm flex items-center gap-1">
                      <FileText size={12} className="text-muted-foreground" />
                      已交卷：<strong>{LIVE_EXAM.submitted}</strong>/{LIVE_EXAM.total}
                    </span>
                    {LIVE_EXAM.anomalies > 0 && (
                      <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                        <AlertCircle size={12} /> 异常 {LIVE_EXAM.anomalies} 人
                      </span>
                    )}
                  </div>
                  <div className="mt-2 w-56">
                    <Progress value={Math.round(LIVE_EXAM.submitted / LIVE_EXAM.total * 100)} className="h-1.5" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" className="text-white text-xs gap-1" style={{ background: '#002045' }}
                    onClick={() => toast.info('考场实时监控（演示）')}>
                    <Play size={11} /> 查看监考状态
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => router.push('/admin/exam-students')}>
                    管理考生
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="shadow-none border border-blue-200 bg-blue-50/20">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 tracking-wide">即将开始（13天后）</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{UPCOMING_EXAM.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {UPCOMING_EXAM.startTime} — {UPCOMING_EXAM.endTime.slice(11)} · {UPCOMING_EXAM.teacher}老师
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    参加班级：{UPCOMING_EXAM.classes.join('、')}（共 {UPCOMING_EXAM.total} 人）
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 size={13} className="text-green-600" />
                    <span className="text-xs text-green-700 font-medium">试卷状态：已就绪</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => router.push('/admin/exams')}>
                    查看详情
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1"
                    onClick={() => toast.success('考试通知已发送给 180 名学生')}>
                    <Bell size={11} /> 发送考试通知
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 阅卷进度 ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">阅卷进度 <PBadge p="P1" /></h2>
        <div className="space-y-2">
          {GRADING_PROGRESS.map(item => (
            <Card key={item.id} className={cn('shadow-none border', item.progress < 100 && item.deadlineDays && item.deadlineDays <= 5 ? 'border-orange-200' : '')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.endDate} 已结束 · {item.teacher}老师</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-48">
                        <Progress value={item.progress} className={cn('h-1.5 flex-1', item.progress === 100 ? '[&>div]:bg-green-500' : '')} />
                        <span className={cn('text-xs font-semibold w-8',
                          item.progress === 100 ? 'text-green-600' : 'text-gray-700'
                        )}>{item.progress}%</span>
                      </div>
                      {item.pending > 0 && <span className="text-xs text-muted-foreground">待批改 {item.pending} 份</span>}
                      {item.deadlineDays !== null && item.progress < 100 && (
                        <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                          <AlertCircle size={11} /> 距截止还有 {item.deadlineDays} 天
                        </span>
                      )}
                      {item.progress === 100 && (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 size={12} /> 阅卷完成
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {item.progress < 100 ? (
                      <Button size="sm" variant="outline" className="text-xs gap-1"
                        onClick={() => toast.success(`已向${item.teacher}老师发送阅卷催促通知`)}>
                        <Bell size={11} /> 提醒老师 <PBadge p="P1" />
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="text-xs"
                          onClick={() => router.push('/admin/analysis')}>查看成绩</Button>
                        <Button size="sm" className="text-white text-xs" style={{ background: '#002045' }}
                          onClick={() => toast.success('成绩已发布，学生可查看')}>发布成绩</Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 最近成绩概览 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">最近成绩概览 <PBadge p="P0" /></h2>
          <button className="text-xs text-blue-600 flex items-center gap-0.5 hover:underline"
            onClick={() => router.push('/admin/analysis')}>
            查看详细分析 <ChevronRight size={12} />
          </button>
        </div>

        <Card className="shadow-none border">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  {['课程', '平均分', '及格率', '最低班级', '状态', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_SCORES.map(row => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50/40">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.title}</td>
                    <td className="px-4 py-3 text-gray-700">{row.avg}</td>
                    <td className={cn('px-4 py-3 font-semibold',
                      row.passRate < 70 ? 'text-red-600' : row.passRate < 85 ? 'text-yellow-600' : 'text-green-600'
                    )}>
                      {row.passRate}%
                      {row.alert && <AlertCircle size={11} className="inline ml-1 -mt-0.5" />}
                    </td>
                    <td className={cn('px-4 py-3 text-xs', row.alert ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                      {row.worstClass}
                    </td>
                    <td className="px-4 py-3">
                      {(published[row.id] ?? row.published)
                        ? <Badge className="text-xs bg-green-100 text-green-700 border-green-200">已发布</Badge>
                        : <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700">待发布</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!(published[row.id] ?? row.published) && (
                        <button className="text-xs text-blue-600 hover:underline mr-3"
                          onClick={() => { setPublished(p => ({ ...p, [row.id]: true })); toast.success('成绩已发布'); }}>
                          发布
                        </button>
                      )}
                      <button className="text-xs text-blue-600 hover:underline"
                        onClick={() => router.push('/admin/analysis')}>分析 →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <TrendingDown size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">
            <strong>⚠️ C语言程序设计</strong> 软工2202班及格率仅 58%，低于学院平均 17%。
            <button className="ml-1 underline" onClick={() => router.push('/admin/analysis')}>查看详情</button>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: '本学期考试', value: '8 场', sub: '2场进行中' },
            { label: '本院学生',   value: '1,240 人', sub: '5个专业' },
            { label: '待处理',     value: '5 件', sub: '3个申诉 · 2个缓考' },
          ].map(item => (
            <Card key={item.label} className="shadow-none border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
