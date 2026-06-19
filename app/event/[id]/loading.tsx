export default function Loading() {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="aspect-[16/10] animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-5 py-2">
            <div className="h-7 w-28 animate-pulse rounded bg-violet-100" />
            <div className="h-12 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}
