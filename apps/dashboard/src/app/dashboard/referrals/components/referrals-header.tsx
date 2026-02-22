"use client";

export function ReferralsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <div className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border border-emerald-500/20">
            Earn 10%
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Invite other merchants to KnotEngine and earn a 10% bonus on every
          credit top-up they make.
        </p>
      </div>
    </div>
  );
}
