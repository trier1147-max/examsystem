'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Layers,
  ClipboardList,
  PenLine,
  BarChart2,
  LogOut,
  Bell,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const TEACHER_NOTIFS = [
  {
    id: 1,
    urgent: true,
    icon: <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />,
    title: '高等数学 期末考试阅卷逾期提醒',
    body: '距截止日期（3月31日）还有 3 天，尚有 775 份主观题待批改',
    time: '2小时前',
  },
  {
    id: 2,
    urgent: false,
    icon: <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />,
    title: '数据结构 期末考试成绩已发布',
    body: '全班 280 人成绩已公示，平均分 82.3 分',
    time: '昨天',
  },
];

const navItems = [
  { href: '/teacher', label: '首页', icon: Home },
  { href: '/teacher/question-bank', label: '题库管理', icon: BookOpen },
  { href: '/teacher/create-exam', label: '智能组卷', icon: Layers },
  { href: '/teacher/exams', label: '考试管理', icon: ClipboardList },
  { href: '/teacher/grading', label: '阅卷中心', icon: PenLine },
  { href: '/teacher/scores', label: '成绩管理', icon: BarChart2 },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = TEACHER_NOTIFS.length;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-30"
      style={{ background: '#002045' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="text-white text-xl font-bold tracking-wide">智考云</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/teacher' ? pathname === '/teacher' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Notification bell */}
      <div className="px-3 pb-2 relative">
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Bell size={18} />
          <span className="flex-1 text-left">消息通知</span>
          {unreadCount > 0 && (
            <span className="min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute left-full ml-2 bottom-0 w-80 bg-white rounded-xl border shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <span className="text-sm font-semibold text-gray-900">消息通知</span>
              <button className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setNotifOpen(false)}>关闭</button>
            </div>
            {TEACHER_NOTIFS.map(n => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40',
                  n.urgent && 'bg-red-50/40'
                )}
              >
                {n.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                </div>
                {n.urgent && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: '#1a365d', color: 'white' }}
          >
            {currentUser?.name?.[0] ?? '教'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser?.name ?? '教师'}</p>
            <p className="text-white/50 text-xs truncate">{currentUser?.college ?? '信息学院'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/65 hover:bg-white/10 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
