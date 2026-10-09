import { describe,it,expect } from 'vitest';
import { createOptions } from '@/lib/account-rules';
describe('Account publishing rules',()=>{
 it('personal accounts can only create post, tweet and reel',()=>expect(createOptions('personal')).toEqual(['Post','Reel','Tweet']));
 it('business accounts can create post, reel, tweet, event and ticket',()=>expect(createOptions('business')).toEqual(['Post','Reel','Tweet','Event','Ticket']));
});
