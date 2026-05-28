export default function DebugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto w-full pb-10">
      {children}
    </div>
  );
}
