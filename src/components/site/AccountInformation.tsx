import { useSyncExternalStore, type ReactNode } from "react";
import { ResponsiveOverlay } from "@/components/explore/shared";
import { toast } from "@/lib/explore-service";

/**
 * Global account-level Account Information panel (account settings, separate from profile editing).
 * Sign-in isn't connected yet, so account actions are shown as structure only and say so honestly.
 */
let open = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function openAccountInformation() { open = true; emit(); }
function setOpen(o: boolean) { open = o; emit(); }
function useOpen() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => open, () => false);
}

const soon = () => toast("Available once sign-in is connected");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-ink-border py-3 last:border-b-0">
      <h3 className="pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{title}</h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Row({ label, value, danger }: { label: string; value?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={soon} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[13px] transition-colors hover:text-primary">
      <span className={danger ? "font-semibold text-primary" : "font-medium"}>{label}</span>
      {value && <span className="min-w-0 truncate text-[12px] text-ink-muted">{value}</span>}
    </button>
  );
}

export function AccountInformation() {
  const isOpen = useOpen();
  return (
    <ResponsiveOverlay open={isOpen} onOpenChange={setOpen} title="Account information">
      <div className="max-h-[85dvh] overflow-y-auto overflow-x-hidden p-4">
        <h2 className="pb-1 text-center text-[15px] font-semibold">Account information</h2>
        <p className="pb-2 text-center text-[12px] text-ink-muted">Sign-in isn't connected yet, so these settings can't be changed right now.</p>
        <Section title="Account details">
          <Row label="Email address" value="Not added" />
          <Row label="Phone number" value="Not added" />
          <Row label="Member since" value="—" />
        </Section>
        <Section title="Login & security">
          <Row label="Change password" />
          <Row label="Login activity" />
          <Row label="Two-factor authentication" value="Not available" />
        </Section>
        <Section title="Account status">
          <Row label="Account type" value="SAC member" />
          <Row label="Verification" value="Not verified" />
        </Section>
        <Section title="Privacy & visibility">
          <Row label="Who can see your profile" value="Everyone" />
          <Row label="Who can follow you" value="Everyone" />
          <Row label="Who can message you" value="Everyone" />
        </Section>
        <Section title="Connected accounts">
          <Row label="Google" value="Not connected" />
        </Section>
        <Section title="Account management">
          <Row label="Log out" />
          <Row label="Deactivate account" danger />
          <Row label="Delete account" danger />
        </Section>
        <button type="button" onClick={() => setOpen(false)} className="mt-3 h-9 w-full rounded-lg border border-ink-border text-[13px] font-bold uppercase tracking-[0.14em] hover:opacity-80">Close</button>
      </div>
    </ResponsiveOverlay>
  );
}
