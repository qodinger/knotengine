"use client";

export function EcosystemHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Ecosystem</h1>
          <div className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border border-purple-500/20">
            Partners
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Supercharge your merchant operations with our trusted Web3 partners.
        </p>
      </div>
    </div>
  );
}
