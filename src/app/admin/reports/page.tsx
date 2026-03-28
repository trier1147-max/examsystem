'use client';

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Cell,
} from 'recharts';
import { mockCollegeStats, mockExams } from '@/mock/data';
import { toast } from 'sonner';

const COLORS = ['#002045', '#003575', '#1a365d', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function ReportsPage() {
  const [college, setCollege] = useState('all');
  const [subject, setSubject] = useState('all');
  const [dateRange, setDateRange] = useState('semester');

  const filteredStats = mockCollegeStats.filter(
    (s) => college === 'all' || s.college === college
  );

  const semesterStart = new Date('2026-02-01');
  const yearStart = new Date('2025-09-01');

  const filteredExams = mockExams.filter((e) => {
    const matchSubject = subject === 'all' || e.subject === subject;
    const matchCollege = college === 'all' || e.college === college;
    const t = new Date(e.startTime);
    const matchDate =
      dateRange === 'semester' ? t >= semesterStart :
      dateRange === 'year' ? t >= yearStart :
      true;
    return matchSubject && matchCollege && matchDate;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">统计报表</h1>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => toast.success('报表导出成功，请查收文件')}
        >
          <Download size={15} />
          导出报表
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-none border">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">筛选条件：</span>
          </div>
          <Select value={college} onValueChange={(v) => setCollege(v ?? 'all')}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="学院" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学院</SelectItem>
              {mockCollegeStats.map((s) => (
                <SelectItem key={s.college} value={s.college}>
                  {s.college}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={(v) => setSubject(v ?? 'all')}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="学科" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学科</SelectItem>
              <SelectItem value="数据结构">数据结构</SelectItem>
              <SelectItem value="计算机网络">计算机网络</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v ?? 'all')}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semester">本学期</SelectItem>
              <SelectItem value="year">本学年</SelectItem>
              <SelectItem value="all">全部时间</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            共 {filteredStats.length} 个学院，{filteredExams.length} 场考试
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pass rate comparison chart */}
        <Card className="shadow-none border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">各学院通过率对比</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={filteredStats}
                margin={{ top: 5, right: 10, left: -20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="college"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[80, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [`${v}%`, '通过率']} />
                <Bar dataKey="passRate" radius={[4, 4, 0, 0]} name="通过率">
                  {filteredStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student count chart */}
        <Card className="shadow-none border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">各学院参考人数</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={filteredStats}
                margin={{ top: 5, right: 10, left: -20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="college"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [`${v}人`, '人数']} />
                <Bar dataKey="studentCount" fill="#006c4a" radius={[4, 4, 0, 0]} name="参考人数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card className="shadow-none border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">学院详细数据</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">学院</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">考试场次</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">参考人次</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">平均分</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">通过率</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat) => (
                <tr key={stat.college} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{stat.college}</td>
                  <td className="py-3 px-4 text-muted-foreground">{stat.examCount}</td>
                  <td className="py-3 px-4 text-muted-foreground">{stat.studentCount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className="font-semibold"
                      style={{ color: stat.avgScore >= 80 ? '#16a34a' : '#002045' }}
                    >
                      {stat.avgScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${stat.passRate}%`,
                            background: stat.passRate >= 90 ? '#16a34a' : '#d97706',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">{stat.passRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Exam list */}
      <Card className="shadow-none border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">考试列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">考试名称</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">学科</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">班级</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">开始时间</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">时长</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map((exam) => {
                const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                  ongoing: { label: '进行中', color: '#16a34a', bg: '#dcfce7' },
                  pending: { label: '未开始', color: '#2563eb', bg: '#dbeafe' },
                  grading: { label: '阅卷中', color: '#d97706', bg: '#fef9c3' },
                  finished: { label: '已结束', color: '#6b7280', bg: '#f3f4f6' },
                };
                const s = statusMap[exam.status];
                return (
                  <tr key={exam.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 px-4 font-medium">{exam.title}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.subject}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.class}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.startTime}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.duration}分钟</td>
                    <td className="py-2.5 px-4">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
