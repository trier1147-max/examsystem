'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Send, Flag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { mockExamPaper, type Question } from '@/mock/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DURATION_SECONDS = 120 * 60;

// Per-exam anti-cheat config (in real system, fetched from server)
const EXAM_ANTI_CHEAT: Record<string, string[]> = {
  default: [
    '考试期间浏览器将进入全屏模式',
    '禁止切换到其他页面或应用程序，离开 3 次将自动交卷',
    '考试结束时间到将自动提交试卷',
    '答案每 60 秒自动保存，断网后恢复不丢失',
  ],
  E001: [
    '考试期间浏览器将进入全屏模式',
    '禁止切换到其他页面或应用程序，离开 3 次将自动交卷',
    '禁止复制、粘贴操作（Ctrl+C / Ctrl+V）',
    '禁止使用开发者工具（F12）',
    '考试结束时间到将自动提交试卷',
    '监考老师可随时终止你的考试并强制收卷',
    '答案每 60 秒自动保存，断网后恢复不丢失',
  ],
};

const typeLabel: Record<string, string> = {
  choice: '选择题',
  fill: '填空题',
  short: '简答题',
  essay: '论述题',
  tf: '判断题',
  attachment: '附件题',
};

const sectionRoman: Record<string, string> = {
  choice: '一',
  tf: '二',
  fill: '三',
  short: '四',
  essay: '五',
  attachment: '六',
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentAnswers, currentQuestionIndex, setAnswer, setQuestionIndex, clearAnswers } = useStore();

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [forceCollectOpen, setForceCollectOpen] = useState(false);

  // Demo: trigger force-collect after 45 seconds of exam time
  useEffect(() => {
    if (!started || submitted) return;
    const timer = setTimeout(() => {
      if (!submitted) setForceCollectOpen(true);
    }, 45000);
    return () => clearTimeout(timer);
  }, [started, submitted]);

  const questions: Question[] = mockExamPaper;
  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(currentAnswers).filter(id => questions.some(q => q.id === id)).length;
  const unansweredCount = questions.length - answeredCount;

  // Group questions by type for section display
  const questionGroups: { type: string; label: string; start: number; end: number }[] = [];
  let prevType = '';
  let groupStart = 0;
  questions.forEach((q, i) => {
    if (q.type !== prevType) {
      if (i > 0) questionGroups.push({ type: prevType, label: typeLabel[prevType], start: groupStart, end: i - 1 });
      prevType = q.type;
      groupStart = i;
    }
    if (i === questions.length - 1) questionGroups.push({ type: q.type, label: typeLabel[q.type], start: groupStart, end: i });
  });

  const currentSectionGroup = questionGroups.find(g => currentQuestionIndex >= g.start && currentQuestionIndex <= g.end);

  const handleSubmitConfirm = useCallback(() => {
    setSubmitted(true);
    setSubmitDialogOpen(false);
    clearAnswers();
    toast.success('试卷已提交，等待批改');
    router.push('/student');
  }, [clearAnswers, router]);

  // Countdown timer (only after started)
  useEffect(() => {
    if (!started || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmitConfirm(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, handleSubmitConfirm]);

  // Anti-cheat: visibilitychange
  useEffect(() => {
    if (!started) return;
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        setViolations(v => {
          const next = v + 1;
          if (next >= 3) {
            toast.error('多次离开考试页面，系统自动交卷！');
            handleSubmitConfirm();
          } else {
            toast.warning(`检测到离开考试页面（第 ${next} 次），再离开 ${3 - next} 次将自动交卷！`);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [started, submitted, handleSubmitConfirm]);

  // Anti-cheat: disable right-click, copy, keyboard shortcuts
  useEffect(() => {
    if (!started) return;
    const noCtx = (e: MouseEvent) => e.preventDefault();
    const noKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'u'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    document.addEventListener('contextmenu', noCtx);
    document.addEventListener('keydown', noKey);
    return () => {
      document.removeEventListener('contextmenu', noCtx);
      document.removeEventListener('keydown', noKey);
    };
  }, [started]);

  // Fullscreen on confirm start
  function handleConfirmStart() {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setStarted(true);
  }

  useEffect(() => {
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  function toggleMark(id: string) {
    setMarkedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const unansweredNums = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !currentAnswers[q.id])
    .map(({ i }) => i + 1);

  if (!examId) return null;

  return (
    <div className={cn('min-h-screen bg-gray-50 flex flex-col', started ? 'pb-[130px]' : '')}>
      {/* Anti-cheat banner */}
      <div
        className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium"
        style={{ background: violations > 0 ? '#fee2e2' : '#fef3c7', color: violations > 0 ? '#991b1b' : '#92400e' }}
      >
        <AlertTriangle size={13} />
        考试进行中，请诚信作答。禁止切换窗口，系统将记录异常行为。
        {violations > 0 && <span className="ml-1 font-bold">（已记录 {violations} 次违规）</span>}
      </div>

      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <h1 className="font-bold text-sm flex-1 truncate">数据结构期中考试</h1>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm',
            !started ? 'bg-gray-100 text-gray-400' :
            timeLeft < 300 ? 'bg-red-100 text-red-600' :
            timeLeft < 900 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          )}>
            <Clock size={14} />
            {started ? formatTime(timeLeft) : formatTime(DURATION_SECONDS)}
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-white"
            style={{ background: '#002045' }}
            onClick={() => setSubmitDialogOpen(true)}
            disabled={submitted || !started}
          >
            <Send size={14} /> 交卷
          </Button>
        </div>
      </header>

      {/* Question area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-5">
        <div className="bg-white rounded-xl border p-6">
          {/* Section + question info */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs text-muted-foreground">
                {currentSectionGroup && `${sectionRoman[currentQ?.type]}、${typeLabel[currentQ?.type]}`}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">{currentQ?.score} 分</span>
              <button
                onClick={() => currentQ && toggleMark(currentQ.id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                  currentQ && markedIds.has(currentQ.id)
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                )}
              >
                <Flag size={12} />
                {currentQ && markedIds.has(currentQ.id) ? '已标记' : '标记本题'}
              </button>
            </div>
          </div>

          {/* Question content */}
          {currentQ && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed font-medium text-gray-900">
                {currentQuestionIndex + 1}. {currentQ.content}
              </p>

              {currentQ.type === 'choice' && currentQ.options && (
                <RadioGroup
                  value={currentAnswers[currentQ.id] ?? ''}
                  onValueChange={v => setAnswer(currentQ.id, v ?? '')}
                  className="space-y-2"
                >
                  {currentQ.options.map(opt => {
                    const letter = opt[0];
                    return (
                      <div
                        key={opt}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                          currentAnswers[currentQ.id] === letter
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-300'
                        )}
                        onClick={() => setAnswer(currentQ.id, letter)}
                      >
                        <RadioGroupItem value={letter} id={`opt-${opt}`} />
                        <Label htmlFor={`opt-${opt}`} className="cursor-pointer text-sm flex-1">{opt}</Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {currentQ.type === 'fill' && (
                <Input
                  placeholder="请输入答案..."
                  value={currentAnswers[currentQ.id] ?? ''}
                  onChange={e => setAnswer(currentQ.id, e.target.value)}
                  className="max-w-sm"
                />
              )}

              {(currentQ.type === 'short' || currentQ.type === 'essay') && (
                <div>
                  <Textarea
                    placeholder={currentQ.type === 'essay' ? '请详细作答（不少于300字）...' : '请简要作答...'}
                    value={currentAnswers[currentQ.id] ?? ''}
                    onChange={e => setAnswer(currentQ.id, e.target.value)}
                    rows={currentQ.type === 'essay' ? 10 : 6}
                    className="resize-none text-sm leading-relaxed"
                  />
                  {currentQ.type === 'essay' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      已输入 {(currentAnswers[currentQ.id] ?? '').length} 字
                    </p>
                  )}
                </div>
              )}

              {currentQ.type === 'tf' && (
                <div className="flex gap-3 max-w-xs">
                  {([['对', '✓ 对'] , ['错', '✗ 错']] as const).map(([v, l]) => (
                    <button key={v}
                      onClick={() => setAnswer(currentQ.id, v)}
                      className={cn(
                        'flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors',
                        currentAnswers[currentQ.id] === v
                          ? v === '对'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {currentQ.type === 'attachment' && (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
                    onClick={() => {
                      setAnswer(currentQ.id, '已上传：三视图.png (2.3MB)');
                      toast.success('文件上传成功');
                    }}
                  >
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm text-muted-foreground">拖拽文件到此处，或<span className="text-blue-600 font-medium">点击上传</span></p>
                    <p className="text-xs text-muted-foreground/60 mt-1">支持 jpg / png / pdf，最大 10MB</p>
                  </div>
                  {currentAnswers[currentQ.id] && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                      <span className="text-lg">📎</span>
                      <span className="text-sm text-gray-700 flex-1">{currentAnswers[currentQ.id]}</span>
                      <button onClick={() => setAnswer(currentQ.id, '')}
                        className="text-xs text-red-500 hover:text-red-700">删除</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t">
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={currentQuestionIndex === 0}
              onClick={() => setQuestionIndex(currentQuestionIndex - 1)}>
              上一题
            </Button>
            <span className="text-xs text-muted-foreground">{currentQuestionIndex + 1} / {questions.length}</span>
            {currentQuestionIndex < questions.length - 1 ? (
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => setQuestionIndex(currentQuestionIndex + 1)}>
                下一题
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5 text-white" style={{ background: '#002045' }}
                onClick={() => setSubmitDialogOpen(true)}>
                <Send size={14} /> 提交试卷
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom fixed answer card ── */}
      {started && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="max-w-4xl mx-auto px-4 py-2.5">
            <div className="flex items-start gap-5 overflow-x-auto">
              {questionGroups.map(group => (
                <div key={group.type} className="flex-shrink-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">
                    {sectionRoman[group.type]}、{group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.slice(group.start, group.end + 1).map((q, localIdx) => {
                      const globalIdx = group.start + localIdx;
                      const isAnswered = !!currentAnswers[q.id];
                      const isMarked = markedIds.has(q.id);
                      const isCurrent = currentQuestionIndex === globalIdx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setQuestionIndex(globalIdx)}
                          className={cn(
                            'relative w-8 h-8 rounded-lg text-xs font-semibold border-2 transition-all',
                            isCurrent
                              ? 'border-blue-600 text-blue-600 bg-blue-50'
                              : isAnswered
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          )}
                        >
                          {globalIdx + 1}
                          {isMarked && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border border-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block" /> 已作答 {answeredCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border-2 border-gray-200 inline-block" /> 未作答 {unansweredCount}
                </span>
                {markedIds.size > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-orange-400 inline-block" /> 已标记 {markedIds.size}
                  </span>
                )}
              </div>
              <Button size="sm" className="gap-1.5 text-white h-7 text-xs"
                style={{ background: '#002045' }}
                onClick={() => setSubmitDialogOpen(true)}>
                <Send size={12} /> 交卷
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Start Dialog ── */}
      <Dialog open={!started && !submitted} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              考试须知
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1 text-sm">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">考试时长</span>
                <span className="font-semibold">120 分钟</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">题目总数</span>
                <span className="font-semibold">{questions.length} 题</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">总分</span>
                <span className="font-semibold">100 分</span>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {(EXAM_ANTI_CHEAT[examId] ?? EXAM_ANTI_CHEAT.default).map(tip => (
                <li key={tip} className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button
              className="w-full text-white"
              style={{ background: '#002045' }}
              onClick={handleConfirmStart}
            >
              我已阅读，确认开始考试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Force Collect Dialog (triggered by teacher) ── */}
      <Dialog open={forceCollectOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={18} />
              监考老师已收卷
            </DialogTitle>
            <DialogDescription>
              监考老师已终止本次考试，你的答卷已自动提交。
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3 text-sm">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5 text-xs text-red-700">
              <p className="font-medium">已提交内容：</p>
              <p>已作答 {answeredCount} 题 / 共 {questions.length} 题</p>
              {unansweredCount > 0 && <p>未作答 {unansweredCount} 题将计 0 分</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              如有疑问，请考后联系监考老师或教学秘书。
            </p>
          </div>
          <DialogFooter>
            <Button
              className="w-full text-white"
              style={{ background: '#dc2626' }}
              onClick={() => {
                setForceCollectOpen(false);
                handleSubmitConfirm();
              }}
            >
              确认，返回首页
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Submit Confirmation ── */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认交卷</DialogTitle>
            <DialogDescription>交卷后将无法修改答案，请确认已完成所有题目。</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">总题数</span>
              <span className="font-semibold">{questions.length} 题</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已作答</span>
              <span className="font-semibold text-green-600">{answeredCount} 题</span>
            </div>
            {unansweredCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">未作答</span>
                <span className="font-semibold text-red-500">{unansweredCount} 题</span>
              </div>
            )}
            {unansweredNums.length > 0 && (
              <div className="text-xs text-muted-foreground">
                未作答题号：第 {unansweredNums.join('、') } 题
              </div>
            )}
            {markedIds.size > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">标记待查</span>
                <span className="font-semibold text-orange-500">{markedIds.size} 题</span>
              </div>
            )}
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg text-xs mt-2"
                style={{ background: '#fef3c7', color: '#92400e' }}>
                <AlertTriangle size={13} />
                还有 {unansweredCount} 道题未作答，确定要交卷吗？
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>返回检查</Button>
            <Button className="text-white" style={{ background: '#002045' }} onClick={handleSubmitConfirm}>
              确认交卷
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
