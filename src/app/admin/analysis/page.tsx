'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Download, ChevronRight, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PBadge } from '@/components/ui/pbadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';

// ── Mock data ─────────────────────────────────────────────────────────────────

const EXAMS = [
  { id: 'E001', label: '数据结构 期末考试' },
  { id: 'E002', label: '计算机网络 期末考试' },
  { id: 'E006', label: 'C语言程序设计 期末考试' },
];

const CLASS_DATA = [
  { name: '计科2201', avg: 78.2, passRate: 92, alert: false },
  { name: '软工2201', avg: 75.1, passRate: 88, alert: false },
  { name: '计科2202', avg: 71.8, passRate: 82, alert: false },
  { name: '计科2203', avg: 68.3, passRate: 75, alert: false },
  { name: '软工2202', avg: 62.1, passRate: 58, alert: true  },
];

const KPI = { avg: 72.5, passRate: 82, max: 98, min: 35 };

const KNOWLEDGE_POINTS = ['栈与队列', '二叉树', '图论', '排序算法', '查找算法'];
const HEATMAP_DATA: Record<string, Record<string, number>> = {
  '计科2201': { '栈与队列': 85, '二叉树': 82, '图论': 78, '排序算法': 72, '查找算法': 80 },
  '计科2202': { '栈与队列': 80, '二叉树': 75, '图论': 70, '排序算法': 62, '查找算法': 78 },
  '计科2203': { '栈与队列': 78, '二叉树': 72, '图论': 65, '排序算法': 58, '查找算法': 75 },
  '软工2201': { '栈与队列': 82, '二叉树': 78, '图论': 72, '排序算法': 65, '查找算法': 76 },
  '软工2202': { '栈与队列': 70, '二叉树': 55, '图论': 48, '排序算法': 42, '查找算法': 65 },
  '学院':     { '栈与队列': 79, '二叉树': 72, '图论': 67, '排序算法': 60, '查找算法': 75 },
};

const TEACHER_DATA = [
  { name: '李明华', title: '副教授', questionCount: 45, examCount: 2, pendingGrade: 355, doneCount: 1 },
  { name: '王建国', title: '讲师',   questionCount: 32, examCount: 1, pendingGrade: 0,   doneCount: 1 },
  { name: '张伟',   title: '讲师',   questionCount: 28, examCount: 1, pendingGrade: 0,   doneCount: 0 },
  { name: '陈芳',   title: '教授',   questionCount: 51, examCount: 2, pendingGrade: 0,   doneCount: 2 },
];

const TREND_DATA = [
  { semester: '22春', avg: 65.2 },
  { semester: '22秋', avg: 68.4 },
  { semester: '23春', avg: 70.1 },
  { semester: '23秋', avg: 71.8 },
  { semester: '24春', avg: 73.5 },
  { semester: '24秋', avg: 77.3 },
];

const DRILL_STUDENTS = [
  { id: '20220101', name: '王五',  score: 92, rank: 1,  grade: '优秀'  },
  { id: '20220102', name: '张三',  score: 85, rank: 2,  grade: '良好'  },
  { id: '20220103', name: '李四',  score: 78, rank: 3,  grade: '良好'  },
  { id: '20220104', name: '赵六',  score: 55, rank: 18, grade: '不及格' },
  { id: '20220105', name: '钱七',  score: 61, rank: 14, grade: '及格'  },
];

function heatColor(val: number) {
  if (val >= 80) return 'bg-green-100 text-green-800';
  if (val >= 60) return 'bg-blue-100 text-blue-800';
  if (val >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700 font-semibold';
}

function gradeStyle(g: string) {
  if (g === '优秀')  return 'text-green-700 bg-green-50';
  if (g === '良好')  return 'text-blue-700 bg-blue-50';
  if (g === '及格')  return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
}

// ── Component ─────────────────────────────────────────────────────────────────

type AnalysisTab = 'class' | 'knowledge' | 'teacher' | 'trend';

export default function AdminAnalysisPage() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState('E001');
  const [tab, setTab] = useState<AnalysisTab>('class');
  const [drillClass, setDrillClass] = useState<string | null>(null);

  const classes = Object.keys(HEATMAP_DATA).filter(k => k !== '学院');

  const TABS: { key: AnalysisTab; label: string }[] = [
    { key: 'class',     label: '班级对比' },
    { key: 'knowledge', label: '知识点分析' },
    { key: 'teacher',   label: '教师工作量' },
    { key: 'trend',     label: '历史趋势' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">成绩分析</h1>
          <p className="text-sm text-muted-foreground mt-0.5">信息学院 · 本学期教学质量数据</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedExam} onValueChange={(v) => v && setSelectedExam(v)}>
            <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXAMS.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="text-xs gap-1"
            onClick={() => toast.info('导出功能（演示）')}>
            <Download size={12} /> 导出 ▾ <PBadge p="P0" />
          </Button>
        </div>
      </div>

      {/* KPIs — always visible */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '学院平均分', value: KPI.avg,     unit: '分', color: 'text-gray-900' },
          { label: '及格率',     value: KPI.passRate, unit: '%', color: 'text-green-600' },
          { label: '最高分',     value: KPI.max,      unit: '分', color: 'text-blue-600' },
          { label: '最低分',     value: KPI.min,      unit: '分', color: 'text-red-500' },
        ].map(item => (
          <Card key={item.label} className="shadow-none border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn('text-2xl font-bold mt-1', item.color)}>
                {item.value}<span className="text-sm font-normal ml-0.5 text-muted-foreground">{item.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setDrillClass(null); }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-muted-foreground hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: 班级对比 ── */}
      {tab === 'class' && (
        <div className="space-y-4">
          {/* Breadcrumb for drill-down */}
          {drillClass && (
            <div className="flex items-center gap-1 text-xs">
              <button className="text-muted-foreground hover:text-gray-700" onClick={() => setDrillClass(null)}>信息学院</button>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className="font-medium text-gray-900">{drillClass}</span>
              <button className="ml-2 text-blue-600 hover:underline" onClick={() => setDrillClass(null)}>← 返回</button>
            </div>
          )}

          {!drillClass ? (
            <Card className="shadow-none border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">班级对比 <PBadge p="P0" /></h3>
                  <p className="text-xs text-muted-foreground">点击班级名查看学生明细</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={CLASS_DATA} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val, name) => [`${val}${name === 'avg' ? '分' : '%'}`, name === 'avg' ? '平均分' : '及格率']} />
                    <ReferenceLine y={KPI.avg} stroke="#94a3b8" strokeDasharray="3 3"
                      label={{ value: '学院均线', fontSize: 10, position: 'right' }} />
                    <Bar dataKey="avg" name="平均分" fill="#002045" radius={[3, 3, 0, 0]}
                      onClick={(data) => setDrillClass(data.name ?? null)} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-3 space-y-1.5">
                  {CLASS_DATA.map(c => (
                    <div key={c.name} className="flex items-center gap-3">
                      <button className="text-xs font-medium text-blue-600 hover:underline w-20 text-left"
                        onClick={() => setDrillClass(c.name)}>{c.name}</button>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', c.alert ? 'bg-red-400' : 'bg-blue-500')}
                          style={{ width: `${c.avg}%` }} />
                      </div>
                      <span className="text-xs text-gray-700 w-10 text-right font-medium">{c.avg}</span>
                      <span className={cn('text-xs w-20 text-right',
                        c.passRate < 70 ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>
                        及格 {c.passRate}%{c.alert && <AlertCircle size={10} className="inline ml-0.5" />}
                      </span>
                    </div>
                  ))}
                </div>

                {CLASS_DATA.some(c => c.alert) && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle size={13} className="text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      <strong>软工2202</strong> 及格率 58%，显著低于学院平均（{KPI.passRate}%）
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Drill-down: student detail */
            <Card className="shadow-none border-2 border-blue-200">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{drillClass} — 学生成绩明细</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {['学号', '姓名', '总分', '排名', '等级', ''].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DRILL_STUDENTS.map(s => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50/40">
                        <td className="px-2 py-2 text-muted-foreground">{s.id}</td>
                        <td className="px-2 py-2 font-medium text-gray-900">{s.name}</td>
                        <td className="px-2 py-2 font-semibold">{s.score}</td>
                        <td className="px-2 py-2 text-gray-700">第 {s.rank} 名</td>
                        <td className="px-2 py-2">
                          <Badge variant="secondary" className={cn('text-xs', gradeStyle(s.grade))}>{s.grade}</Badge>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button className="text-blue-600 hover:underline text-xs"
                            onClick={() => router.push('/admin/appeals')}>复核</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: 知识点分析 ── */}
      {tab === 'knowledge' && (
        <Card className="shadow-none border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">知识点得分率热力图 <PBadge p="P2" /></h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {[{ c: 'bg-green-100', l: '≥80' }, { c: 'bg-blue-100', l: '60-79' },
                  { c: 'bg-yellow-100', l: '50-59' }, { c: 'bg-red-100', l: '<50' }].map(x => (
                  <span key={x.l} className="flex items-center gap-1">
                    <span className={cn('w-3 h-3 rounded-sm', x.c)} /> {x.l}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-24">知识点 \ 班级</th>
                    {[...classes, '学院'].map(c => (
                      <th key={c} className={cn('text-center py-2 px-2 font-medium',
                        c === '学院' ? 'text-gray-500 border-l' : 'text-gray-700')}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KNOWLEDGE_POINTS.map(kp => (
                    <tr key={kp} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-800">{kp}</td>
                      {[...classes, '学院'].map(c => {
                        const val = HEATMAP_DATA[c]?.[kp] ?? 0;
                        return (
                          <td key={c} className={cn('text-center py-1.5 px-2', c === '学院' ? 'border-l' : '')}>
                            <span className={cn('px-2 py-0.5 rounded', heatColor(val))}>{val}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                软工2202班在「排序算法」（42）和「图论」（48）知识点得分率显著低于其他班级，建议针对性加强辅导。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: 教师工作量 ── */}
      {tab === 'teacher' && (
        <Card className="shadow-none border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">教师工作量 — 2025-2026 第二学期 <PBadge p="P2" /></h3>
              <Button size="sm" variant="outline" className="text-xs gap-1"
                onClick={() => toast.info('导出Excel（演示）')}>
                <Download size={11} /> 导出Excel <PBadge p="P0" />
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  {['教师', '职称', '出题数', '本学期考试', '待批改', '已完成', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEACHER_DATA.map(t => (
                  <tr key={t.name} className="border-b last:border-0 hover:bg-gray-50/40">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{t.name}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{t.title}</td>
                    <td className="px-3 py-2.5 text-gray-700">{t.questionCount} 题</td>
                    <td className="px-3 py-2.5 text-gray-700">{t.examCount} 场</td>
                    <td className={cn('px-3 py-2.5', t.pendingGrade > 0 ? 'text-orange-600 font-medium' : 'text-gray-500')}>
                      {t.pendingGrade > 0 ? `${t.pendingGrade} 份` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{t.doneCount} 场</td>
                    <td className="px-3 py-2.5 text-right">
                      {t.pendingGrade > 0 && (
                        <button className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                          onClick={() => toast.success(`已向${t.name}老师发送阅卷催促`)}>
                          <Bell size={11} /> 催促 <PBadge p="P2" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: 历史趋势 ── */}
      {tab === 'trend' && (
        <Card className="shadow-none border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">历史趋势（同课程跨学期）<PBadge p="P2" /></h3>
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-50">近三年 +12.1分 ↑</Badge>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                <YAxis domain={[55, 85]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val}分`, '平均分']} />
                <Line type="monotone" dataKey="avg" stroke="#002045" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#002045' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              数据结构平均分近三年稳步提升（+12.1分），教学效果持续改善
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: '最高学期', value: '24秋', sub: '77.3分' },
                { label: '最低学期', value: '22春', sub: '65.2分' },
                { label: '近两年增幅', value: '+7.2分', sub: '23秋→24秋' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
