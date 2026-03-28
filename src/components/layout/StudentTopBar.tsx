'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LogOut, Bell, CheckCircle2, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/student', label: '我的考试' },
  { href: '/student/scores', label: '成绩查询' },
  { href: '/student/practice', label: '题库练习' },
];

const MOCK_NOTIFS = [
  {
    id: 1,
    icon: <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />,
    title: '数据结构 期末考试成绩已发布',
    body: '你的成绩：87分，班级排名 5/45',
    time: '1小时前',
    read: false,
  },
  {
    id: 2,
    icon: <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />,
    title: '计算机网络 期末考试通知',
    body: '考试时间：2026-04-10 14:00，请提前确认考场',
    time: '3天前',
    read: false,
  },
];

export function StudentTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const unread = MOCK_NOTIFS.filter(n => !readIds.has(n.id)).length;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-30 flex items-center px-6 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#002045' }}
        >
          <GraduationCap size={16} className="text-white" />
        </div>
        <span className="font-bold text-sm" style={{ color: '#002045' }}>
          智考云
        </span>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === '/student' ? pathname === '/student' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              style={isActive ? { background: '#002045' } : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Notification + User */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell size={17} className="text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b">
                <span className="text-sm font-semibold">消息通知</span>
                {unread > 0 && (
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setReadIds(new Set(MOCK_NOTIFS.map(n => n.id)))}
                  >
                    全部已读
                  </button>
                )}
              </div>
              {MOCK_NOTIFS.map(n => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors',
                      !isRead && 'bg-blue-50/30'
                    )}
                    onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
                  >
                    {n.icon}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm text-gray-900', !isRead && 'font-medium')}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{currentUser?.name ?? '同学'}</p>
          <p className="text-xs text-muted-foreground">{currentUser?.class ?? ''}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut size={15} />
          退出
        </Button>
      </div>
    </header>
  );
}
