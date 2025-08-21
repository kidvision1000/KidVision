import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="grid gap-4">
      <div className="p-6 rounded-2xl border">
        <div className="flex items-center gap-3 mb-3">
          <Image src="/kidvision-logo.png" alt="KidVisions" width={40} height={40} />
          <h1 className="text-2xl font-bold">KidVisions Teacher Observation Tool</h1>
        </div>
        <p>Welcome! This is the base app. Add your Supabase URL/keys, then start building.</p>
        <div className="mt-3 flex gap-2">
          <Link className="underline" href="/offline">Offline page</Link>
          <Link className="underline" href="/api/standards">Standards API</Link>
        </div>
      </div>
    </div>
  );
}
