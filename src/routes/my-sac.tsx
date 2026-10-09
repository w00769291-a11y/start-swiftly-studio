import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { sections } from "@/components/site/MySacMenu";
import { MyAvatar } from "@/components/site/MyAvatar";
import { useHasCommunityProfile } from "@/lib/community-profile";
import { openAccountEditProfile } from "@/components/site/AccountEditProfile";
import { openAccountInformation } from "@/components/site/AccountInformation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-sac")({
  head: () => ({
    meta: [
      { title: "My Profile — SAC COMMUNITY" },
      { name: "description", content: "Your SAC account: tickets, saved events, booking history and settings." },
      { property: "og:title", content: "My Profile — SAC COMMUNITY" },
      { property: "og:description", content: "Your SAC account: tickets, saved events, booking history and settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MySacPage,
});

const rowCls = "flex min-h-12 w-full items-center justify-between px-4 text-left text-[15px] font-medium transition-colors active:bg-foreground/5 hover:text-primary";

function MySacPage() {
  const hasCommunity = useHasCommunityProfile();
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-background px-4 pb-16 pt-20 text-foreground">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3 py-4">
          <MyAvatar size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl">You</h1>
            <div className="truncate text-sm text-muted-foreground">@you</div>
          </div>
          <button type="button" onClick={openAccountEditProfile} className="inline-flex min-h-11 shrink-0 items-center border border-border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:border-primary hover:text-primary">
            Edit Profile
          </button>
        </div>

        {sections.map((s) => (
          <section key={s.title} className="mt-4">
            <h2 className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{s.title}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {s.rows.map((r) =>
                r.community ? (
                  <Link key={r.label} to="/community-profile" className={rowCls}>
                    {hasCommunity ? "Manage Community Profile" : "Create Community Profile"}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                ) : r.to ? (
                  <Link key={r.label} to={r.to} search={({ tab: r.tab }) as never} className={rowCls}>
                    {r.label}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                ) : (
                  <button key={r.label} type="button" onClick={r.accountInfo ? openAccountInformation : undefined} className={rowCls}>
                    {r.label}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </button>
                ),
              )}
            </div>
          </section>
        ))}

        <button type="button" className={cn(rowCls, "mt-6 justify-center rounded-xl border border-border font-semibold")}>
          Logout
        </button>
      </div>
    </div>
  );
}
