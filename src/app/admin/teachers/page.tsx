'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TEACHERS = [
  {
    name: '李明华', title: '副教授', subject: '数据结构',
    questionCount: 45, examCount: 2, pendingGrade: 355, doneCount: 1,
    avgScore: 72.5, passRate: 82,
  },
  {
    name: '王建国', title: '讲师', subject: '计算机网络',
    questionCount: 32, examCount: 1, pendingGrade: 0, doneCount: 1,
    avgScore: 78.3, passRate: 90,
  },
  {
    name: '张伟', title: '讲师', subject: '高等数学',
    questionCount: 28, examCount: 1, pendingGrade: 0, doneCount: 0,
    avgScore: null, passRate: null,
  },
  {
    name: '陈芳', title: '教授', subject: '大学物理',
    questionCount: 51, examCount: 2, pendingGrade: 0, doneCount: 2,
    avgScore: 75.1, passRate: 88,
  },
];

export default function TeachersPage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">教师工作量</h1>
        <p className="text-sm text-muted-foreground mt-0.5">信息学院 · 本学期出题与阅卷统计</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        {[
          { label: '本院教师', value: TEACHERS.length },
          { label: '合计出题', value: TEACHERS.reduce((s, t) => s + t.questionCount, 0) },
          { label: '待批改份数', value: TEACHERS.reduce((s, t) => s + t.pendingGrade, 0) },
          { label: '已完成场次', value: TEACHERS.reduce((s, t) => s + t.doneCount, 0) },
        ].map(item => (
          <Card key={item.label} className="shadow-none border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {TEACHERS.map(t => (
          <Card key={t.name} className="shadow-none border hover:border-gray-300 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{t.name}</span>
                    <Badge variant="secondary" className="text-xs">{t.title}</Badge>
                    <span className="text-xs text-muted-foreground">{t.subject}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">出题数</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{t.questionCount} 题</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">本学期考试</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{t.examCount} 场</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">待批改</p>
                      <p className={cn('font-semibold mt-0.5', t.pendingGrade > 0 ? 'text-orange-600' : 'text-gray-500')}>
                        {t.pendingGrade > 0 ? `${t.pendingGrade} 份` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">班级平均分</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {t.avgScore !== null ? `${t.avgScore}` : '待阅卷'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {t.pendingGrade > 0 && (
                    <Button size="sm" variant="outline" className="text-xs"
                      onClick={() => toast.success(`已向${t.name}老师发送阅卷催促`)}>
                      催促阅卷
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs text-blue-600"
                    onClick={() => router.push('/admin/analysis')}>
                    查看分析 →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
