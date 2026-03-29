'use client';

import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, Play, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PBadge } from '@/components/ui/pbadge';
import { cn } from '@/lib/utils';

const EXAMS = [
  {
    id: 'E001', title: '数据结构 期末考试', teacher: '李明华', subject: '数据结构',
    startTime: '2026-03-28 09:00', endTime: '2026-03-28 11:00',
    classes: '计科2201-2203、软工2201-2202', studentCount: 320,
    status: 'ongoing' as const,
  },
  {
    id: 'E002', title: '计算机网络 期末考试', teacher: '王建国', subject: '计算机网络',
    startTime: '2026-04-10 14:00', endTime: '2026-04-10 16:00',
    classes: '计科2201-2203', studentCount: 180,
    status: 'pending' as const,
  },
  {
    id: 'E003', title: '高等数学 期末考试', teacher: '张伟', subject: '高等数学',
    startTime: '2026-03-25 14:00', endTime: '2026-03-25 16:00',
    classes: '全院各班', studentCount: 580,
    status: 'grading' as const,
  },
  {
    id: 'E004', title: '大学物理 期末考试', teacher: '陈芳', subject: '大学物理',
    startTime: '2026-03-24 09:00', endTime: '2026-03-24 11:00',
    classes: '计科2201-2203', studentCount: 210,
    status: 'finished' as const,
  },
];

const STATUS_CFG = {
  ongoing:  { label: '进行中', color: 'text-green-700', bg: 'bg-green-100', icon: <Play size={11} className="text-green-600" /> },
  pending:  { label: '待开始', color: 'text-blue-700',  bg: 'bg-blue-100',  icon: <Clock size={11} className="text-blue-600" /> },
  grading:  { label: '阅卷中', color: 'text-orange-700', bg: 'bg-orange-100', icon: <AlertCircle size={11} className="text-orange-600" /> },
  finished: { label: '已完成', color: 'text-gray-600',  bg: 'bg-gray-100',  icon: <CheckCircle2 size={11} className="text-gray-500" /> },
};

export default function AdminExamsPage() {
  const router = useRouter();
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">考试管理 <PBadge p="P0" /></h1>
        <p className="text-sm text-muted-foreground mt-0.5">信息学院 · 本学期所有考试</p>
      </div>
      <div className="space-y-3">
        {EXAMS.map(exam => {
          const cfg = STATUS_CFG[exam.status];
          return (
            <Card key={exam.id} className="shadow-none border hover:border-gray-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                      <Badge variant="secondary" className={cn('text-xs flex items-center gap-1', cfg.bg, cfg.color)}>
                        {cfg.icon}{cfg.label}
                      </Badge>
                      {exam.status === 'grading' && <PBadge p="P1" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {exam.teacher}老师 · {exam.startTime} — {exam.endTime.slice(11)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.classes} · 共 {exam.studentCount} 人
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs gap-1 flex-shrink-0"
                    onClick={() => router.push(`/admin/exams/${exam.id}`)}>
                    查看详情 <ChevronRight size={11} />
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
