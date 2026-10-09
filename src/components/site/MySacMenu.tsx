import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { openAccountEditProfile } from "./AccountEditProfile";
import { openAccountInformation } from "./AccountInformation";
import { cn } from "@/lib/utils";
import { MyAvatar } from "./MyAvatar";
import { useHasCommunityProfile } from "@/lib/community-profile";

export type Row = { label: string; to?: string; tab?: string; community?: boolean; accountInfo?: boolean };
export const sections: { title: string; rows: Row[] }[] = [
  { title: "Account", rows: [{ label: "Account Information", accountInfo: true }] },
  {
    title: "My SAC",
    rows: [
      { label: "Tickets", to: "/account/tickets", tab: "All" },
      { label: "Purchased Events", to: "/account/tickets", tab: "Purchased" },
      { label: "Saved Events", to: "/account/tickets", tab: "Saved Events" },
      { label: "Booking History", to: "/account/tickets", tab: "Booking History" },
      { label: "Event Activity" },
    ],
  },
  { title: "Community", rows: [{ label: "Community Profile", community: true }] },
  {
    title: "Account & Support",
    rows: [
      { label: "Notifications" },
      { label: "Settings & Preferences" },
    ],
  },
];

const rowCls = "block px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-ink-foreground/5 hover:text-primary";

export function MySacMenu({ open, onClose, top }: { open: boolean; onClose: () => void; top: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasCommunity = useHasCommunityProfile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current?.contains(t) || t.closest("[data-mysac-trigger]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="My SAC"
      className={cn(
        "fixed right-3 z-[46] hidden w-[300px] max-w-[calc(100vw-1.5rem)] origin-top-right rounded-[14px] border border-ink-border bg-ink text-ink-foreground shadow-2xl transition-[opacity,visibility,transform] duration-200 md:block md:right-8",
        open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
      )}
      style={{ top }}
    >
      <div className="overflow-hidden rounded-[13px]"><div className="max-h-[calc(100dvh-6rem)] overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-ink-border p-4">
          <MyAvatar size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">You</div>
            <div className="truncate text-xs opacity-60">@you</div>
          </div>
          <button type="button" onClick={() => { onClose(); openAccountEditProfile(); }} className="shrink-0 border border-ink-border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary">
            Edit Profile
          </button>
        </div>
        {sections.map((s) => (
          <div key={s.title} className="border-b border-ink-border py-2">
            <div className="px-4 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{s.title}</div>
            {s.rows.map((r) => (
              r.community ? (
                <Link key={r.label} to="/community-profile" onClick={onClose} className={rowCls}>
                  {hasCommunity ? "Manage Community Profile" : "Create Community Profile"}
                </Link>
              ) : r.to ? (
                <Link key={r.label} to={r.to} search={({ tab: r.tab }) as never} onClick={onClose} className={rowCls}>
                  {r.label}
                </Link>
              ) : r.accountInfo ? (
                <button key={r.label} type="button" onClick={() => { onClose(); openAccountInformation(); }} className={cn(rowCls, "w-full text-left")}>
                  {r.label}
                </button>
              ) : (
                <button key={r.label} type="button" className={cn(rowCls, "w-full text-left")}>
                  {r.label}
                </button>
              )
            ))}
          </div>
        ))}
        <button type="button" className="block w-full text-left px-4 py-3 text-[13px] font-semibold transition-colors hover:text-primary">
          Logout
        </button>
      </div></div>
    </div>
  );
}
