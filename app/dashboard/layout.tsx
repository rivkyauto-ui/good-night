import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="max-w-4xl mx-auto w-full pb-20">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
