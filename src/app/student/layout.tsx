import { StudentTopBar } from '@/components/layout/StudentTopBar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentTopBar />
      <main className="pt-14">{children}</main>
    </div>
  );
}
