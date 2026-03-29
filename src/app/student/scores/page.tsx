'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Trophy, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PBadge } from '@/components/ui/pbadge';
import { mockStudentScores } from '@/mock/data';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

// Mock: exam IDs for recently published scores (within 3 days)
const RECENTLY_PUBLISHED_EXAM_IDS = new Set(['E004']);

// ── Helpers ──────────────────────────────────────────────────────────────────

function gradeLabel(pct: number): { label: string; color: string; dot: string } {
  if (pct >= 90) return { label: '优秀', color: 'text-green-600',  dot: '🟢' };
  if (pct >= 75) return { label: '良好', color: 'text-blue-600',   dot: '🔵' };
  if (pct >= 60) return { label: '及格', color: 'text-yellow-600', dot: '🟡' };
  return         { label: '不及格', color: 'text-red-600',       dot: '🔴' };
}

const SEMESTERS = ['2025-2026 第二学期', '2025-2026 第一学期', '全部'];

// For demo purposes, assign semesters based on date
function getSemester(submitTime: string) {
  const d = new Date(submitTime);
  return d >= new Date('2026-02-01') ? SEMESTERS[0] : SEMESTERS[1];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StudentScoresPage() {
  const { currentUser } = useStore();
  const [semester, setSemester] = useState(SEMESTERS[1]);

  const filtered = semester === '全部'
    ? mockStudentScores
    : mockStudentScores.filter(r => getSemester(r.submitTime) === semester);

  const avgPct = filtered.length
    ? Math.round(filtered.reduce((s, r) => s + (r.score / r.totalScore) * 100, 0) / filtered.length)
    : 0;
  const maxPct = filtered.length
    ? Math.max(...filtered.map(r => Math.round((r.score / r.totalScore) * 100)))
    : 0;
  const minPct = filtered.length
    ? Math.min(...filtered.map(r => Math.round((r.score / r.totalScore) * 100)))
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">成绩查询 <PBadge p="P0" /></h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.name} · {currentUser?.class}
          </p>
        </div>
        <Select value={semester} onValueChange={v => v && setSemester(v)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue>{semester}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SEMESTERS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '平均分', value: `${avgPct} 分`, icon: TrendingUp, color: '#002045', bg: '#eef2ff' },
            { label: '最高分', value: `${maxPct} 分`, icon: Trophy,     color: '#16a34a', bg: '#dcfce7' },
            { label: '最低分', value: `${minPct} 分`, icon: Medal,      color: '#d97706', bg: '#fef9c3' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-none border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Score cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-14 text-center">
          <Trophy size={28} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">暂无考试记录</p>
          <p className="text-xs text-muted-foreground/60 mt-1">完成考试后，成绩将在这里显示</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const pct = Math.round((record.score / record.totalScore) * 100);
            const grade = gradeLabel(pct);
            return (
              <Card key={record.id} className="shadow-none border hover:border-gray-300 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 truncate">{record.examTitle}</p>
                        {RECENTLY_PUBLISHED_EXAM_IDS.has(record.examId) && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500 text-white flex-shrink-0">
                            新
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {record.submitTime.split(' ')[0]} · 排名 {record.rank}/{record.classSize} · {record.subject}
                      </p>
                    </div>
                    <span className={cn('text-xs font-semibold flex-shrink-0', grade.color)}>
                      {grade.dot} {grade.label}
                    </span>
                  </div>

                  {/* Score + progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {record.score}
                        <span className="text-sm font-normal text-muted-foreground">/{record.totalScore}</span>
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 90 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 60 ? '#d97706' : '#dc2626',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href={`/student/scores/${record.examId}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground hover:text-gray-900">
                        查看详情 <ChevronRight size={13} />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
