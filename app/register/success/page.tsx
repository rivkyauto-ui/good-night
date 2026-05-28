import Image from "next/image";

export default function RegisterSuccessPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 text-center gap-6 max-w-[480px] mx-auto w-full">
      <Image src="/good%20night%20logo-icon-neto.png" alt="Good Night" width={160} height={160} />
      <h1 className="text-3xl font-bold" style={{ color: "var(--amber)" }}>
        הבקשה התקבלה!
      </h1>
      <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
        פרטיך נשלחו לאישור.
        <br />
        נחזור אליך בהקדם עם אישור גישה למערכת.
      </p>
    </main>
  );
}
