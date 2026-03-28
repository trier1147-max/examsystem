'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Shield, ChevronRight, User, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { mockTeacher, mockStudent, mockAdmin } from '@/mock/data';
import { cn } from '@/lib/utils';

type RoleKey = 'teacher' | 'student' | 'admin' | 'multi';

const roles = [
  {
    key: 'teacher' as RoleKey,
    label: '教师',
    desc: '管理题库、组卷、阅卷',
    icon: BookOpen,
    account: 'teacher001',
    password: '123456',
    color: '#002045',
  },
  {
    key: 'student' as RoleKey,
    label: '学生',
    desc: '参加考试、查看成绩',
    icon: GraduationCap,
    account: 'S2021001',
    password: '123456',
    color: '#006c4a',
  },
  {
    key: 'admin' as RoleKey,
    label: '行政管理',
    desc: '数据看板与报表',
    icon: Shield,
    account: 'admin001',
    password: '123456',
    color: '#7c3aed',
  },
  {
    key: 'multi' as RoleKey,
    label: '多角色用户',
    desc: '教师兼教学秘书',
    icon: Users,
    account: 'multi001',
    password: '123456',
    color: '#b45309',
  },
];

// Multi-role user's available roles
const MULTI_ROLE_OPTIONS = [
  { key: 'teacher' as const, label: '教师', desc: '课程：数据结构、计算机网络', color: '#002045', icon: BookOpen },
  { key: 'admin' as const,   label: '行政管理（信息学院）', desc: '学院教学秘书', color: '#7c3aed', icon: Shield },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);

  const currentRole = roles.find((r) => r.key === selectedRole);

  const handleLogin = async () => {
    if (!selectedRole) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (selectedRole === 'teacher') {
      setUser(mockTeacher);
      router.push('/teacher');
    } else if (selectedRole === 'student') {
      setUser(mockStudent);
      router.push('/student');
    } else if (selectedRole === 'admin') {
      setUser(mockAdmin);
      router.push('/admin/dashboard');
    } else if (selectedRole === 'multi') {
      // Multi-role: show role selector dialog
      setLoading(false);
      setRoleSelectorOpen(true);
      return;
    }
    setLoading(false);
  };

  const handleMultiRoleSelect = (key: 'teacher' | 'admin') => {
    setRoleSelectorOpen(false);
    if (key === 'teacher') {
      setUser(mockTeacher);
      router.push('/teacher');
    } else {
      setUser(mockAdmin);
      router.push('/admin/dashboard');
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)' }}
    >
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 p-12 text-white"
        style={{ background: 'linear-gradient(180deg, #002045 0%, #003575 100%)' }}
      >
        <div>
          <div className="text-3xl font-bold mb-2">智考云</div>
          <div className="text-white/60 text-sm">智能化在线考试管理平台</div>
        </div>
        <div className="space-y-6">
          {['智能题库管理', '自动组卷系统', '实时考试监控', '数据分析报表'].map((f) => (
            <div key={f} className="flex items-center gap-3 text-white/80">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              {f}
            </div>
          ))}
        </div>
        <div className="text-white/30 text-xs">© 2026 智考云 版权所有</div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">欢迎登录</h1>
            <p className="text-muted-foreground text-sm mt-1">请选择您的身份角色</p>
          </div>

          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ key, label, desc, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={cn(
                  'p-4 rounded-xl border-2 text-center transition-all cursor-pointer',
                  selectedRole === key
                    ? 'shadow-md scale-[1.02]'
                    : 'border-border bg-white hover:border-gray-300 hover:shadow-sm'
                )}
                style={
                  selectedRole === key
                    ? { borderColor: color, background: color + '15' }
                    : {}
                }
              >
                <Icon
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: selectedRole === key ? color : '#6b7280' }}
                />
                <div className="font-semibold text-sm text-gray-800">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>

          {/* Login form */}
          {selectedRole && currentRole && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{currentRole.label}登录</CardTitle>
                <CardDescription className="text-xs">
                  演示账号：{currentRole.account}&nbsp;&nbsp;密码：{currentRole.password}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="account" className="text-sm">账号</Label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="account"
                      defaultValue={currentRole.account}
                      className="pl-9"
                      placeholder="请输入账号"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">密码</Label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="password"
                      type="password"
                      defaultValue={currentRole.password}
                      className="pl-9"
                      placeholder="请输入密码"
                    />
                  </div>
                </div>
                <Button
                  className="w-full gap-1 text-white"
                  onClick={handleLogin}
                  disabled={loading}
                  style={{ background: currentRole.color, borderColor: currentRole.color }}
                >
                  {loading ? '登录中...' : '立即登录'}
                  {!loading && <ChevronRight size={16} />}
                </Button>
              </CardContent>
            </Card>
          )}

          {!selectedRole && (
            <p className="text-center text-sm text-muted-foreground">↑ 请先选择角色</p>
          )}
        </div>
      </div>

      {/* ── Multi-role selector dialog ── */}
      <Dialog open={roleSelectorOpen} onOpenChange={setRoleSelectorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              选择当前登录角色
            </DialogTitle>
            <DialogDescription>
              你的账号绑定了多个角色，请选择本次登录要使用的身份
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            {MULTI_ROLE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleMultiRoleSelect(opt.key)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:shadow-md transition-all text-left"
                  style={{ borderColor: opt.color + '40' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: opt.color + '15' }}
                  >
                    <Icon size={20} style={{ color: opt.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
