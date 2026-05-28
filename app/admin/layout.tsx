export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto w-full min-h-dvh">
      {children}
    </div>
  );
}
