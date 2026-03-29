'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Shield, ChevronRight, User, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { mockTeacher, mockStudent, mockAdmin } from '@/mock/data';
import { cn } from '@/lib/utils';

type RoleKey = 'teacher' | 'student' | 'admin';

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
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [loading, setLoading] = useState(false);

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
    }
    setLoading(false);
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
          <div className="grid grid-cols-3 gap-3">
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
    </div>
  );
}
