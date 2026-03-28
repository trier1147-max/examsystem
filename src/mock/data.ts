// Mock data for exam system demo

export type QuestionType = 'choice' | 'fill' | 'short' | 'essay' | 'tf' | 'attachment';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExamStatus = 'pending' | 'ongoing' | 'grading' | 'finished';
export type UserRole = 'teacher' | 'student' | 'admin';
export type SubmissionStatus = 'graded' | 'pending' | 'partial';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  answer: string;
  keywords?: string[];
  difficulty: Difficulty;
  subject: string;
  chapter?: string;
  score: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  status: ExamStatus;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  totalScore: number;
  questionIds: string[];
  class: string;
  college: string;
  createdBy: string;
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  class: string;
  score: number;
  totalScore: number;
  submitTime: string;
  status: SubmissionStatus;
  answers: Record<string, string>;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  subject?: string;
  college?: string;
  class?: string;
  grade?: string;
  department?: string;
}

export interface CollegeStat {
  college: string;
  examCount: number;
  studentCount: number;
  avgScore: number;
  passRate: number;
}

export interface MonthStat {
  month: string;
  examCount: number;
  studentCount: number;
  avgScore: number;
}

// ---- Users ----

export const mockTeacher: User = {
  id: 'T001',
  name: '李明华',
  role: 'teacher',
  subject: '计算机科学',
  college: '信息学院',
};

export const mockStudent: User = {
  id: 'S2021001',
  name: '张小明',
  role: 'student',
  class: '计科2101',
  grade: '2021级',
};

export const mockAdmin: User = {
  id: 'A001',
  name: '王建国',
  role: 'admin',
  department: '教务处',
};

// ---- Questions ----

export const mockQuestions: Question[] = [
  // Data structures - choice
  {
    id: 'Q001',
    type: 'choice',
    content: '以下哪种数据结构适合实现"先进先出"（FIFO）的操作？',
    options: ['A. 栈（Stack）', 'B. 队列（Queue）', 'C. 堆（Heap）', 'D. 树（Tree）'],
    answer: 'B',
    difficulty: 'easy',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q002',
    type: 'choice',
    content: '一棵具有 n 个节点的完全二叉树，其高度为？',
    options: ['A. log₂n', 'B. ⌊log₂n⌋ + 1', 'C. ⌈log₂n⌉', 'D. n/2'],
    answer: 'B',
    difficulty: 'medium',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q003',
    type: 'choice',
    content: '快速排序在最坏情况下的时间复杂度是？',
    options: ['A. O(n log n)', 'B. O(n)', 'C. O(n²)', 'D. O(log n)'],
    answer: 'C',
    difficulty: 'medium',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q004',
    type: 'choice',
    content: '哈希表在理想情况下，查找的时间复杂度是？',
    options: ['A. O(1)', 'B. O(n)', 'C. O(log n)', 'D. O(n²)'],
    answer: 'A',
    difficulty: 'easy',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q005',
    type: 'choice',
    content: '以下关于链表和数组的描述，正确的是？',
    options: [
      'A. 链表支持随机访问，数组不支持',
      'B. 数组插入元素比链表更高效',
      'C. 链表在内存中是连续存储的',
      'D. 数组支持随机访问，链表不支持随机访问',
    ],
    answer: 'D',
    difficulty: 'easy',
    subject: '数据结构',
    score: 4,
  },
  // Computer networks - choice
  {
    id: 'Q006',
    type: 'choice',
    content: 'HTTP 协议属于 OSI 模型的哪一层？',
    options: ['A. 传输层', 'B. 网络层', 'C. 应用层', 'D. 表示层'],
    answer: 'C',
    difficulty: 'easy',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q007',
    type: 'choice',
    content: 'TCP 三次握手中，第二次握手服务器发送的报文标志位是？',
    options: ['A. SYN', 'B. ACK', 'C. SYN+ACK', 'D. FIN+ACK'],
    answer: 'C',
    difficulty: 'medium',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q008',
    type: 'choice',
    content: 'IP 地址 192.168.1.0/24 中，可用主机地址数量为？',
    options: ['A. 254', 'B. 256', 'C. 255', 'D. 253'],
    answer: 'A',
    difficulty: 'medium',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q009',
    type: 'choice',
    content: 'DNS 协议主要使用的传输层协议是？',
    options: ['A. TCP', 'B. UDP', 'C. ICMP', 'D. ARP'],
    answer: 'B',
    difficulty: 'easy',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q010',
    type: 'choice',
    content: 'HTTPS 默认使用的端口号是？',
    options: ['A. 80', 'B. 8080', 'C. 443', 'D. 22'],
    answer: 'C',
    difficulty: 'easy',
    subject: '计算机网络',
    score: 4,
  },
  // Fill-in-blank
  {
    id: 'Q011',
    type: 'fill',
    content: '二叉搜索树（BST）的中序遍历结果是______序列。',
    answer: '升序（有序）',
    keywords: ['升序', '有序'],
    difficulty: 'easy',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q012',
    type: 'fill',
    content: '堆排序的时间复杂度为______，空间复杂度为______。',
    answer: 'O(n log n)；O(1)',
    keywords: ['O(n log n)', 'O(1)'],
    difficulty: 'medium',
    subject: '数据结构',
    score: 4,
  },
  {
    id: 'Q013',
    type: 'fill',
    content: 'TCP 四次挥手中，主动关闭方发出 FIN 后进入______状态。',
    answer: 'FIN_WAIT_1',
    keywords: ['FIN_WAIT_1', 'FIN-WAIT-1'],
    difficulty: 'hard',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q014',
    type: 'fill',
    content: '子网掩码 255.255.255.0 对应的 CIDR 前缀长度是______。',
    answer: '/24',
    keywords: ['24', '/24'],
    difficulty: 'easy',
    subject: '计算机网络',
    score: 4,
  },
  {
    id: 'Q015',
    type: 'fill',
    content: '图的深度优先搜索（DFS）通常使用______数据结构辅助实现。',
    answer: '栈（Stack）',
    keywords: ['栈', 'Stack'],
    difficulty: 'medium',
    subject: '数据结构',
    score: 4,
  },
  // Short answer
  {
    id: 'Q016',
    type: 'short',
    content: '请简述 TCP 和 UDP 协议的主要区别，并各举一个适用场景。',
    answer:
      'TCP 是面向连接、可靠传输协议，适用于文件传输、网页浏览等需要数据完整性的场景；UDP 是无连接、不可靠传输协议，适用于视频直播、DNS查询等对实时性要求高的场景。',
    keywords: ['面向连接', '可靠', '无连接', '实时性', 'TCP', 'UDP'],
    difficulty: 'medium',
    subject: '计算机网络',
    score: 8,
  },
  {
    id: 'Q017',
    type: 'short',
    content: '请解释什么是哈希冲突，并说明至少两种解决哈希冲突的方法。',
    answer:
      '哈希冲突是指不同的关键字通过哈希函数映射到同一存储位置的现象。解决方法包括：①开放地址法（线性探测/平方探测）；②链地址法（每个槽位维护链表）；③再哈希法（使用第二个哈希函数）。',
    keywords: ['哈希冲突', '开放地址', '链地址', '再哈希'],
    difficulty: 'medium',
    subject: '数据结构',
    score: 8,
  },
  {
    id: 'Q018',
    type: 'short',
    content: '什么是 ARP 协议？请描述其工作过程。',
    answer:
      'ARP（地址解析协议）用于将 IP 地址解析为 MAC 地址。工作过程：主机广播 ARP 请求报文，目标主机收到后单播回复 ARP 应答，发送方将 IP-MAC 映射缓存到 ARP 表中。',
    keywords: ['地址解析', 'MAC', 'IP', '广播', 'ARP'],
    difficulty: 'medium',
    subject: '计算机网络',
    score: 8,
  },
  // Essay
  {
    id: 'Q019',
    type: 'essay',
    content:
      '请详细论述红黑树的性质，并分析其相比普通 BST 的优势，以及在实际工程中的应用场景（不少于300字）。',
    answer:
      '红黑树是一种自平衡二叉搜索树，具有以下五个性质：①每个节点是红色或黑色；②根节点是黑色；③每个叶节点（NIL）是黑色；④若节点为红色，则其子节点必须为黑色；⑤从任意节点到其后代叶节点的所有路径上，黑色节点数相同（黑高度相同）。\n\n相比普通 BST，红黑树通过旋转和变色操作保证树的高度始终为 O(log n)，避免了普通 BST 在最坏情况下退化为链表的 O(n) 时间复杂度。\n\n实际工程应用：Java 的 TreeMap/TreeSet、C++ STL 的 map/set、Linux 内核的完全公平调度器（CFS）均使用红黑树实现，适合需要频繁插入、删除和查找操作且要求稳定性能的场景。',
    keywords: ['自平衡', '红色', '黑色', '黑高度', 'O(log n)', '旋转', '变色'],
    difficulty: 'hard',
    subject: '数据结构',
    score: 15,
  },
  {
    id: 'Q020',
    type: 'essay',
    content:
      '请从协议栈角度，详细分析用户在浏览器输入 URL 并按回车后，到页面呈现的完整过程（不少于400字）。',
    answer:
      '完整过程包括：①DNS 解析：浏览器检查缓存，通过递归/迭代查询将域名解析为 IP 地址；②TCP 连接：三次握手建立可靠连接（SYN→SYN+ACK→ACK）；③TLS 握手（HTTPS）：协商加密参数，验证证书；④HTTP 请求：发送 GET 请求，包含请求头、Cookie 等；⑤服务器处理：路由匹配、业务逻辑、数据库查询；⑥HTTP 响应：返回 HTML/CSS/JS 等资源；⑦浏览器渲染：HTML 解析构建 DOM，CSS 构建 CSSOM，合并为渲染树，布局、绘制；⑧TCP 四次挥手断开连接。',
    keywords: ['DNS', 'TCP', 'HTTP', 'TLS', '三次握手', 'DOM', 'CSSOM', '渲染'],
    difficulty: 'hard',
    subject: '计算机网络',
    score: 15,
  },
];

// ---- Exams ----

export const mockExams: Exam[] = [
  {
    id: 'E001',
    title: '数据结构期中考试',
    subject: '数据结构',
    status: 'ongoing',
    startTime: '2026-03-28 09:00',
    endTime: '2026-03-28 11:00',
    duration: 120,
    totalScore: 100,
    questionIds: ['Q001', 'Q002', 'Q003', 'Q004', 'Q005', 'Q011', 'Q012', 'Q015', 'Q016', 'Q017'],
    class: '计科2101',
    college: '信息学院',
    createdBy: 'T001',
  },
  {
    id: 'E002',
    title: '计算机网络期末考试',
    subject: '计算机网络',
    status: 'pending',
    startTime: '2026-04-10 14:00',
    endTime: '2026-04-10 16:00',
    duration: 120,
    totalScore: 100,
    questionIds: ['Q006', 'Q007', 'Q008', 'Q009', 'Q010', 'Q013', 'Q014', 'Q018', 'Q019', 'Q020'],
    class: '计科2101',
    college: '信息学院',
    createdBy: 'T001',
  },
  {
    id: 'E003',
    title: '算法设计与分析小测',
    subject: '数据结构',
    status: 'pending',
    startTime: '2026-04-15 10:00',
    endTime: '2026-04-15 11:00',
    duration: 60,
    totalScore: 50,
    questionIds: ['Q002', 'Q003', 'Q004', 'Q011', 'Q012'],
    class: '计科2102',
    college: '信息学院',
    createdBy: 'T001',
  },
  {
    id: 'E004',
    title: '数据结构期末考试',
    subject: '数据结构',
    status: 'finished',
    startTime: '2025-12-20 09:00',
    endTime: '2025-12-20 11:00',
    duration: 120,
    totalScore: 100,
    questionIds: ['Q001', 'Q002', 'Q003', 'Q004', 'Q005', 'Q011', 'Q012', 'Q015', 'Q016', 'Q017'],
    class: '计科2101',
    college: '信息学院',
    createdBy: 'T001',
  },
  {
    id: 'E005',
    title: '计算机网络期中考试',
    subject: '计算机网络',
    status: 'finished',
    startTime: '2025-11-15 14:00',
    endTime: '2025-11-15 16:00',
    duration: 120,
    totalScore: 100,
    questionIds: ['Q006', 'Q007', 'Q008', 'Q009', 'Q010', 'Q013', 'Q014', 'Q018', 'Q019', 'Q020'],
    class: '计科2101',
    college: '信息学院',
    createdBy: 'T001',
  },
  {
    id: 'E006',
    title: '高等数学期末考试',
    subject: '高等数学',
    status: 'grading',
    startTime: '2026-03-25 09:00',
    endTime: '2026-03-25 11:30',
    duration: 150,
    totalScore: 100,
    questionIds: ['Q001', 'Q002', 'Q003', 'Q016', 'Q017', 'Q019'],
    class: '信息学院2022级全部班级',
    college: '信息学院',
    createdBy: 'T001',
  },
];

// ---- Submissions ----

const studentNames = [
  '张小明', '李华', '王芳', '赵磊', '陈静', '刘阳', '黄鑫', '周雪',
  '吴强', '徐丽', '孙伟', '朱晓燕', '马宇', '胡云', '郭力',
];

const classes = ['计科2101', '计科2102', '软工2101'];

export const mockSubmissions: Submission[] = Array.from({ length: 30 }, (_, i) => {
  const student = studentNames[i % studentNames.length];
  const exam = mockExams[(i % 2) + 3]; // finished exams
  const score = Math.floor(55 + Math.random() * 45);
  return {
    id: `SUB${String(i + 1).padStart(3, '0')}`,
    examId: exam.id,
    examTitle: exam.title,
    studentId: `S2021${String(i + 1).padStart(3, '0')}`,
    studentName: student,
    class: classes[i % classes.length],
    score,
    totalScore: 100,
    submitTime: `2025-12-20 ${String(9 + Math.floor(i / 5)).padStart(2, '0')}:${String(
      (i * 7) % 60
    ).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'partial' : 'graded',
    answers: {
      Q001: 'B',
      Q002: 'B',
      Q016: score > 75 ? '面向连接的TCP适合文件传输等需要可靠性的场景，无连接的UDP适合实时音视频等场景。' : '区别在于连接方式不同',
    },
  };
});

// ---- Stats ----

export const mockCollegeStats: CollegeStat[] = [
  { college: '信息学院', examCount: 42, studentCount: 1280, avgScore: 78.5, passRate: 91.2 },
  { college: '经济学院', examCount: 35, studentCount: 960, avgScore: 76.3, passRate: 89.5 },
  { college: '理工学院', examCount: 38, studentCount: 1120, avgScore: 74.8, passRate: 87.3 },
  { college: '文学院', examCount: 28, studentCount: 840, avgScore: 81.2, passRate: 94.1 },
  { college: '医学院', examCount: 52, studentCount: 720, avgScore: 72.6, passRate: 85.4 },
  { college: '法学院', examCount: 22, studentCount: 580, avgScore: 79.1, passRate: 90.8 },
  { college: '外语学院', examCount: 30, studentCount: 760, avgScore: 82.4, passRate: 93.6 },
  { college: '体育学院', examCount: 18, studentCount: 420, avgScore: 85.3, passRate: 96.2 },
];

export const mockMonthStats: MonthStat[] = [
  { month: '2025-10', examCount: 38, studentCount: 3200, avgScore: 76.5 },
  { month: '2025-11', examCount: 45, studentCount: 3800, avgScore: 78.2 },
  { month: '2025-12', examCount: 62, studentCount: 5200, avgScore: 77.8 },
  { month: '2026-01', examCount: 12, studentCount: 980, avgScore: 79.1 },
  { month: '2026-02', examCount: 28, studentCount: 2400, avgScore: 80.3 },
  { month: '2026-03', examCount: 41, studentCount: 3600, avgScore: 78.9 },
];

// ---- Student exam mock paper (20 questions) ----
// 10 choice + 5 fill + 3 short + 2 essay

export const mockExamPaper: Question[] = [
  // choices (1-10)
  { id: 'P001', type: 'choice', content: '以下哪种数据结构适合实现"先进先出"（FIFO）的操作？', options: ['A. 栈（Stack）', 'B. 队列（Queue）', 'C. 堆（Heap）', 'D. 树（Tree）'], answer: 'B', difficulty: 'easy', subject: '数据结构', score: 4 },
  { id: 'P002', type: 'choice', content: '一棵具有 n 个节点的完全二叉树，其高度为？', options: ['A. log₂n', 'B. ⌊log₂n⌋ + 1', 'C. ⌈log₂n⌉', 'D. n/2'], answer: 'B', difficulty: 'medium', subject: '数据结构', score: 4 },
  { id: 'P003', type: 'choice', content: '快速排序在最坏情况下的时间复杂度是？', options: ['A. O(n log n)', 'B. O(n)', 'C. O(n²)', 'D. O(log n)'], answer: 'C', difficulty: 'medium', subject: '数据结构', score: 4 },
  { id: 'P004', type: 'choice', content: '哈希表在理想情况下，查找的时间复杂度是？', options: ['A. O(1)', 'B. O(n)', 'C. O(log n)', 'D. O(n²)'], answer: 'A', difficulty: 'easy', subject: '数据结构', score: 4 },
  { id: 'P005', type: 'choice', content: '数组和链表的比较，正确的是？', options: ['A. 链表支持随机访问', 'B. 数组插入比链表高效', 'C. 链表在内存中连续存储', 'D. 数组支持随机访问，链表不支持'], answer: 'D', difficulty: 'easy', subject: '数据结构', score: 4 },
  { id: 'P006', type: 'choice', content: 'HTTP 协议属于 OSI 模型的哪一层？', options: ['A. 传输层', 'B. 网络层', 'C. 应用层', 'D. 表示层'], answer: 'C', difficulty: 'easy', subject: '计算机网络', score: 4 },
  { id: 'P007', type: 'choice', content: 'TCP 三次握手中，第二次握手服务器发送的标志位是？', options: ['A. SYN', 'B. ACK', 'C. SYN+ACK', 'D. FIN+ACK'], answer: 'C', difficulty: 'medium', subject: '计算机网络', score: 4 },
  { id: 'P008', type: 'choice', content: 'IP 地址 192.168.1.0/24 中，可用主机地址数量为？', options: ['A. 254', 'B. 256', 'C. 255', 'D. 253'], answer: 'A', difficulty: 'medium', subject: '计算机网络', score: 4 },
  { id: 'P009', type: 'choice', content: 'DNS 协议主要使用的传输层协议是？', options: ['A. TCP', 'B. UDP', 'C. ICMP', 'D. ARP'], answer: 'B', difficulty: 'easy', subject: '计算机网络', score: 4 },
  { id: 'P010', type: 'choice', content: 'HTTPS 默认使用的端口号是？', options: ['A. 80', 'B. 8080', 'C. 443', 'D. 22'], answer: 'C', difficulty: 'easy', subject: '计算机网络', score: 4 },
  // fill (11-15)
  { id: 'P011', type: 'fill', content: '二叉搜索树（BST）的中序遍历结果是______序列。', answer: '升序（有序）', keywords: ['升序', '有序'], difficulty: 'easy', subject: '数据结构', score: 4 },
  { id: 'P012', type: 'fill', content: '堆排序的时间复杂度为______。', answer: 'O(n log n)', keywords: ['O(n log n)'], difficulty: 'medium', subject: '数据结构', score: 4 },
  { id: 'P013', type: 'fill', content: 'TCP 四次挥手中，主动关闭方发出 FIN 后进入______状态。', answer: 'FIN_WAIT_1', keywords: ['FIN_WAIT_1'], difficulty: 'hard', subject: '计算机网络', score: 4 },
  { id: 'P014', type: 'fill', content: '子网掩码 255.255.255.0 对应的 CIDR 前缀长度是______。', answer: '/24', keywords: ['24', '/24'], difficulty: 'easy', subject: '计算机网络', score: 4 },
  { id: 'P015', type: 'fill', content: '图的深度优先搜索（DFS）通常使用______数据结构辅助实现。', answer: '栈（Stack）', keywords: ['栈', 'Stack'], difficulty: 'medium', subject: '数据结构', score: 4 },
  // short (16-18)
  { id: 'P016', type: 'short', content: '请简述 TCP 和 UDP 协议的主要区别，并各举一个适用场景。', answer: 'TCP 面向连接可靠；UDP 无连接不可靠', keywords: ['面向连接', '可靠', '无连接', 'TCP', 'UDP'], difficulty: 'medium', subject: '计算机网络', score: 8 },
  { id: 'P017', type: 'short', content: '请解释什么是哈希冲突，并说明至少两种解决方法。', answer: '哈希冲突是不同键映射到同一位置', keywords: ['哈希冲突', '开放地址', '链地址'], difficulty: 'medium', subject: '数据结构', score: 8 },
  { id: 'P018', type: 'short', content: '什么是 ARP 协议？请描述其工作过程。', answer: 'ARP 将 IP 解析为 MAC 地址', keywords: ['地址解析', 'MAC', 'IP', '广播'], difficulty: 'medium', subject: '计算机网络', score: 8 },
  // essay (19-20)
  { id: 'P019', type: 'essay', content: '请详细论述红黑树的性质，并分析其相比普通 BST 的优势及工程应用场景（不少于300字）。', answer: '红黑树五大性质...', keywords: ['自平衡', '红色', '黑色', '黑高度', 'O(log n)'], difficulty: 'hard', subject: '数据结构', score: 15 },
  { id: 'P020', type: 'essay', content: '请从协议栈角度，详细分析用户在浏览器输入 URL 并按回车后，到页面呈现的完整过程（不少于400字）。', answer: 'DNS→TCP→TLS→HTTP→渲染', keywords: ['DNS', 'TCP', 'HTTP', 'TLS', '三次握手', 'DOM'], difficulty: 'hard', subject: '计算机网络', score: 15 },
];

// Quick stats for teacher dashboard
export const mockTeacherStats = {
  questionBankTotal: 1284,
  semesterExams: 6,
  pendingGrading: 89,
  monthlyNew: 47,
};

// Quick stats for admin dashboard
export const mockAdminStats = {
  totalStudents: 6880,
  totalExams: 265,
  avgScore: 78.3,
  passRate: 90.1,
};

// Grade pass rate data for admin
export const mockGradePassRate = [
  { grade: '2021级', passRate: 92.3, count: 1680 },
  { grade: '2022级', passRate: 89.7, count: 1820 },
  { grade: '2023级', passRate: 87.2, count: 1760 },
  { grade: '2024级', passRate: 85.1, count: 1620 },
];

// ---- Monitor students (for ongoing exam view) ----

export interface MonitorStudent {
  id: string;
  name: string;
  class: string;
  status: 'answering' | 'submitted' | 'not_started' | 'abnormal';
  progress: number;
  totalQuestions: number;
  violations: number;
}

export const mockMonitorStudents: MonitorStudent[] = [
  { id: 'MS001', name: '王小明', class: '计科2201', status: 'answering', progress: 15, totalQuestions: 18, violations: 0 },
  { id: 'MS002', name: '张三', class: '计科2201', status: 'answering', progress: 8, totalQuestions: 18, violations: 2 },
  { id: 'MS003', name: '李四', class: '软工2201', status: 'submitted', progress: 18, totalQuestions: 18, violations: 3 },
  { id: 'MS004', name: '赵五', class: '计科2202', status: 'answering', progress: 12, totalQuestions: 18, violations: 0 },
  { id: 'MS005', name: '陈红', class: '计科2201', status: 'answering', progress: 16, totalQuestions: 18, violations: 0 },
  { id: 'MS006', name: '刘明', class: '软工2201', status: 'not_started', progress: 0, totalQuestions: 18, violations: 0 },
  { id: 'MS007', name: '周萌', class: '计科2202', status: 'answering', progress: 9, totalQuestions: 18, violations: 1 },
  { id: 'MS008', name: '吴杰', class: '计科2201', status: 'submitted', progress: 18, totalQuestions: 18, violations: 0 },
  { id: 'MS009', name: '徐丽', class: '软工2202', status: 'answering', progress: 11, totalQuestions: 18, violations: 0 },
  { id: 'MS010', name: '孙伟', class: '计科2203', status: 'answering', progress: 14, totalQuestions: 18, violations: 0 },
];

// ---- Class ranking for admin dashboard ----

export interface ClassRankStat {
  rank: number;
  class: string;
  college: string;
  avgScore: number;
  passRate: number;
  maxScore: number;
  minScore: number;
  count: number;
}

export const mockClassRanking: ClassRankStat[] = [
  { rank: 1, class: '计科2201', college: '信息学院', avgScore: 82.3, passRate: 94, maxScore: 98, minScore: 62, count: 45 },
  { rank: 2, class: '软工2201', college: '信息学院', avgScore: 79.8, passRate: 91, maxScore: 96, minScore: 55, count: 43 },
  { rank: 3, class: '计科2203', college: '信息学院', avgScore: 77.5, passRate: 88, maxScore: 95, minScore: 48, count: 46 },
  { rank: 4, class: '计科2202', college: '信息学院', avgScore: 75.1, passRate: 85, maxScore: 92, minScore: 42, count: 44 },
  { rank: 5, class: '软工2202', college: '信息学院', avgScore: 72.4, passRate: 82, maxScore: 91, minScore: 38, count: 42 },
];

// ---- Score distribution for admin dashboard ----

export interface ScoreDistItem {
  range: string;
  count: number;
}

export const mockScoreDistribution: ScoreDistItem[] = [
  { range: '<40', count: 3 },
  { range: '40-49', count: 8 },
  { range: '50-59', count: 15 },
  { range: '60-69', count: 28 },
  { range: '70-79', count: 62 },
  { range: '80-89', count: 78 },
  { range: '90-100', count: 46 },
];

// Question type score rates (avg scored % per type)
export const mockTypeScoreRates = [
  { type: '选择题', rate: 82 },
  { type: '填空题', rate: 75 },
  { type: '简答题', rate: 63 },
  { type: '论述题', rate: 55 },
];

// Student's historical scores
export const mockStudentScores = [
  { id: 'SS001', examId: 'E004', examTitle: '数据结构期末考试', subject: '数据结构', score: 87, totalScore: 100, submitTime: '2025-12-20 10:45', status: 'graded', rank: 12, classSize: 45 },
  { id: 'SS002', examId: 'E005', examTitle: '计算机网络期中考试', subject: '计算机网络', score: 79, totalScore: 100, submitTime: '2025-11-15 15:30', status: 'graded', rank: 18, classSize: 45 },
  { id: 'SS003', examId: 'E003', examTitle: '算法设计与分析小测', subject: '数据结构', score: 44, totalScore: 50, submitTime: '2025-10-22 11:00', status: 'graded', rank: 8, classSize: 42 },
];
