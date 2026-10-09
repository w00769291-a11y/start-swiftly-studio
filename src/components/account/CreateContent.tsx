import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clapperboard, Grid3x3, MessageSquare, Ticket } from 'lucide-react';
import { ResponsiveOverlay } from '@/components/explore/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAccount } from '@/lib/account';
import { createOptions, type CreateKind } from '@/lib/account-rules';
import { useCommunityContent } from '@/lib/community-content';
import { supabase } from '@/integrations/supabase/client';
const icons={Post:Grid3x3,Reel:Clapperboard,Tweet:MessageSquare,Event:CalendarDays,Ticket};
export function CreateContent({open,onClose}:{open:boolean;onClose:()=>void}) {
  const {user,accountType}=useAccount();const queries=useQueryClient();
  const [kind,setKind]=useState<CreateKind|null>(null);const [switching,setSwitching]=useState(false);
  const close=()=>{setKind(null);onClose();};
  const switchType=async()=>{setSwitching(true);const next=accountType==='business'?'personal':'business';const {error}=await supabase.rpc('set_account_type',{account_type:next});if(!error)await queries.invalidateQueries({queryKey:['account-type']});setSwitching(false);};
  return <ResponsiveOverlay open={open} onOpenChange={o=>{if(!o)close();}} title={kind?`New ${kind.toLowerCase()}`:'Create'}>
    <div className="max-h-[75dvh] overflow-y-auto p-5">
      <h2 className="mb-4 text-center font-semibold">{kind?`New ${kind.toLowerCase()}`:'Create'}</h2>
      {!user?<Button asChild className="w-full"><Link to="/login">Log in to create</Link></Button>:kind?<Composer kind={kind} onClose={close}/>:<>{createOptions(accountType).map(k=>{const Icon=icons[k];return <Button key={k} variant="ghost" className="h-12 w-full justify-start" onClick={()=>setKind(k)}><Icon/>{k}</Button>;})}<div className="mt-4 border-t border-ink-border pt-4 text-center text-sm"><p className="text-ink-muted capitalize">{accountType} account</p><Button variant="link" disabled={switching} onClick={switchType}>{switching?'Switching…':accountType==='business'?'Switch to personal account':'Switch to business account (events & tickets)'}</Button></div></>}
    </div>
  </ResponsiveOverlay>;
}
function Composer({kind,onClose}:{kind:CreateKind;onClose:()=>void}) {
  const {user,accountType}=useAccount(); const queries=useQueryClient(); const content=useCommunityContent();
  const [files,setFiles]=useState<File[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const isEvent=kind==='Event';const isTicket=kind==='Ticket';const isTweet=kind==='Tweet';
  const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); if(!user||!createOptions(accountType).includes(kind))return;
    const form=new FormData(e.currentTarget);setBusy(true);setError(''); const paths:string[]=[];
    try {
      if((kind==='Post'||kind==='Reel'||isEvent)&&!files.length)throw new Error('Choose a photo or video first.');
      for(const file of files){const path=`${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;const {error}=await supabase.storage.from('community-media').upload(path,file);if(error)throw error;paths.push(path);}
      const date=String(form.get('date')??'');
      const {error}=await supabase.from('community_content').insert({user_id:user.id,kind:kind.toLowerCase(),title:String(form.get('title')??'').trim(),caption:String(form.get('caption')??'').trim(),media:paths,city:String(form.get('city')??'').trim(),event_date:date?new Date(date).toISOString():null,price:Number(form.get('price')??0),event_id:isTicket?String(form.get('event')):null});if(error)throw error;
      await queries.invalidateQueries({queryKey:['community-content']});onClose();
    }catch(err){if(paths.length)await supabase.storage.from('community-media').remove(paths);setError(err instanceof Error?err.message:'Could not publish. Please try again.');}finally{setBusy(false);}
  };
  const ownEvents=content.data?.filter(r=>r.kind==='event'&&r.user_id===user?.id)??[];
  return <form onSubmit={submit} className="space-y-4">
    {(isEvent||isTicket)&&<label className="block text-sm">{isEvent?'Event name':'Ticket name'}<Input name="title" required maxLength={120} className="mt-1"/></label>}
    {!isTweet&&!isTicket&&<label className="block text-sm">{kind==='Reel'?'Video':'Photos'}<Input type="file" aria-label={kind==='Reel'?'Video':'Photos'} accept={kind==='Reel'?'video/*':'image/*'} multiple={kind==='Post'} className="mt-1" onChange={e=>{const list=Array.from(e.target.files??[]);if(list.some(f=>!(kind==='Reel'?f.type.startsWith('video/'):f.type.startsWith('image/')))){setError('Choose the correct media type.');setFiles([]);}else{setError('');setFiles(list);}}}/></label>}
    <label className="block text-sm">{isTweet?'Tweet':'Description'}<Textarea name="caption" required={isTweet} maxLength={isTweet?280:2000} className="mt-1"/></label>
    {isEvent&&<><label className="block text-sm">City<Input name="city" required className="mt-1"/></label><label className="block text-sm">Date and time<Input name="date" type="datetime-local" required className="mt-1"/></label></>}
    {isTicket&&<label className="block text-sm">Event<select name="event" required className="mt-1 h-10 w-full rounded-md border border-ink-border bg-ink px-2"><option value="">Select your event</option>{ownEvents.map(r=><option value={r.id} key={r.id}>{r.title}</option>)}</select>{!ownEvents.length&&<p className="mt-1 text-xs text-ink-muted">Create an event first.</p>}</label>}
    {(isEvent||isTicket)&&<label className="block text-sm">Price (₹)<Input name="price" type="number" min="0" step="0.01" defaultValue="0" required className="mt-1"/></label>}
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button className="w-full" disabled={busy||(isTicket&&!ownEvents.length)}>{busy?'Publishing…':`Publish ${kind.toLowerCase()}`}</Button>
  </form>;
}
