'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, BarChart2, ClipboardList, FileSearch, Bell, LogOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

// Pending appeal count — in a real app this would come from global state / SWR
const PENDING_APPEALS = 3;

const navItems = [
  { href: '/admin/dashboard', label: '学院仪表盘', icon: Home,          badge: 0 },
  { href: '/admin/exams',     label: '考试管理',   icon: ClipboardList, badge: 0 },
  { href: '/admin/analysis',  label: '成绩分析',   icon: BarChart2,     badge: 0 },
  { href: '/admin/appeals',   label: '成绩申诉',   icon: FileSearch,    badge: PENDING_APPEALS },
  { href: '/admin/notifications', label: '通知中心', icon: Bell,         badge: 0 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useStore();

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
        <span className="ml-2 text-white/50 text-xs">管理端</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
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
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: '#1a365d', color: 'white' }}
          >
            {currentUser?.name?.[0] ?? '管'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser?.name ?? '管理员'}</p>
            <p className="text-white/50 text-xs truncate">教学秘书 · 信息学院</p>
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
