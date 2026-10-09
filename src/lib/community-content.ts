import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from './account';
import type { Tables } from '@/integrations/supabase/types';
import type { ExploreItem } from './explore-data';
export type CommunityContent = Tables<'community_content'> & { urls: string[] };
export function useCommunityContent() {
  const {user}=useAccount();
  return useQuery({queryKey:['community-content',user?.id],enabled:!!user,queryFn:async()=>{
    const {data,error}=await supabase.from('community_content').select('*').order('created_at',{ascending:false}); if(error)throw error;
    return Promise.all(data.map(async row=>{
      const urls=await Promise.all(row.media.map(async path=>{
        const {data,error}=await supabase.storage.from('community-media').createSignedUrl(path,3600); if(error)throw error;return data.signedUrl;
      })); return {...row,urls};
    }));
  }});
}
export function asExploreItem(row:CommunityContent,own:boolean,name='Community'):ExploreItem {
  return {id:row.id,kind:row.kind==='reel'?'reel':'post',tag:'Community',img:row.kind==='reel'?'':row.urls[0]??'',...(row.kind==='reel'&&row.urls[0]?{video:row.urls[0]}:{}),...(row.kind==='post'?{images:row.urls}:{}),...(row.kind==='tweet'?{text:{headline:row.caption,bg:0}}:{}),caption:row.caption,creator:name,handle:own?'you':row.user_id,likes:0,comments:[],ageH:(Date.now()-Date.parse(row.created_at))/3600000};
}
