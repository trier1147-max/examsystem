'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, ChevronRight, CheckCircle2, XCircle, RotateCcw,
  Trophy, Target, Clock, TrendingUp, AlertCircle, Star,
  BarChart2, Play, ChevronDown, ChevronUp, Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Enriched practice questions ───────────────────────────────────────────────

interface PracticeQuestion {
  id: string;
  type: 'choice' | 'tf';
  subject: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  tags: string[];
}

const ALL_QUESTIONS: PracticeQuestion[] = [
  // 数据结构 - 栈与队列
  {
    id: 'P001', type: 'choice', subject: '数据结构', chapter: '栈与队列', difficulty: 'easy',
    content: '以下哪种数据结构适合实现"先进先出"（FIFO）的操作？',
    options: ['A. 栈（Stack）', 'B. 队列（Queue）', 'C. 堆（Heap）', 'D. 树（Tree）'],
    answer: 'B',
    explanation: '队列（Queue）是先进先出（FIFO）数据结构，最先入队的元素最先出队。栈是后进先出（LIFO）。',
    tags: ['FIFO', '队列', '基础概念'],
  },
  {
    id: 'P002', type: 'choice', subject: '数据结构', chapter: '栈与队列', difficulty: 'easy',
    content: '栈（Stack）遵循的访问原则是？',
    options: ['A. FIFO（先进先出）', 'B. LIFO（后进先出）', 'C. 随机访问', 'D. 优先级访问'],
    answer: 'B',
    explanation: '栈是后进先出（LIFO，Last In First Out）数据结构，最后压入栈的元素最先弹出，类似于叠盘子。',
    tags: ['LIFO', '栈', '基础概念'],
  },
  {
    id: 'P003', type: 'choice', subject: '数据结构', chapter: '栈与队列', difficulty: 'medium',
    content: '用两个栈可以模拟一个队列，以下操作中时间复杂度最坏为 O(n) 的是？',
    options: ['A. 入队操作', 'B. 出队操作', 'C. 查看队首', 'D. 以上皆是'],
    answer: 'B',
    explanation: '用两个栈模拟队列：入队总是 O(1)（压栈1）；出队需要在栈2为空时将栈1所有元素转移到栈2，最坏 O(n)，均摊 O(1)。',
    tags: ['双栈', '模拟队列', '摊还分析'],
  },
  {
    id: 'P004', type: 'tf', subject: '数据结构', chapter: '栈与队列', difficulty: 'easy',
    content: '循环队列能有效解决普通队列的"假溢出"问题。',
    answer: 'T',
    explanation: '正确。普通队列在出队后前端空间无法复用，产生"假溢出"。循环队列用取模运算使队列头尾形成环，充分利用数组空间。',
    tags: ['循环队列', '假溢出'],
  },
  {
    id: 'P005', type: 'choice', subject: '数据结构', chapter: '栈与队列', difficulty: 'medium',
    content: '设栈 S 和队列 Q 初始为空，经过以下操作后，队列 Q 中从队首到队尾依次是？\n操作：push(S,a), push(S,b), push(S,c), dequeue Q from S (将 S 全部弹出入 Q)',
    options: ['A. a, b, c', 'B. c, b, a', 'C. b, c, a', 'D. a, c, b'],
    answer: 'B',
    explanation: '栈 S 压入顺序 a→b→c，弹出顺序 c→b→a（LIFO）。弹出后依次入队，Q 中从队首到队尾为 c, b, a。',
    tags: ['栈', '队列', '综合应用'],
  },
  // 数据结构 - 二叉树
  {
    id: 'P006', type: 'choice', subject: '数据结构', chapter: '二叉树', difficulty: 'medium',
    content: '一棵具有 n 个节点的完全二叉树，其高度为？',
    options: ['A. log₂n', 'B. ⌊log₂n⌋ + 1', 'C. ⌈log₂n⌉', 'D. n/2'],
    answer: 'B',
    explanation: '完全二叉树高度为 ⌊log₂n⌋ + 1。例如 n=7 时，⌊log₂7⌋+1 = 2+1 = 3，正好是满二叉树高度。',
    tags: ['完全二叉树', '树高', '对数'],
  },
  {
    id: 'P007', type: 'choice', subject: '数据结构', chapter: '二叉树', difficulty: 'easy',
    content: '二叉搜索树（BST）的中序遍历结果是？',
    options: ['A. 倒序序列', 'B. 升序序列', 'C. 层次序列', 'D. 随机序列'],
    answer: 'B',
    explanation: 'BST 中序遍历（左→根→右）结果是升序排列的序列，这是BST的核心性质之一。',
    tags: ['BST', '中序遍历', '升序'],
  },
  {
    id: 'P008', type: 'tf', subject: '数据结构', chapter: '二叉树', difficulty: 'medium',
    content: '在二叉树中，度为2的节点数比叶节点数恰好多1。',
    answer: 'F',
    explanation: '错误，关系是反过来的：叶节点数 = 度为2的节点数 + 1。这是二叉树的基本性质：n₀ = n₂ + 1。',
    tags: ['二叉树性质', '节点度', '叶节点'],
  },
  {
    id: 'P009', type: 'choice', subject: '数据结构', chapter: '二叉树', difficulty: 'medium',
    content: '以下哪种遍历方式可以唯一确定一棵二叉树？',
    options: [
      'A. 前序 + 后序',
      'B. 前序 + 中序',
      'C. 后序 + 层次',
      'D. 中序 + 层次（无法唯一确定）',
    ],
    answer: 'B',
    explanation: '前序+中序 或 后序+中序 均可唯一确定一棵二叉树。中序遍历是关键，因为它区分了左右子树的边界。',
    tags: ['遍历', '唯一确定', '二叉树重建'],
  },
  {
    id: 'P010', type: 'choice', subject: '数据结构', chapter: '二叉树', difficulty: 'hard',
    content: 'AVL 树相比普通 BST 的核心优势是？',
    options: [
      'A. 允许重复键值',
      'B. 保证 O(log n) 的查找/插入/删除',
      'C. 支持范围查询',
      'D. 内存占用更小',
    ],
    answer: 'B',
    explanation: 'AVL 树是自平衡 BST，通过旋转操作保持平衡因子 ∈ {-1, 0, 1}，确保树高为 O(log n)，从而所有基本操作均为 O(log n)。',
    tags: ['AVL树', '自平衡', '时间复杂度'],
  },
  // 数据结构 - 排序算法
  {
    id: 'P011', type: 'choice', subject: '数据结构', chapter: '排序算法', difficulty: 'medium',
    content: '快速排序在最坏情况下的时间复杂度是？',
    options: ['A. O(n log n)', 'B. O(n)', 'C. O(n²)', 'D. O(log n)'],
    answer: 'C',
    explanation: '快速排序最坏情况发生在每次选取的基准元素恰好是最大或最小值（如已排序数组），此时退化为 O(n²)。',
    tags: ['快速排序', '最坏情况', 'O(n²)'],
  },
  {
    id: 'P012', type: 'choice', subject: '数据结构', chapter: '排序算法', difficulty: 'easy',
    content: '以下排序算法中，最坏和最好情况均为 O(n log n) 的是？',
    options: ['A. 快速排序', 'B. 归并排序', 'C. 堆排序', 'D. B和C均是'],
    answer: 'D',
    explanation: '归并排序和堆排序无论输入如何，时间复杂度始终为 O(n log n)。快速排序最坏 O(n²)，最好 O(n log n)。',
    tags: ['归并排序', '堆排序', '时间复杂度'],
  },
  {
    id: 'P013', type: 'tf', subject: '数据结构', chapter: '排序算法', difficulty: 'easy',
    content: '冒泡排序是稳定排序算法。',
    answer: 'T',
    explanation: '正确。冒泡排序在比较相邻元素时，只有前者严格大于后者才交换，相等元素不会改变相对位置，故是稳定排序。',
    tags: ['冒泡排序', '稳定性'],
  },
  {
    id: 'P014', type: 'choice', subject: '数据结构', chapter: '排序算法', difficulty: 'medium',
    content: '哈希表在理想情况下，查找的时间复杂度是？',
    options: ['A. O(1)', 'B. O(n)', 'C. O(log n)', 'D. O(n²)'],
    answer: 'A',
    explanation: '理想情况下哈希函数无冲突，直接通过 key 计算出存储位置，一次访问即可，时间复杂度 O(1)。',
    tags: ['哈希表', 'O(1)', '查找'],
  },
  {
    id: 'P015', type: 'choice', subject: '数据结构', chapter: '排序算法', difficulty: 'hard',
    content: '下列排序算法中，空间复杂度为 O(1) 的原地排序算法有哪些？',
    options: [
      'A. 归并排序、堆排序',
      'B. 快速排序、堆排序',
      'C. 堆排序、冒泡排序、插入排序',
      'D. 计数排序、基数排序',
    ],
    answer: 'C',
    explanation: '原地排序（O(1)空间）：堆排序、冒泡、插入、选择排序。快速排序递归栈 O(log n)，归并排序需 O(n) 辅助空间，计数/基数排序需额外空间。',
    tags: ['原地排序', '空间复杂度', '对比'],
  },
  // 计算机网络 - OSI模型
  {
    id: 'P016', type: 'choice', subject: '计算机网络', chapter: 'OSI模型', difficulty: 'easy',
    content: 'HTTP 协议属于 OSI 模型的哪一层？',
    options: ['A. 传输层', 'B. 网络层', 'C. 应用层', 'D. 表示层'],
    answer: 'C',
    explanation: 'HTTP（超文本传输协议）工作在 OSI 第7层应用层，它定义了浏览器与服务器之间传输超文本的规则。',
    tags: ['HTTP', 'OSI', '应用层'],
  },
  {
    id: 'P017', type: 'choice', subject: '计算机网络', chapter: 'OSI模型', difficulty: 'medium',
    content: 'OSI 模型中，负责路由选择的层是？',
    options: ['A. 数据链路层', 'B. 网络层', 'C. 传输层', 'D. 会话层'],
    answer: 'B',
    explanation: '网络层（第3层）负责逻辑寻址和路由选择，IP协议就工作在网络层，路由器是网络层设备。',
    tags: ['网络层', '路由', 'IP'],
  },
  {
    id: 'P018', type: 'tf', subject: '计算机网络', chapter: 'OSI模型', difficulty: 'easy',
    content: '交换机工作在OSI模型的数据链路层（第2层）。',
    answer: 'T',
    explanation: '正确。交换机依据 MAC 地址（数据链路层地址）进行帧转发，工作在第2层。路由器工作在第3层（网络层）。',
    tags: ['交换机', '数据链路层', '网络设备'],
  },
  // 计算机网络 - TCP/IP
  {
    id: 'P019', type: 'choice', subject: '计算机网络', chapter: 'TCP/IP', difficulty: 'medium',
    content: 'TCP 三次握手中，第二次握手服务器发送的报文标志位是？',
    options: ['A. SYN', 'B. ACK', 'C. SYN+ACK', 'D. FIN+ACK'],
    answer: 'C',
    explanation: 'TCP三次握手：①客户端发SYN；②服务器回复SYN+ACK（确认+请求同步）；③客户端发ACK确认。SYN+ACK 是第二次握手的特征。',
    tags: ['TCP', '三次握手', 'SYN'],
  },
  {
    id: 'P020', type: 'choice', subject: '计算机网络', chapter: 'TCP/IP', difficulty: 'medium',
    content: 'IP 地址 192.168.1.0/24 中，可用主机地址数量为？',
    options: ['A. 254', 'B. 256', 'C. 255', 'D. 253'],
    answer: 'A',
    explanation: '/24 子网有 2⁸ = 256 个地址，减去网络地址(0)和广播地址(255)，可用主机地址 = 256 - 2 = 254。',
    tags: ['子网', '主机地址', 'CIDR'],
  },
  {
    id: 'P021', type: 'choice', subject: '计算机网络', chapter: 'TCP/IP', difficulty: 'easy',
    content: 'DNS 协议主要使用的传输层协议是？',
    options: ['A. TCP', 'B. UDP', 'C. ICMP', 'D. ARP'],
    answer: 'B',
    explanation: 'DNS 查询通常使用 UDP（端口53），因为查询响应短小，UDP 效率更高。区域传输（Zone Transfer）才用 TCP。',
    tags: ['DNS', 'UDP', '端口53'],
  },
  {
    id: 'P022', type: 'tf', subject: '计算机网络', chapter: 'TCP/IP', difficulty: 'medium',
    content: 'TCP 协议中，TIME_WAIT 状态需要等待 2MSL 时间才能关闭连接。',
    answer: 'T',
    explanation: '正确。TIME_WAIT 等待 2×MSL（最大报文段寿命，通常2分钟），确保对方收到最后的 ACK，防止旧连接的延迟报文干扰新连接。',
    tags: ['TCP', 'TIME_WAIT', '四次挥手', '2MSL'],
  },
  // 计算机网络 - 网络安全
  {
    id: 'P023', type: 'choice', subject: '计算机网络', chapter: '网络安全', difficulty: 'easy',
    content: 'HTTPS 默认使用的端口号是？',
    options: ['A. 80', 'B. 8080', 'C. 443', 'D. 22'],
    answer: 'C',
    explanation: 'HTTPS（HTTP over TLS/SSL）默认端口是 443；HTTP 默认端口是 80；SSH 默认端口是 22。',
    tags: ['HTTPS', '端口号', '443'],
  },
  {
    id: 'P024', type: 'choice', subject: '计算机网络', chapter: '网络安全', difficulty: 'medium',
    content: 'TLS/SSL 握手过程中，用于加密实际数据传输的密钥类型是？',
    options: ['A. 非对称密钥', 'B. 对称密钥', 'C. 哈希密钥', 'D. 公钥'],
    answer: 'B',
    explanation: 'TLS 握手使用非对称加密交换/协商密钥，但实际数据传输使用对称加密（如AES），因为对称加密性能更高。',
    tags: ['TLS', '对称加密', '非对称加密', '密钥协商'],
  },
  {
    id: 'P025', type: 'tf', subject: '计算机网络', chapter: '网络安全', difficulty: 'hard',
    content: 'SQL 注入攻击和 XSS 攻击的防御手段完全相同。',
    answer: 'F',
    explanation: '错误。SQL注入通过参数化查询/预处理语句防御；XSS通过输出编码（HTML转义）、CSP策略防御。两者针对不同注入点，防御方法有差异。',
    tags: ['SQL注入', 'XSS', '安全防御'],
  },
];

// ── Chapter definitions ───────────────────────────────────────────────────────

type ChapterState = 'not-started' | 'in-progress' | 'done-good' | 'done-ok' | 'done-weak';

interface ChapterDef {
  subject: string;
  name: string;
  totalQuestions: number;
  state: ChapterState;
  doneCount: number;
  accuracy: number | null; // null = not attempted
}

const INITIAL_CHAPTERS: ChapterDef[] = [
  { subject: '数据结构', name: '栈与队列',   totalQuestions: 5,  state: 'done-good',    doneCount: 5,  accuracy: 80 },
  { subject: '数据结构', name: '二叉树',     totalQuestions: 5,  state: 'not-started',  doneCount: 0,  accuracy: null },
  { subject: '数据结构', name: '排序算法',   totalQuestions: 5,  state: 'done-ok',      doneCount: 4,  accuracy: 75 },
  { subject: '计算机网络', name: 'OSI模型',  totalQuestions: 3,  state: 'done-good',    doneCount: 3,  accuracy: 100 },
  { subject: '计算机网络', name: 'TCP/IP',   totalQuestions: 4,  state: 'in-progress',  doneCount: 2,  accuracy: 50 },
  { subject: '计算机网络', name: '网络安全', totalQuestions: 3,  state: 'not-started',  doneCount: 0,  accuracy: null },
];

const CHAPTER_STATE_CFG: Record<ChapterState, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'not-started': { label: '未开始', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-300' },
  'in-progress': { label: '进行中', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  'done-good':   { label: '优秀',   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  'done-ok':     { label: '良好',   color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  'done-weak':   { label: '需复习', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
};

// ── Mastery tracking for wrong answers ───────────────────────────────────────

type Mastery = 'unmastered' | 'reviewing' | 'mastered';

const MASTERY_CFG: Record<Mastery, { label: string; color: string; bg: string }> = {
  unmastered: { label: '未掌握', color: 'text-red-600', bg: 'bg-red-50' },
  reviewing:  { label: '复习中', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  mastered:   { label: '已掌握', color: 'text-green-600', bg: 'bg-green-50' },
};

interface WrongRecord {
  questionId: string;
  mastery: Mastery;
  wrongCount: number;
  lastAttempt: string; // date string
}

const INITIAL_WRONG_RECORDS: WrongRecord[] = [
  { questionId: 'P003', mastery: 'unmastered', wrongCount: 3, lastAttempt: '2026-03-25' },
  { questionId: 'P008', mastery: 'reviewing',  wrongCount: 2, lastAttempt: '2026-03-26' },
  { questionId: 'P010', mastery: 'unmastered', wrongCount: 1, lastAttempt: '2026-03-27' },
  { questionId: 'P013', mastery: 'reviewing',  wrongCount: 2, lastAttempt: '2026-03-25' },
  { questionId: 'P022', mastery: 'unmastered', wrongCount: 4, lastAttempt: '2026-03-24' },
  { questionId: 'P024', mastery: 'mastered',   wrongCount: 1, lastAttempt: '2026-03-22' },
  { questionId: 'P025', mastery: 'reviewing',  wrongCount: 2, lastAttempt: '2026-03-26' },
  { questionId: 'P015', mastery: 'unmastered', wrongCount: 1, lastAttempt: '2026-03-27' },
];

// ── Practice session state ────────────────────────────────────────────────────

interface SessionState {
  mode: 'chapter' | 'wrong' | 'mock';
  title: string;
  questions: PracticeQuestion[];
  qIdx: number;
  answered: Record<string, string>;
  revealed: Set<string>;
  startTime: number;
  timeLimit: number | null; // seconds, null = unlimited
  elapsed: number; // seconds
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDiffColor(d: string) {
  if (d === 'easy') return 'text-green-600 bg-green-50';
  if (d === 'medium') return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getDiffLabel(d: string) {
  if (d === 'easy') return '简单';
  if (d === 'medium') return '中等';
  return '困难';
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getQuestionsForChapter(chapter: string) {
  return ALL_QUESTIONS.filter(q => q.chapter === chapter);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [mode, setMode] = useState<'chapter' | 'wrong' | 'mock' | 'board'>('chapter');
  const [selectedSubject, setSelectedSubject] = useState<string>('全部');
  const [session, setSession] = useState<SessionState | null>(null);
  const [chapters, setChapters] = useState<ChapterDef[]>(INITIAL_CHAPTERS);
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>(INITIAL_WRONG_RECORDS);
  const [mockDuration, setMockDuration] = useState<number>(30);
  const [showResults, setShowResults] = useState<{
    title: string;
    questions: PracticeQuestion[];
    answered: Record<string, string>;
    timeTaken: number;
    mode: string;
  } | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  // Timer for mock session
  useEffect(() => {
    if (!session || session.timeLimit === null) return;
    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev) return prev;
        const newElapsed = prev.elapsed + 1;
        if (prev.timeLimit !== null && newElapsed >= prev.timeLimit) {
          clearInterval(timer);
          // auto-finish
          finishSession(prev);
          return null;
        }
        return { ...prev, elapsed: newElapsed };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.startTime]);

  const finishSession = useCallback((s: SessionState) => {
    // Update wrong records based on answers
    const newRecords = [...wrongRecords];
    s.questions.forEach(q => {
      const ans = s.answered[q.id];
      if (!ans) return;
      const isCorrect = ans === q.answer;
      const recIdx = newRecords.findIndex(r => r.questionId === q.id);

      if (!isCorrect) {
        if (recIdx >= 0) {
          newRecords[recIdx] = {
            ...newRecords[recIdx],
            wrongCount: newRecords[recIdx].wrongCount + 1,
            mastery: newRecords[recIdx].mastery === 'mastered' ? 'reviewing' : 'unmastered',
            lastAttempt: '2026-03-28',
          };
        } else {
          newRecords.push({ questionId: q.id, mastery: 'unmastered', wrongCount: 1, lastAttempt: '2026-03-28' });
        }
      } else if (recIdx >= 0) {
        const rec = newRecords[recIdx];
        const newMastery: Mastery = rec.mastery === 'unmastered' ? 'reviewing'
          : rec.mastery === 'reviewing' ? 'mastered'
          : 'mastered';
        newRecords[recIdx] = { ...rec, mastery: newMastery, lastAttempt: '2026-03-28' };
      }
    });
    setWrongRecords(newRecords);

    // Update chapter stats if chapter mode
    if (s.mode === 'chapter') {
      const chapterName = s.title;
      const total = s.questions.length;
      const correct = s.questions.filter(q => s.answered[q.id] === q.answer).length;
      const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
      const newState: ChapterState = acc >= 80 ? 'done-good' : acc >= 60 ? 'done-ok' : 'done-weak';
      setChapters(prev => prev.map(c =>
        c.name === chapterName
          ? { ...c, state: newState, doneCount: total, accuracy: acc }
          : c
      ));
    }

    setShowResults({
      title: s.title,
      questions: s.questions,
      answered: s.answered,
      timeTaken: s.elapsed,
      mode: s.mode,
    });
    setSession(null);
  }, [wrongRecords]);

  // ── Start a session ─────────────────────────────────────────────────────────

  function startChapterSession(chapter: ChapterDef) {
    const qs = getQuestionsForChapter(chapter.name);
    if (!qs.length) { toast.error('该章节暂无题目'); return; }
    setSession({
      mode: 'chapter', title: chapter.name, questions: qs,
      qIdx: 0, answered: {}, revealed: new Set(),
      startTime: Date.now(), timeLimit: null, elapsed: 0,
    });
    toast.success(`开始练习「${chapter.name}」`);
  }

  function startWrongSession(filter?: Mastery) {
    const ids = wrongRecords
      .filter(r => !filter || r.mastery === filter)
      .sort((a, b) => {
        const order: Record<Mastery, number> = { unmastered: 0, reviewing: 1, mastered: 2 };
        return order[a.mastery] - order[b.mastery] || b.wrongCount - a.wrongCount;
      })
      .map(r => r.questionId);
    const qs = ids.map(id => ALL_QUESTIONS.find(q => q.id === id)).filter(Boolean) as PracticeQuestion[];
    if (!qs.length) { toast.info('没有符合条件的错题'); return; }
    setSession({
      mode: 'wrong', title: filter ? `错题重做（${MASTERY_CFG[filter].label}）` : '全部错题重做',
      questions: qs, qIdx: 0, answered: {}, revealed: new Set(),
      startTime: Date.now(), timeLimit: null, elapsed: 0,
    });
    toast.success(`开始错题重做，共 ${qs.length} 题`);
  }

  function startMockSession() {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    const qs = shuffled.slice(0, mockDuration === 30 ? 10 : mockDuration === 60 ? 20 : 25);
    setSession({
      mode: 'mock', title: `${mockDuration}分钟模拟考试`,
      questions: qs, qIdx: 0, answered: {}, revealed: new Set(),
      startTime: Date.now(), timeLimit: mockDuration * 60, elapsed: 0,
    });
    toast.success('模拟考试开始，加油！');
  }

  // ── Results view ────────────────────────────────────────────────────────────

  if (showResults) {
    const { title, questions, answered, timeTaken, mode: rMode } = showResults;
    const total = questions.length;
    const correct = questions.filter(q => answered[q.id] === q.answer).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const byType: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      if (!byType[q.type]) byType[q.type] = { correct: 0, total: 0 };
      byType[q.type].total++;
      if (answered[q.id] === q.answer) byType[q.type].correct++;
    });
    const typeLabels: Record<string, string> = { choice: '选择题', tf: '判断题' };
    const weakChapters = questions
      .filter(q => answered[q.id] !== q.answer)
      .reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.chapter]: (acc[q.chapter] ?? 0) + 1 }), {});

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1 pb-2">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3',
            pct >= 80 ? 'bg-green-100' : pct >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          )}>
            {pct >= 80 ? <Trophy size={28} className="text-green-600" />
              : pct >= 60 ? <Target size={28} className="text-yellow-600" />
              : <AlertCircle size={28} className="text-red-500" />}
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {pct >= 80 ? '太棒了！' : pct >= 60 ? '继续加油！' : '需要再复习一下'}
          </h1>
          <p className="text-sm text-muted-foreground">{title} 已完成</p>
        </div>

        {/* Score card */}
        <Card className="shadow-none border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">综合得分</span>
              <span className="text-xs text-muted-foreground">用时 {formatTime(timeTaken)}</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className={cn('text-4xl font-bold', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500')}>
                {pct}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">（{correct}/{total} 题正确）</span>
            </div>
            <Progress value={pct} className="h-2" />
          </CardContent>
        </Card>

        {/* Type breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(byType).map(([type, stat]) => (
            <Card key={type} className="shadow-none border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{typeLabels[type] ?? type}</p>
                <p className="text-lg font-bold text-gray-900">
                  {stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{stat.correct}/{stat.total} 正确</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weak points */}
        {Object.keys(weakChapters).length > 0 && (
          <Card className="shadow-none border border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-orange-700 mb-2">薄弱章节</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(weakChapters)
                  .sort((a, b) => b[1] - a[1])
                  .map(([chap, cnt]) => (
                    <Badge key={chap} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      {chap} ({cnt}题错误)
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question review */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">题目回顾</p>
          {questions.map((q, i) => {
            const isCorrect = answered[q.id] === q.answer;
            const isExpanded = expandedExplanation === q.id;
            return (
              <Card key={q.id} className={cn('shadow-none border', isCorrect ? 'border-green-200' : 'border-red-200')}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    {isCorrect
                      ? <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      : <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-relaxed">{i + 1}. {q.content}</p>
                      {!isCorrect && (
                        <p className="text-xs text-red-600 mt-1">
                          你的答案：{answered[q.id] || '未作答'} | 正确答案：{q.answer}
                        </p>
                      )}
                      <button
                        className="text-xs text-blue-600 mt-1 flex items-center gap-0.5"
                        onClick={() => setExpandedExplanation(isExpanded ? null : q.id)}
                      >
                        解析 {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      {isExpanded && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-2 leading-relaxed">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          className="w-full text-white" style={{ background: '#002045' }}
          onClick={() => { setShowResults(null); setExpandedExplanation(null); }}
        >
          返回练习首页
        </Button>
      </div>
    );
  }

  // ── Active session ──────────────────────────────────────────────────────────

  if (session) {
    const q = session.questions[session.qIdx];
    const isRevealed = q ? session.revealed.has(q.id) : false;
    const studentAnswer = q ? session.answered[q.id] : '';
    const isCorrect = studentAnswer === q?.answer;
    const totalAnswered = Object.keys(session.answered).length;
    const totalCorrect = session.questions.filter(q2 => session.answered[q2.id] === q2.answer).length;
    const progress = session.qIdx / session.questions.length;
    const remaining = session.timeLimit !== null ? session.timeLimit - session.elapsed : null;
    const isOverTime = remaining !== null && remaining <= 0;
    const isExpanded = q ? expandedExplanation === q.id : false;

    function handleReveal() {
      if (!q) return;
      setSession(prev => prev ? ({
        ...prev,
        answered: prev.answered[q.id] ? prev.answered : { ...prev.answered, [q.id]: '' },
        revealed: new Set([...prev.revealed, q.id]),
      }) : prev);
    }

    function handleNext() {
      if (!q || !session) return;
      if (!isRevealed) { handleReveal(); return; }
      setExpandedExplanation(null);
      const snap = session;
      if (snap.qIdx < snap.questions.length - 1) {
        setSession(prev => prev ? ({ ...prev, qIdx: prev.qIdx + 1 }) : prev);
      } else {
        finishSession(snap);
      }
    }

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">{session.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              第 {session.qIdx + 1}/{session.questions.length} 题
              {totalAnswered > 0 && ` · 正确率 ${Math.round((totalCorrect / totalAnswered) * 100)}%`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {remaining !== null && (
              <span className={cn('text-xs font-mono px-2 py-0.5 rounded font-bold',
                remaining <= 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              )}>
                <Clock size={10} className="inline mr-0.5" />
                {isOverTime ? '已超时' : formatTime(remaining)}
              </span>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs"
              onClick={() => { setSession(null); setExpandedExplanation(null); }}>
              <RotateCcw size={12} /> 退出
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
        </div>

        {q && (
          <Card className="shadow-none border">
            <CardContent className="p-5 space-y-4">
              {/* Question meta */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-900 leading-relaxed flex-1 whitespace-pre-line">
                  {session.qIdx + 1}. {q.content}
                </p>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', getDiffColor(q.difficulty))}>
                    {getDiffLabel(q.difficulty)}
                  </span>
                  <span className="text-xs text-muted-foreground">{q.chapter}</span>
                </div>
              </div>

              {/* Choice question */}
              {q.type === 'choice' && (
                <RadioGroup
                  value={studentAnswer ?? ''}
                  onValueChange={v => {
                    if (isRevealed) return;
                    setSession(prev => prev ? ({
                      ...prev, answered: { ...prev.answered, [q.id]: v ?? '' },
                    }) : prev);
                  }}
                  className="space-y-2"
                >
                  {(q.options ?? []).map(opt => {
                    const letter = opt[0];
                    const isSelected = studentAnswer === letter;
                    const isAnswer = q.answer === letter;
                    let style = 'border-gray-100';
                    if (isRevealed && isAnswer) style = 'border-green-400 bg-green-50';
                    else if (isRevealed && isSelected && !isAnswer) style = 'border-red-300 bg-red-50';
                    else if (isSelected) style = 'border-blue-400 bg-blue-50';
                    return (
                      <div
                        key={opt}
                        className={cn('flex items-center gap-3 p-3 rounded-lg border-2 transition-colors', style,
                          isRevealed ? 'cursor-default' : 'cursor-pointer hover:border-gray-300')}
                        onClick={() => !isRevealed && setSession(prev => prev ? ({
                          ...prev, answered: { ...prev.answered, [q.id]: letter }
                        }) : prev)}
                      >
                        <RadioGroupItem value={letter} id={`s-${q.id}-${letter}`} disabled={isRevealed} />
                        <Label htmlFor={`s-${q.id}-${letter}`} className={cn(
                          'cursor-pointer text-sm flex-1',
                          isRevealed && isAnswer ? 'font-semibold text-green-700' : ''
                        )}>{opt}</Label>
                        {isRevealed && isAnswer && <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />}
                        {isRevealed && isSelected && !isAnswer && <XCircle size={15} className="text-red-500 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {/* TF question */}
              {q.type === 'tf' && (
                <div className="flex gap-3">
                  {(['T', 'F'] as const).map(v => {
                    const isSelected = studentAnswer === v;
                    const isAnswer = q.answer === v;
                    let style = 'border-gray-200 text-gray-700';
                    if (isRevealed && isAnswer) style = 'border-green-400 bg-green-50 text-green-700';
                    else if (isRevealed && isSelected && !isAnswer) style = 'border-red-300 bg-red-50 text-red-600';
                    else if (isSelected) style = 'border-blue-400 bg-blue-50 text-blue-700';
                    return (
                      <button
                        key={v}
                        className={cn('flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-colors',
                          style, isRevealed ? 'cursor-default' : 'hover:border-gray-400 cursor-pointer')}
                        onClick={() => !isRevealed && setSession(prev => prev ? ({
                          ...prev, answered: { ...prev.answered, [q.id]: v }
                        }) : prev)}
                      >
                        {v === 'T' ? '✓ 正确' : '✗ 错误'}
                        {isRevealed && isAnswer && <CheckCircle2 size={13} className="inline ml-1.5" />}
                        {isRevealed && isSelected && !isAnswer && <XCircle size={13} className="inline ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation after reveal */}
              {isRevealed && (
                <div className={cn('rounded-lg p-3 text-xs', isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={cn('font-semibold', isCorrect ? 'text-green-700' : 'text-red-700')}>
                      {isCorrect ? '✓ 回答正确！' : `✗ 回答错误，正确答案是 ${q.answer}`}
                    </p>
                    <button
                      className="text-xs text-blue-600 flex items-center gap-0.5"
                      onClick={() => setExpandedExplanation(isExpanded ? null : q.id)}
                    >
                      解析 {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <p className="text-gray-600 leading-relaxed">{q.explanation}</p>
                  )}
                  {!isExpanded && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {q.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-white/60 rounded text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-1">
                {!isRevealed ? (
                  <Button size="sm" variant="outline" disabled={!studentAnswer}
                    onClick={handleReveal}>
                    查看答案
                  </Button>
                ) : <div />}
                <Button
                  size="sm" className="text-white gap-1.5"
                  style={{ background: '#002045' }}
                  disabled={!isRevealed && !studentAnswer}
                  onClick={handleNext}
                >
                  {!isRevealed ? '提交' : session.qIdx < session.questions.length - 1 ? '下一题 →' : '完成练习'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────

  const subjects = ['全部', '数据结构', '计算机网络'];
  const filteredChapters = chapters.filter(c => selectedSubject === '全部' || c.subject === selectedSubject);

  // Board stats
  const totalDone = ALL_QUESTIONS.length;
  const totalPracticed = chapters.reduce((s, c) => s + c.doneCount, 0);
  const overallAccuracy = chapters.filter(c => c.accuracy !== null).length > 0
    ? Math.round(chapters.filter(c => c.accuracy !== null).reduce((s, c) => s + (c.accuracy ?? 0), 0)
      / chapters.filter(c => c.accuracy !== null).length)
    : null;
  const masteredCount = wrongRecords.filter(r => r.mastery === 'mastered').length;
  const unmasteredCount = wrongRecords.filter(r => r.mastery === 'unmastered').length;

  const TABS = [
    { value: 'chapter', label: '按章节', icon: BookOpen },
    { value: 'wrong',   label: '错题重做', icon: XCircle },
    { value: 'mock',    label: '模拟考试', icon: Target },
    { value: 'board',   label: '学习看板', icon: BarChart2 },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">题库练习</h1>
        <p className="text-sm text-muted-foreground mt-0.5">巩固知识，查漏补缺</p>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '已练题数', value: totalPracticed, icon: <Flame size={13} className="text-orange-500" /> },
          { label: '综合正确率', value: overallAccuracy !== null ? `${overallAccuracy}%` : '—', icon: <TrendingUp size={13} className="text-green-500" /> },
          { label: '错题数', value: wrongRecords.length, icon: <AlertCircle size={13} className="text-red-500" /> },
          { label: '已掌握', value: masteredCount, icon: <Star size={13} className="text-yellow-500" /> },
        ].map(item => (
          <Card key={item.label} className="shadow-none border">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-0.5">{item.icon}<span className="text-xs text-muted-foreground">{item.label}</span></div>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              mode === value
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-muted-foreground hover:text-gray-700'
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── 按章节练习 ─────────────────────────────────────────────────── */}
      {mode === 'chapter' && (
        <div className="space-y-3">
          {/* Subject filter */}
          <div className="flex gap-1.5">
            {subjects.map(s => (
              <button key={s} onClick={() => setSelectedSubject(s)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  selectedSubject === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                )}>
                {s}
              </button>
            ))}
          </div>

          {filteredChapters.map(chapter => {
            const cfg = CHAPTER_STATE_CFG[chapter.state];
            const pct = chapter.totalQuestions > 0
              ? Math.round((chapter.doneCount / chapter.totalQuestions) * 100) : 0;
            return (
              <Card key={chapter.name} className={cn('shadow-none border transition-colors hover:border-gray-300', cfg.border)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                        <span className="text-sm font-medium text-gray-900">{chapter.name}</span>
                        <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{chapter.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {chapter.doneCount}/{chapter.totalQuestions} 题
                        </span>
                        {chapter.accuracy !== null && (
                          <span className={cn('text-xs font-medium w-16 text-right',
                            chapter.accuracy >= 80 ? 'text-green-600' : chapter.accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'
                          )}>
                            正确率 {chapter.accuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline"
                      className="gap-1 text-xs h-8 flex-shrink-0"
                      onClick={() => startChapterSession(chapter)}>
                      {chapter.state === 'not-started' ? <><Play size={11} /> 开始</> : <><RotateCcw size={11} /> 重练</>}
                      <ChevronRight size={11} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 错题重做 ───────────────────────────────────────────────────── */}
      {mode === 'wrong' && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {(['unmastered', 'reviewing', 'mastered'] as Mastery[]).map(m => {
              const cnt = wrongRecords.filter(r => r.mastery === m).length;
              const cfg = MASTERY_CFG[m];
              return (
                <Card key={m} className={cn('shadow-none border cursor-pointer hover:border-gray-300', cnt === 0 ? 'opacity-50' : '')}
                  onClick={() => cnt > 0 && startWrongSession(m)}>
                  <CardContent className="p-3 text-center">
                    <p className={cn('text-2xl font-bold', cfg.color)}>{cnt}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                    {cnt > 0 && <p className="text-xs text-blue-600 mt-1">点击练习</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Wrong list */}
          <div className="space-y-2">
            {wrongRecords
              .sort((a, b) => {
                const order: Record<Mastery, number> = { unmastered: 0, reviewing: 1, mastered: 2 };
                return order[a.mastery] - order[b.mastery];
              })
              .map(rec => {
                const q = ALL_QUESTIONS.find(q2 => q2.id === rec.questionId);
                if (!q) return null;
                const cfg = MASTERY_CFG[rec.mastery];
                return (
                  <Card key={rec.questionId} className="shadow-none border hover:border-gray-300 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="secondary" className={cn('text-xs', cfg.bg, cfg.color)}>{cfg.label}</Badge>
                            <span className="text-xs text-muted-foreground">{q.chapter}</span>
                            <span className="text-xs text-muted-foreground">错误 {rec.wrongCount} 次</span>
                          </div>
                          <p className="text-xs text-gray-800 leading-relaxed line-clamp-2">{q.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">最近练习：{rec.lastAttempt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          <Button className="w-full text-white gap-2" style={{ background: '#002045' }}
            onClick={() => startWrongSession()}>
            <RotateCcw size={14} /> 全部错题重做（{wrongRecords.filter(r => r.mastery !== 'mastered').length} 题）
          </Button>
        </div>
      )}

      {/* ── 模拟考试 ───────────────────────────────────────────────────── */}
      {mode === 'mock' && (
        <div className="space-y-4">
          <Card className="shadow-none border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-blue-600" />
                <span className="text-sm font-medium">模拟考试配置</span>
              </div>
              <p className="text-xs text-muted-foreground">
                随机抽取题目，模拟真实考试环境（无防作弊限制），到时间后自动提交。
              </p>

              {/* Duration */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">考试时长</p>
                <div className="flex gap-2">
                  {[30, 60, 120].map(d => (
                    <button key={d}
                      onClick={() => setMockDuration(d)}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                        mockDuration === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      )}>
                      {d} 分钟
                      <span className="block text-xs font-normal opacity-70">
                        {d === 30 ? '~10题' : d === 60 ? '~20题' : '~25题'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p>· 题目随机抽取，每次不同</p>
                <p>· 倒计时归零时自动提交</p>
                <p>· 完成后显示成绩分析和薄弱点</p>
              </div>

              <Button className="w-full text-white gap-2" style={{ background: '#002045' }}
                onClick={startMockSession}>
                <Play size={14} /> 开始模拟考试
              </Button>
            </CardContent>
          </Card>

          {/* Recent mock results */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">历次模拟记录</p>
            {[
              { date: '2026-03-26', duration: 30, score: 80, total: 10 },
              { date: '2026-03-24', duration: 60, score: 75, total: 20 },
              { date: '2026-03-20', duration: 30, score: 90, total: 10 },
            ].map((r, i) => (
              <Card key={i} className="shadow-none border mb-2">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.date} · {r.duration}分钟模拟</p>
                    <p className="text-xs text-muted-foreground">{r.score}/{r.total * 4} 分 · {r.total} 题</p>
                  </div>
                  <span className={cn('text-sm font-bold',
                    r.score / (r.total * 4) >= 0.8 ? 'text-green-600' : 'text-yellow-600'
                  )}>
                    {Math.round(r.score / (r.total * 4) * 100)}%
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 学习看板 ───────────────────────────────────────────────────── */}
      {mode === 'board' && (
        <div className="space-y-4">
          {/* Weekly activity */}
          <Card className="shadow-none border">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">本周练习</p>
              <div className="flex items-end gap-1.5 h-16">
                {[
                  { day: '周一', count: 5 },
                  { day: '周二', count: 12 },
                  { day: '周三', count: 0 },
                  { day: '周四', count: 8 },
                  { day: '周五', count: 15 },
                  { day: '周六', count: 3 },
                  { day: '周日', count: 0 },
                ].map(({ day, count }) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${count > 0 ? Math.max(4, count / 15 * 48) : 2}px`,
                        background: count > 0 ? '#002045' : '#f3f4f6',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">本周共练习 43 题 · 连续打卡 5 天 🔥</p>
            </CardContent>
          </Card>

          {/* Subject mastery */}
          <Card className="shadow-none border">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">各科目掌握度</p>
              {['数据结构', '计算机网络'].map(subj => {
                const subjChapters = chapters.filter(c => c.subject === subj && c.accuracy !== null);
                const avg = subjChapters.length > 0
                  ? Math.round(subjChapters.reduce((s, c) => s + (c.accuracy ?? 0), 0) / subjChapters.length) : 0;
                return (
                  <div key={subj}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{subj}</span>
                      <span className={cn('text-xs font-bold',
                        avg >= 80 ? 'text-green-600' : avg >= 60 ? 'text-yellow-600' : 'text-gray-400'
                      )}>{subjChapters.length > 0 ? `${avg}%` : '未开始'}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${avg}%`,
                          background: avg >= 80 ? '#16a34a' : avg >= 60 ? '#d97706' : '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Chapter detail */}
          <Card className="shadow-none border">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">章节详细</p>
              {chapters.map(chapter => {
                const cfg = CHAPTER_STATE_CFG[chapter.state];
                return (
                  <div key={chapter.name} className="flex items-center gap-3">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                    <span className="text-xs text-gray-700 w-24">{chapter.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${chapter.totalQuestions > 0 ? Math.round(chapter.doneCount / chapter.totalQuestions * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {chapter.accuracy !== null ? `${chapter.accuracy}%` : '—'}
                    </span>
                    <Badge variant="secondary" className={cn('text-xs', cfg.color, cfg.bg)}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Total stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="shadow-none border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">累计练习题数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalPracticed}</p>
                <p className="text-xs text-muted-foreground">题库共 {totalDone} 题</p>
              </CardContent>
            </Card>
            <Card className="shadow-none border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">错题掌握进度</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {wrongRecords.length > 0 ? Math.round(masteredCount / wrongRecords.length * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">{masteredCount}/{wrongRecords.length} 已掌握</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
