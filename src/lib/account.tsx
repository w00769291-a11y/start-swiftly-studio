import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AccountType } from './account-rules';
const AccountContext = createContext<{user: User | null; loading: boolean}>({user:null, loading:true});
export function AccountProvider({children}: {children:ReactNode}) {
  const [state,setState] = useState<{user:User|null;loading:boolean}>({user:null,loading:true});
  const router=useRouter(); const queries=useQueryClient();
  useEffect(()=>{
    let live=true;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if (live) setState({user:session?.user??null,loading:false});
      if (['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) {
        void router.invalidate();
        if(event!=='SIGNED_OUT') void queries.invalidateQueries();
      }
    });
    void supabase.auth.getUser().then(({data})=>{if(live)setState({user:data.user,loading:false});});
    return ()=>{live=false;subscription.unsubscribe();};
  },[router,queries]);
  return <AccountContext.Provider value={state}>{children}</AccountContext.Provider>;
}
export function useAccount() {
  const state=useContext(AccountContext);
  const profile=useQuery({queryKey:['account-profile',state.user?.id],enabled:!!state.user,queryFn:async()=>{
    const {data,error}=await supabase.from('profiles').select('*').eq('id',state.user?.id??'').single(); if(error)throw error; return data;
  }});
  const role=useQuery({queryKey:['account-type',state.user?.id],enabled:!!state.user,queryFn:async()=>{
    const {data,error}=await supabase.from('user_roles').select('role').eq('user_id',state.user?.id??'').single(); if(error)throw error; return data.role as AccountType;
  }});
  return {...state,profile:profile.data,accountType:role.data??'personal' as AccountType};
}
export async function signOutAccount(queryClient:ReturnType<typeof useQueryClient>) {
  await queryClient.cancelQueries(); queryClient.clear();
  const {error}=await supabase.auth.signOut(); if(error)throw error;
}
