"use client";

export function EcosystemHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Ecosystem</h1>
          <div className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-purple-500 uppercase">
            Partners
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Supercharge your merchant operations with our trusted Web3 partners.
        </p>
      </div>
    </div>
  );
}
