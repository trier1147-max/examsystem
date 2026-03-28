import { TeacherSidebar } from '@/components/layout/TeacherSidebar';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeacherSidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-auto">{children}</main>
    </div>
  );
}
