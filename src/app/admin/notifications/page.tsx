'use client';

import { useState } from 'react';
import {
  Bell, Send, CheckCircle2, Clock, Users, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types & mock ──────────────────────────────────────────────────────────────

type NotifType = 'exam' | 'grading' | 'publish' | 'defer';

interface NotifRecord {
  id: string;
  type: NotifType;
  title: string;
  content: string;
  sentAt: string;
  target: string;
  sentCount: number;
  readCount: number;
}

const TYPE_CFG: Record<NotifType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  exam:    { label: '考试通知', color: 'text-blue-700', bg: 'bg-blue-50',   icon: <Bell size={12} /> },
  grading: { label: '阅卷提醒', color: 'text-orange-700', bg: 'bg-orange-50', icon: <Clock size={12} /> },
  publish: { label: '成绩发布', color: 'text-green-700', bg: 'bg-green-50',  icon: <CheckCircle2 size={12} /> },
  defer:   { label: '缓考通知', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: <User size={12} /> },
};

const HISTORY: NotifRecord[] = [
  {
    id: 'N001', type: 'exam',
    title: '考试通知 — 数据结构期末考试',
    content: '【考试通知】\n课程：数据结构\n时间：2026-03-28 09:00-11:00\n地点：第三教学楼 机房A/B/C\n时长：120分钟 | 总分：100分\n\n注意事项：\n1. 请提前15分钟到达考场\n2. 考试期间禁止使用手机\n3. 浏览器将进入全屏锁定模式\n\n发送范围：计科2201-2203、软工2201-2202（共320人）',
    sentAt: '2026-03-28 08:30', target: '320名学生', sentCount: 320, readCount: 285,
  },
  {
    id: 'N002', type: 'grading',
    title: '阅卷提醒 — 高等数学期末考试',
    content: '【阅卷提醒】\n张伟老师，您好：\n高等数学期末考试的阅卷进度目前为62%，\n距成绩提交截止日期还有4天（3月31日）。\n请尽快完成剩余的简答题和论述题批改。\n如需协助，请联系教务办公室。',
    sentAt: '2026-03-28 08:00', target: '张伟老师', sentCount: 1, readCount: 1,
  },
  {
    id: 'N003', type: 'defer',
    title: '缓考通知 — 张三（20220102）',
    content: '【缓考通知】\n张三同学，你好：\n你申请的数据结构期末考试缓考已通过。\n原因：突发疾病\n补考安排将另行通知，请保持关注。',
    sentAt: '2026-03-28 07:32', target: '张三 + 任课老师', sentCount: 2, readCount: 2,
  },
];

// Template generator
function genTemplate(type: NotifType): string {
  switch (type) {
    case 'exam':
      return '【考试通知】\n课程：数据结构\n时间：2026-03-28 09:00-11:00\n地点：第三教学楼 机房A/B/C\n时长：120分钟 | 总分：100分\n\n注意事项：\n1. 请提前15分钟到达考场\n2. 考试期间禁止使用手机\n3. 浏览器将进入全屏锁定模式\n\n发送范围：计科2201-2203、软工2201-2202（共320人）';
    case 'grading':
      return '【阅卷提醒】\n张伟老师，您好：\n高等数学期末考试的阅卷进度目前为62%，\n距成绩提交截止日期还有4天（3月31日）。\n请尽快完成剩余的简答题和论述题批改。\n如需协助，请联系教务办公室。';
    case 'publish':
      return '【成绩发布】\n同学你好：\n大学物理 期末考试成绩已发布。\n请登录智考云系统查看你的成绩详情和错题回顾。\n如对成绩有疑问，请在3月31日前联系学院教务办公室。';
    case 'defer':
      return '【缓考通知】\n同学，你好：\n你申请的考试缓考已通过。\n补考安排将另行通知，请保持关注。';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [history, setHistory] = useState<NotifRecord[]>(HISTORY);
  const [composeType, setComposeType] = useState<NotifType>('exam');
  const [composeContent, setComposeContent] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openCompose(type: NotifType) {
    setComposeType(type);
    setComposeContent(genTemplate(type));
  }

  function sendNotif() {
    const typeLabel = TYPE_CFG[composeType].label;
    const entry: NotifRecord = {
      id: `N${Date.now()}`, type: composeType,
      title: `${typeLabel} — ${new Date().toLocaleDateString('zh-CN')}`,
      content: composeContent,
      sentAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      target: composeType === 'grading' ? '老师' : '学生',
      sentCount: composeType === 'grading' ? 1 : 320,
      readCount: 0,
    };
    setHistory(prev => [entry, ...prev]);
    setPreviewOpen(false);
    setComposeContent('');
    toast.success(`${typeLabel}已发送`);
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">通知中心</h1>
        <p className="text-sm text-muted-foreground mt-0.5">发送通知 · 查看记录 · 阅读状态追踪</p>
      </div>

      {/* Quick compose buttons */}
      <Card className="shadow-none border">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">快速发送</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TYPE_CFG) as NotifType[]).map(type => {
              const cfg = TYPE_CFG[type];
              return (
                <button
                  key={type}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors hover:border-gray-400',
                    cfg.bg, cfg.color, 'border-current/20'
                  )}
                  onClick={() => openCompose(type)}
                >
                  {cfg.icon}
                  {cfg.label}
                  <span className="ml-auto text-xs opacity-60">点击编辑 →</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compose area */}
      {composeContent && (
        <Card className="shadow-none border-2 border-blue-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn('text-xs', TYPE_CFG[composeType].bg, TYPE_CFG[composeType].color)}>
                  {TYPE_CFG[composeType].label}
                </Badge>
                <span className="text-sm font-medium text-gray-700">编辑通知内容</span>
              </div>
              <button className="text-xs text-muted-foreground hover:text-gray-700"
                onClick={() => setComposeContent('')}>
                取消 ×
              </button>
            </div>
            <Textarea
              rows={8}
              className="text-sm font-mono leading-relaxed"
              value={composeContent}
              onChange={e => setComposeContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="text-xs"
                onClick={() => setPreviewOpen(true)}>
                预览
              </Button>
              <Button size="sm" className="text-white text-xs gap-1" style={{ background: '#002045' }}
                onClick={sendNotif}>
                <Send size={12} /> 发送
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">通知记录</h2>
        <div className="space-y-2">
          {history.map(n => {
            const cfg = TYPE_CFG[n.type];
            const isExpanded = expandedId === n.id;
            const readPct = n.sentCount > 0 ? Math.round(n.readCount / n.sentCount * 100) : 0;
            return (
              <Card key={n.id} className="shadow-none border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>
                          <span className="flex items-center gap-1">{cfg.icon}{cfg.label}</span>
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 truncate">{n.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={11} />{n.sentAt}</span>
                        <span className="flex items-center gap-1"><Users size={11} />{n.target}</span>
                        <span className={cn(
                          readPct === 100 ? 'text-green-600' : 'text-yellow-600'
                        )}>
                          已读 {n.readCount}/{n.sentCount}（{readPct}%）
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2.5">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{n.content}</pre>
                        </div>
                      )}
                    </div>

                    <button
                      className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-gray-700 flex-shrink-0"
                      onClick={() => setExpandedId(isExpanded ? null : n.id)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-xs', TYPE_CFG[composeType].bg, TYPE_CFG[composeType].color)}>
                {TYPE_CFG[composeType].label}
              </Badge>
              预览通知
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 rounded-lg px-4 py-3 max-h-80 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{composeContent}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>返回编辑</Button>
            <Button size="sm" className="text-white gap-1" style={{ background: '#002045' }} onClick={sendNotif}>
              <Send size={13} /> 确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
