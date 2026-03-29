'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, XCircle, MinusCircle, MessageSquarePlus, Paperclip, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PBadge } from '@/components/ui/pbadge';
import { mockStudentScores } from '@/mock/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Data model ───────────────────────────────────────────────────────────────

interface QuestionReviewItem {
  no: number;
  type: string;
  score: number;
  earned: number;
  content: string;
  // Objective
  studentAnswer?: string;
  correctAnswer?: string;
  // Subjective
  studentAnswerText?: string;
  hitKeywords?: string[];
  missKeywords?: string[];
  comment?: string;
  dimensions?: { name: string; earned: number; max: number }[];
}

interface SectionGroup {
  label: string;
  sectionScore: number;
  sectionTotal: number;
  questions: QuestionReviewItem[];
}

// ── Full mock review data ─────────────────────────────────────────────────────

const REVIEW: Record<string, SectionGroup[]> = {
  E004: [
    {
      label: '一、选择题', sectionScore: 36, sectionTotal: 40,
      questions: [
        { no: 1,  type: '选择题', score: 4, earned: 4, content: '以下哪种数据结构适合实现"先进先出"（FIFO）特性？', studentAnswer: 'B. 队列', correctAnswer: 'B. 队列' },
        { no: 2,  type: '选择题', score: 4, earned: 4, content: '一棵具有 n 个节点的完全二叉树，其高度为？', studentAnswer: 'B. ⌊log₂n⌋+1', correctAnswer: 'B. ⌊log₂n⌋+1' },
        { no: 3,  type: '选择题', score: 4, earned: 0, content: '快速排序在最坏情况下的时间复杂度是？', studentAnswer: 'B. O(n log n)', correctAnswer: 'C. O(n²)' },
        { no: 4,  type: '选择题', score: 4, earned: 4, content: '图的广度优先搜索（BFS）使用什么数据结构辅助实现？', studentAnswer: 'A. 队列', correctAnswer: 'A. 队列' },
        { no: 5,  type: '选择题', score: 4, earned: 4, content: '哈希表在不发生冲突的情况下，查找操作的时间复杂度为？', studentAnswer: 'C. O(1)', correctAnswer: 'C. O(1)' },
        { no: 6,  type: '选择题', score: 4, earned: 4, content: '以下哪种树结构保证了 O(log n) 的最坏查找性能？', studentAnswer: 'B. AVL 树', correctAnswer: 'B. AVL 树' },
        { no: 7,  type: '选择题', score: 4, earned: 4, content: '栈的典型应用不包括哪项？', studentAnswer: 'D. 广度优先遍历', correctAnswer: 'D. 广度优先遍历' },
        { no: 8,  type: '选择题', score: 4, earned: 4, content: '归并排序的平均时间复杂度是？', studentAnswer: 'A. O(n log n)', correctAnswer: 'A. O(n log n)' },
        { no: 9,  type: '选择题', score: 4, earned: 4, content: '对 BST 进行中序遍历，输出的结果是？', studentAnswer: 'C. 有序序列', correctAnswer: 'C. 有序序列' },
        { no: 10, type: '选择题', score: 4, earned: 4, content: '关于链表和数组的描述，正确的是？', studentAnswer: 'B. 链表插入/删除 O(1)，数组随机访问 O(1)', correctAnswer: 'B. 链表插入/删除 O(1)，数组随机访问 O(1)' },
      ],
    },
    {
      label: '二、填空题', sectionScore: 16, sectionTotal: 20,
      questions: [
        { no: 11, type: '填空题', score: 4, earned: 4, content: '完全二叉树第 n 层最多有 ___ 个节点', studentAnswer: '2^(n-1)', correctAnswer: '2^(n-1)' },
        { no: 12, type: '填空题', score: 4, earned: 4, content: '具有 n 个节点的二叉树有 ___ 条边', studentAnswer: 'n-1', correctAnswer: 'n-1' },
        { no: 13, type: '填空题', score: 4, earned: 0, content: '堆排序建堆阶段的时间复杂度为 ___', studentAnswer: 'O(n log n)', correctAnswer: 'O(n)' },
        { no: 14, type: '填空题', score: 4, earned: 4, content: '图的深度优先遍历（DFS）可用 ___ 数据结构辅助实现（非递归时）', studentAnswer: '栈', correctAnswer: '栈' },
        { no: 15, type: '填空题', score: 4, earned: 4, content: 'Dijkstra 算法使用 ___ 数据结构优化时间复杂度为 O((V+E)log V)', studentAnswer: '优先队列（最小堆）', correctAnswer: '优先队列（最小堆）' },
      ],
    },
    {
      label: '三、简答题', sectionScore: 18, sectionTotal: 20,
      questions: [
        {
          no: 16, type: '简答题', score: 10, earned: 8,
          content: '请简述 TCP 和 UDP 协议的主要区别，并各举一个适用场景。',
          studentAnswerText: 'TCP是面向连接的协议，通过三次握手建立连接，保证可靠传输，适用于文件下载、网页浏览等场景；UDP是无连接协议，不保证数据可靠到达，但速度快，适合实时视频直播、DNS查询等场景。',
          hitKeywords: ['面向连接', '可靠', '无连接', 'TCP', 'UDP'],
          missKeywords: ['实时性'],
          comment: '基本正确，缺少对"实时性"这一核心特点的描述，扣 2 分。',
        },
        {
          no: 17, type: '简答题', score: 10, earned: 10,
          content: '请解释哈希冲突的概念，并描述至少两种解决哈希冲突的方法。',
          studentAnswerText: '哈希冲突是指不同的键通过哈希函数映射到了同一个槽位。解决方法有：①开放地址法，当冲突时探测下一个空位（线性探测/二次探测）；②链地址法，每个槽维护一个链表，冲突的元素追加到链表末尾；③再哈希法，使用第二个哈希函数重新计算位置。',
          hitKeywords: ['开放地址法', '链地址法', '哈希函数', '冲突'],
          missKeywords: [],
          comment: '回答全面准确，举例清晰，得满分。',
        },
      ],
    },
    {
      label: '四、论述题', sectionScore: 17, sectionTotal: 20,
      questions: [
        {
          no: 18, type: '论述题', score: 20, earned: 17,
          content: '请详细论述红黑树的性质，并分析其相比普通 BST 的优势，以及在实际工程中的应用场景。',
          studentAnswerText: '红黑树是一种自平衡二叉搜索树，有五个性质：每个节点是红色或黑色；根节点是黑色；叶节点（NIL）是黑色；红节点的子节点必须是黑色；从任意节点到叶节点的路径上黑色节点数（黑高度）相同。\n\n相比普通BST，红黑树通过旋转和变色操作保证树高度为O(log n)，避免了BST退化为链表的最坏情况。查找、插入、删除都保证O(log n)。\n\nJava的TreeMap/TreeSet、C++ STL的map/set都使用红黑树实现。',
          hitKeywords: ['自平衡', '红色', '黑色', '黑高度', 'O(log n)', '旋转', '变色'],
          missKeywords: [],
          dimensions: [
            { name: '性质描述', earned: 6, max: 6 },
            { name: '优势分析', earned: 6, max: 8 },
            { name: '工程应用', earned: 5, max: 6 },
          ],
          comment: '论述完整，答案清晰准确。工程应用举例略显简略，未提及 Linux 内核 CFS 调度器，扣 3 分。',
        },
      ],
    },
  ],

  E005: [
    {
      label: '一、选择题', sectionScore: 30, sectionTotal: 40,
      questions: [
        { no: 1,  type: '选择题', score: 4, earned: 4, content: 'OSI 参考模型共分为几层？', studentAnswer: 'C. 7 层', correctAnswer: 'C. 7 层' },
        { no: 2,  type: '选择题', score: 4, earned: 0, content: 'IP 地址 192.168.1.0/24 中，可用主机地址数量为？', studentAnswer: 'A. 256', correctAnswer: 'C. 254' },
        { no: 3,  type: '选择题', score: 4, earned: 4, content: 'HTTP 协议默认使用的端口号是？', studentAnswer: 'B. 80', correctAnswer: 'B. 80' },
        { no: 4,  type: '选择题', score: 4, earned: 4, content: 'TCP 三次握手的第二次，服务器发送的是？', studentAnswer: 'B. SYN-ACK', correctAnswer: 'B. SYN-ACK' },
        { no: 5,  type: '选择题', score: 4, earned: 0, content: '以下哪个协议工作在传输层？', studentAnswer: 'D. ARP', correctAnswer: 'B. TCP' },
        { no: 6,  type: '选择题', score: 4, earned: 4, content: 'HTTPS 在 HTTP 基础上增加了？', studentAnswer: 'A. TLS/SSL 加密', correctAnswer: 'A. TLS/SSL 加密' },
        { no: 7,  type: '选择题', score: 4, earned: 4, content: 'IP 协议属于哪一层？', studentAnswer: 'C. 网络层', correctAnswer: 'C. 网络层' },
        { no: 8,  type: '选择题', score: 4, earned: 4, content: '以太网帧的最小长度为？', studentAnswer: 'B. 64 字节', correctAnswer: 'B. 64 字节' },
        { no: 9,  type: '选择题', score: 4, earned: 0, content: 'DNS 默认使用哪种传输层协议？', studentAnswer: 'A. TCP', correctAnswer: 'B. UDP' },
        { no: 10, type: '选择题', score: 4, earned: 4, content: '子网掩码 255.255.255.0 的 CIDR 表示法是？', studentAnswer: 'D. /24', correctAnswer: 'D. /24' },
      ],
    },
    {
      label: '二、填空题', sectionScore: 15, sectionTotal: 20,
      questions: [
        { no: 11, type: '填空题', score: 4, earned: 4, content: 'TCP 连接建立需要 ___ 次握手', studentAnswer: '3（三）', correctAnswer: '3（三）' },
        { no: 12, type: '填空题', score: 4, earned: 4, content: 'HTTP 状态码 404 表示 ___', studentAnswer: '资源未找到', correctAnswer: '资源未找到' },
        { no: 13, type: '填空题', score: 4, earned: 3, content: 'HTTPS 默认端口号为 ___，HTTP 默认端口号为 ___', studentAnswer: '443，80', correctAnswer: '443，80（各 2 分）' },
        { no: 14, type: '填空题', score: 4, earned: 4, content: 'MAC 地址共 ___ 位，通常用 ___ 进制表示', studentAnswer: '48 位，16 进制', correctAnswer: '48 位，16 进制' },
        { no: 15, type: '填空题', score: 4, earned: 0, content: 'TCP 四次挥手中，主动关闭方发送完 FIN 后等待的状态称为 ___', studentAnswer: 'CLOSE_WAIT', correctAnswer: 'TIME_WAIT' },
      ],
    },
    {
      label: '三、简答题', sectionScore: 18, sectionTotal: 20,
      questions: [
        {
          no: 16, type: '简答题', score: 10, earned: 9,
          content: '什么是 ARP 协议？请描述其工作过程。',
          studentAnswerText: 'ARP协议用于在局域网中根据IP地址找到对应的MAC地址，通过广播方式查询，得到回应后缓存到本地ARP表中。',
          hitKeywords: ['地址解析', 'MAC', 'IP', '广播', 'ARP'],
          missKeywords: [],
          comment: '掌握扎实，描述准确，扣 1 分因未提及"单播回复"细节。',
        },
        {
          no: 17, type: '简答题', score: 10, earned: 9,
          content: '请解释 TCP 滑动窗口机制的作用和基本原理。',
          studentAnswerText: '滑动窗口机制用于TCP的流量控制，允许发送方在等待确认的同时连续发送多个数据包，提高传输效率。窗口大小由接收方通告，代表接收缓冲区的剩余空间。',
          hitKeywords: ['流量控制', '窗口', '发送方', '接收方', '缓冲区'],
          missKeywords: [],
          comment: '理解正确，但未说明窗口动态调整机制，扣 1 分。',
        },
      ],
    },
    {
      label: '四、论述题', sectionScore: 16, sectionTotal: 20,
      questions: [
        {
          no: 18, type: '论述题', score: 20, earned: 16,
          content: '请从协议栈角度，详细分析用户在浏览器输入 URL 并按回车后，到页面呈现的完整过程。',
          studentAnswerText: '首先DNS解析域名得到IP，然后TCP三次握手建立连接，如果是HTTPS还要进行TLS握手。然后发送HTTP请求，服务器处理后返回HTML，浏览器解析HTML建立DOM和CSSOM，然后渲染页面。',
          hitKeywords: ['DNS', 'TCP', 'HTTP', 'TLS', '三次握手', 'DOM', 'CSSOM'],
          missKeywords: ['四次挥手', '渲染树'],
          dimensions: [
            { name: '协议层次', earned: 4, max: 4 },
            { name: '流程完整', earned: 4, max: 6 },
            { name: '细节准确', earned: 4, max: 6 },
            { name: '逻辑清晰', earned: 4, max: 4 },
          ],
          comment: '整体思路正确，但缺少 TCP 四次挥手断开连接的描述，且渲染过程不够详细，扣 4 分。',
        },
      ],
    },
  ],

  E003: [
    {
      label: '一、选择题', sectionScore: 30, sectionTotal: 30,
      questions: [
        { no: 1, type: '选择题', score: 3, earned: 3, content: '时间复杂度 O(1) 表示？', studentAnswer: 'A. 常数时间', correctAnswer: 'A. 常数时间' },
        { no: 2, type: '选择题', score: 3, earned: 3, content: '以下哪种排序算法是稳定排序？', studentAnswer: 'C. 归并排序', correctAnswer: 'C. 归并排序' },
        { no: 3, type: '选择题', score: 3, earned: 3, content: '分治法的代表算法是？', studentAnswer: 'B. 快速排序', correctAnswer: 'B. 快速排序' },
        { no: 4, type: '选择题', score: 3, earned: 3, content: '贪心算法的适用条件包含？', studentAnswer: 'D. 贪心选择性质', correctAnswer: 'D. 贪心选择性质' },
        { no: 5, type: '选择题', score: 3, earned: 3, content: '动态规划与分治法的区别在于？', studentAnswer: 'A. 子问题是否重叠', correctAnswer: 'A. 子问题是否重叠' },
        { no: 6, type: '选择题', score: 3, earned: 3, content: '背包问题的最优解使用哪种算法？', studentAnswer: 'B. 动态规划', correctAnswer: 'B. 动态规划' },
        { no: 7, type: '选择题', score: 3, earned: 3, content: 'NP 完全问题的特点是？', studentAnswer: 'C. 多项式时间可验证', correctAnswer: 'C. 多项式时间可验证' },
        { no: 8, type: '选择题', score: 3, earned: 3, content: '二分查找的前提条件是？', studentAnswer: 'A. 数据有序', correctAnswer: 'A. 数据有序' },
        { no: 9, type: '选择题', score: 3, earned: 3, content: 'KMP 算法解决的是什么问题？', studentAnswer: 'D. 字符串匹配', correctAnswer: 'D. 字符串匹配' },
        { no: 10, type: '选择题', score: 3, earned: 3, content: '以下时间复杂度从低到高排列正确的是？', studentAnswer: 'B. O(1) < O(log n) < O(n) < O(n log n) < O(n²)', correctAnswer: 'B. O(1) < O(log n) < O(n) < O(n log n) < O(n²)' },
      ],
    },
    {
      label: '二、填空题', sectionScore: 14, sectionTotal: 20,
      questions: [
        { no: 11, type: '填空题', score: 4, earned: 4, content: '0-1 背包问题的状态转移方程为 dp[i][j] = max(dp[i-1][j], ___)', studentAnswer: 'dp[i-1][j-w[i]] + v[i]', correctAnswer: 'dp[i-1][j-w[i]] + v[i]' },
        { no: 12, type: '填空题', score: 4, earned: 4, content: 'Prim 算法和 Kruskal 算法都是求图的 ___', studentAnswer: '最小生成树', correctAnswer: '最小生成树' },
        { no: 13, type: '填空题', score: 4, earned: 4, content: '快速排序期望时间复杂度为 O(n log n)，选用 ___ 可以有效避免退化', studentAnswer: '随机化pivot', correctAnswer: '随机化pivot / 三数取中' },
        { no: 14, type: '填空题', score: 4, earned: 2, content: '堆排序建堆阶段时间复杂度为 ___', studentAnswer: 'O(n log n)', correctAnswer: 'O(n)（2分，答O(n log n)得1分）' },
        { no: 15, type: '填空题', score: 4, earned: 0, content: 'Dijkstra 算法不适用于含有 ___ 权重边的图', studentAnswer: '0 权重', correctAnswer: '负权重' },
      ],
    },
  ],
};

// ── Mock corrections (questions that were corrected after appeal) ─────────────

const CORRECTIONS: Record<string, { qNo: number; fromScore: number; toScore: number; note: string }[]> = {
  E004: [
    { qNo: 3, fromScore: 0, toScore: 2, note: '答案部分正确，补判 2 分' },
  ],
  E005: [
    { qNo: 15, fromScore: 0, toScore: 2, note: '参考答案表述有歧义，重新评分' },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'wrong' | 'subjective';

function gradeLabel(pct: number) {
  if (pct >= 90) return { label: '优秀', color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' };
  if (pct >= 75) return { label: '良好', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' };
  if (pct >= 60) return { label: '及格', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  return         { label: '不及格', color: 'text-red-600',       bg: 'bg-red-50',    border: 'border-red-200' };
}

function isSubjective(type: string) {
  return type === '简答题' || type === '论述题';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ScoreDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealQNo, setAppealQNo] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [appealFile, setAppealFile] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const record = mockStudentScores.find(r => r.examId === examId);
  const sections = REVIEW[examId];

  if (!record || !sections) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4">
          <ChevronLeft size={15} /> 成绩查询
        </button>
        <p className="text-sm text-muted-foreground">暂无详细成绩数据</p>
      </div>
    );
  }

  const pct = Math.round((record.score / record.totalScore) * 100);
  const grade = gradeLabel(pct);
  const corrections = CORRECTIONS[examId] ?? [];

  const handleAppealSubmit = () => {
    if (!appealQNo) { toast.error('请选择申诉题目'); return; }
    if (!appealReason.trim()) { toast.error('请填写申诉理由'); return; }
    toast.success('申诉已提交，预计 3 个工作日内处理');
    setAppealSubmitted(true);
    setAppealOpen(false);
  };

  const totalWrong = sections.reduce((s, sec) =>
    s + sec.questions.filter(q => q.earned < q.score).length, 0);
  const totalSubjective = sections.reduce((s, sec) =>
    s + sec.questions.filter(q => isSubjective(q.type)).length, 0);

  // Filtered sections (may result in empty sections, which we skip)
  const filteredSections = sections.map(sec => ({
    ...sec,
    questions: sec.questions.filter(q => {
      if (filter === 'wrong') return q.earned < q.score;
      if (filter === 'subjective') return isSubjective(q.type);
      return true;
    }),
  })).filter(sec => sec.questions.length > 0);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 transition-colors">
        <ChevronLeft size={15} /> 成绩查询
      </button>

      {/* Summary card */}
      <div className="rounded-xl border p-5 space-y-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">{record.examTitle}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {record.submitTime.split(' ')[0]} · 排名 {record.rank}/{record.classSize} · {record.subject}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-3xl font-bold text-gray-900">{record.score}</span>
            <span className="text-base text-muted-foreground ml-1">/{record.totalScore}</span>
            <span className="text-sm text-muted-foreground ml-1.5">（{pct}%）</span>
          </div>
          <span className={cn('text-sm font-semibold px-3 py-1 rounded-full border', grade.color, grade.bg, grade.border)}>
            {grade.label}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full"
            style={{ width: `${pct}%`, background: pct >= 90 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 60 ? '#d97706' : '#dc2626' }} />
        </div>
      </div>

      {/* Section breakdown */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium">大题</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium w-20">得分</th>
              <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium w-36">得分率</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(sec => {
              const r = Math.round((sec.sectionScore / sec.sectionTotal) * 100);
              return (
                <tr key={sec.label} className="border-b last:border-0">
                  <td className="py-2.5 px-4 text-sm text-gray-800">{sec.label}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-900 tabular-nums">
                    {sec.sectionScore}<span className="text-muted-foreground font-normal">/{sec.sectionTotal}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${r}%`, background: r >= 90 ? '#16a34a' : r >= 75 ? '#2563eb' : r >= 60 ? '#d97706' : '#dc2626' }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-9 text-right">{r}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Filter tabs + full review */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">完整试卷回顾 <PBadge p="P1" /></h2>
          <div className="flex gap-1.5">
            {([
              ['all',        '全部题目'],
              ['wrong',      `仅错题 ❌ (${totalWrong})`],
              ['subjective', `仅主观题 (${totalSubjective})`],
            ] as [FilterMode, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                  filter === v
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'text-gray-600 border-gray-200 hover:border-gray-400 bg-white'
                )}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {filteredSections.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">该筛选条件下没有题目</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSections.map(sec => (
              <div key={sec.label}>
                {/* Section header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">{sec.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {sec.sectionScore}/{sec.sectionTotal} 分
                  </span>
                </div>
                <div className="space-y-2">
                  {sec.questions.map(q => {
                    const wrong = q.earned < q.score;
                    const partial = wrong && q.earned > 0;
                    const subj = isSubjective(q.type);
                    const correction = corrections.find(c => c.qNo === q.no);
                    return (
                      <div key={q.no}
                        className={cn(
                          'rounded-xl border p-4 space-y-2.5',
                          correction ? 'border-blue-200 bg-blue-50/10' :
                          wrong && !subj ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                        )}>
                        {/* Correction marker */}
                        {correction && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                            <Edit3 size={11} className="text-blue-600" />
                            <span className="text-blue-700 font-medium">
                              已修正：原 {correction.fromScore} 分 → 现 {correction.toScore} 分
                            </span>
                            <span className="text-blue-500 ml-1">（{correction.note}）</span>
                          </div>
                        )}
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {wrong
                              ? <XCircle size={15} className={cn('flex-shrink-0 mt-0.5', partial ? 'text-amber-500' : 'text-red-500')} />
                              : <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">
                                第 {q.no} 题（{q.type}）
                              </p>
                              <p className="text-sm text-gray-800 leading-relaxed">{q.content}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={cn(
                              'text-sm font-bold',
                              wrong ? (partial ? 'text-amber-500' : 'text-red-500') : 'text-green-600'
                            )}>
                              {q.earned}
                            </span>
                            <span className="text-xs text-muted-foreground">/{q.score}</span>
                          </div>
                        </div>

                        {/* Objective: show answers */}
                        {!subj && (
                          <div className={cn('space-y-0.5 text-xs pl-5', wrong ? '' : 'text-gray-500')}>
                            <p className={wrong ? 'text-red-600' : 'text-gray-600'}>
                              你的答案：{q.studentAnswer}
                              {!wrong && ' ✓'}
                            </p>
                            {wrong && (
                              <p className="text-green-700 font-medium">正确答案：{q.correctAnswer}</p>
                            )}
                          </div>
                        )}

                        {/* Subjective: full details */}
                        {subj && q.studentAnswerText && (
                          <>
                            <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-700 leading-relaxed whitespace-pre-line pl-5">
                              {q.studentAnswerText}
                            </div>

                            {/* Keyword hits */}
                            {((q.hitKeywords?.length ?? 0) > 0 || (q.missKeywords?.length ?? 0) > 0) && (
                              <div className="pl-5 flex flex-wrap gap-1.5">
                                {q.hitKeywords?.map(kw => (
                                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                                    <CheckCircle2 size={9} /> {kw}
                                  </span>
                                ))}
                                {q.missKeywords?.map(kw => (
                                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400 border border-gray-200 line-through">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Essay dimension breakdown */}
                            {q.dimensions && q.dimensions.length > 0 && (
                              <div className="pl-5 space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">评分维度</p>
                                {q.dimensions.map(d => {
                                  const r = Math.round((d.earned / d.max) * 100);
                                  return (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                      <span className="w-20 text-gray-600 flex-shrink-0">{d.name}</span>
                                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full"
                                          style={{ width: `${r}%`, background: r >= 90 ? '#16a34a' : r >= 70 ? '#2563eb' : '#d97706' }} />
                                      </div>
                                      <span className={cn('w-12 text-right font-medium', d.earned < d.max ? 'text-amber-600' : 'text-green-600')}>
                                        {d.earned}/{d.max}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Teacher comment */}
                            {q.comment && (
                              <div className="ml-5 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2">
                                <p className="text-xs text-blue-700">
                                  <span className="font-medium">老师评语：</span>{q.comment}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Appeal section ─────────────────────────────────────── */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">成绩申诉 <PBadge p="P1" /></h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              如对评分存在异议，可提交申诉，教师将在 3 个工作日内复核
            </p>
          </div>
          {appealSubmitted ? (
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">
              ✓ 申诉已提交
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs flex-shrink-0"
              onClick={() => setAppealOpen(true)}
            >
              <MessageSquarePlus size={13} />
              提交申诉
            </Button>
          )}
        </div>
        {corrections.length > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
            已有 {corrections.length} 道题目经申诉后被修正，成绩已更新
          </div>
        )}
      </div>

      {/* ── Appeal Dialog ──────────────────────────────────────── */}
      <Dialog open={appealOpen} onOpenChange={setAppealOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus size={16} />
              提交成绩申诉
            </DialogTitle>
            <DialogDescription>
              请选择需要申诉的题目，并说明理由。申诉提交后不可撤回。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">申诉题目</label>
              <Select value={appealQNo} onValueChange={v => v && setAppealQNo(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择题目" />
                </SelectTrigger>
                <SelectContent>
                  {sections.flatMap(sec =>
                    sec.questions.map(q => (
                      <SelectItem key={q.no} value={String(q.no)}>
                        第 {q.no} 题（{q.type}）得 {q.earned}/{q.score} 分
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">申诉理由</label>
              <Textarea
                placeholder="请详细说明申诉理由，例如：参考答案存在歧义、评分标准不一致等..."
                value={appealReason}
                onChange={e => setAppealReason(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">{appealReason.length}/500 字</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">附件（可选）</label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
                onClick={() => setAppealFile('我的答题照片.jpg (1.2MB)')}
              >
                {appealFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <Paperclip size={14} className="text-blue-500" />
                    {appealFile}
                    <button
                      className="text-xs text-red-500 ml-2"
                      onClick={e => { e.stopPropagation(); setAppealFile(''); }}
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <>
                    <Paperclip size={20} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">点击上传佐证材料（图片/PDF，最大 5MB）</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealOpen(false)}>取消</Button>
            <Button
              className="text-white gap-1.5"
              style={{ background: '#002045' }}
              onClick={handleAppealSubmit}
            >
              <MessageSquarePlus size={14} />
              提交申诉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
