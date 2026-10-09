import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import { ResponsiveOverlay } from '@/components/explore/shared';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/lib/account';
import { useCommunityContent } from '@/lib/community-content';
export function UploadedEvents({open,onClose}:{open:boolean;onClose:()=>void}) {
  const {user}=useAccount();const content=useCommunityContent();const events=content.data?.filter(r=>r.kind==='event')??[];
  return <ResponsiveOverlay open={open} onOpenChange={o=>{if(!o)onClose();}} title="Uploaded events"><div className="max-h-[75dvh] overflow-y-auto p-5"><h2 className="mb-4 font-display text-2xl">Events</h2>
    {!user?<Button asChild><Link to="/login">Log in to see uploaded events</Link></Button>:content.isPending?<p>Loading events…</p>:content.isError?<p role="alert">Could not load events.</p>:!events.length?<p className="text-ink-muted">No uploaded events yet.</p>:events.map(event=><article key={event.id} className="mb-5 border-b border-ink-border pb-5">{event.urls[0]&&<img src={event.urls[0]} alt={event.title} className="mb-3 aspect-[4/3] w-full object-cover"/>}<h3 className="text-lg font-semibold">{event.title}</h3><p className="mt-1 text-sm text-ink-muted">{event.caption}</p><p className="mt-2 flex items-center gap-2 text-sm"><MapPin size={16}/>{event.city}</p><p className="mt-1 flex items-center gap-2 text-sm"><CalendarDays size={16}/>{event.event_date?new Date(event.event_date).toLocaleString():''}</p><p className="mt-2 font-semibold text-primary">{event.price===0?'Free':`₹${event.price}`}</p>{content.data?.filter(t=>t.kind==='ticket'&&t.event_id===event.id).map(t=><p key={t.id} className="mt-2 text-sm">{t.title} · ₹{t.price}</p>)}</article>)}
  </div></ResponsiveOverlay>;
}
