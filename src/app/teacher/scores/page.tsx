'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockSubmissions, mockExams } from '@/mock/data';
import { toast } from 'sonner';

const scoreRanges = [
  { range: '0-59', min: 0, max: 59, label: '不及格' },
  { range: '60-69', min: 60, max: 69, label: '及格' },
  { range: '70-79', min: 70, max: 79, label: '中等' },
  { range: '80-89', min: 80, max: 89, label: '良好' },
  { range: '90-100', min: 90, max: 100, label: '优秀' },
];

export default function ScoresPage() {
  const [selectedExamId, setSelectedExamId] = useState('all');

  const gradedSubmissions = mockSubmissions.filter(
    (s) =>
      s.status === 'graded' &&
      (selectedExamId === 'all' || s.examId === selectedExamId)
  );

  const distributionData = scoreRanges.map((r) => ({
    range: r.range,
    count: gradedSubmissions.filter((s) => s.score >= r.min && s.score <= r.max).length,
    label: r.label,
  }));

  const avg = gradedSubmissions.length
    ? Math.round(gradedSubmissions.reduce((s, sub) => s + sub.score, 0) / gradedSubmissions.length)
    : 0;

  const passCount = gradedSubmissions.filter((s) => s.score >= 60).length;
  const passRate = gradedSubmissions.length
    ? Math.round((passCount / gradedSubmissions.length) * 100)
    : 0;

  const maxScore = gradedSubmissions.length
    ? Math.max(...gradedSubmissions.map((s) => s.score))
    : 0;

  const handleExport = () => {
    toast.success('成绩报表导出成功，请查收文件');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">成绩管理</h1>
        <Button variant="outline" className="gap-1.5" onClick={handleExport}>
          <Download size={15} />
          导出报表
        </Button>
      </div>

      {/* Exam selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">选择考试：</span>
        <Select value={selectedExamId} onValueChange={(v) => setSelectedExamId(v ?? 'all')}>
          <SelectTrigger className="h-8 w-56 text-sm">
            <SelectValue placeholder="全部考试" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部考试</SelectItem>
            {mockExams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">共 {gradedSubmissions.length} 份已批阅试卷</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '参考人数', value: gradedSubmissions.length, unit: '人' },
          { label: '平均分', value: avg, unit: '分' },
          { label: '通过率', value: passRate, unit: '%' },
          { label: '最高分', value: maxScore, unit: '分' },
        ].map(({ label, value, unit }) => (
          <Card key={label} className="shadow-none border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: '#002045' }}>
                {value}
                <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="shadow-none border lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">分数段分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${v}人`, '人数']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#002045" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score table */}
        <Card className="shadow-none border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">成绩明细</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[280px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">姓名</th>
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">班级</th>
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">考试</th>
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">得分</th>
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">等级</th>
                </tr>
              </thead>
              <tbody>
                {gradedSubmissions.map((sub) => {
                  const grade =
                    sub.score >= 90
                      ? '优秀'
                      : sub.score >= 80
                      ? '良好'
                      : sub.score >= 70
                      ? '中等'
                      : sub.score >= 60
                      ? '及格'
                      : '不及格';
                  const gradeColor =
                    sub.score >= 80
                      ? 'bg-green-100 text-green-700'
                      : sub.score >= 60
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700';
                  return (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-medium">{sub.studentName}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-xs">{sub.class}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-xs max-w-[120px] truncate">
                        {sub.examTitle}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`font-bold ${sub.score >= 60 ? 'text-gray-900' : 'text-red-500'}`}>
                          {sub.score}
                        </span>
                        <span className="text-xs text-muted-foreground">/{sub.totalScore}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge className={`text-xs ${gradeColor} border-0`}>{grade}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
