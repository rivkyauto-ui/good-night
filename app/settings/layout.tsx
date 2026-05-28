import BottomNav from "@/components/BottomNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="max-w-4xl mx-auto w-full pb-20" style={{ minHeight: "100dvh" }}>
        {children}
      </div>
      <BottomNav />
    </>
  );
}
