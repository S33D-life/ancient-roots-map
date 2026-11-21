import { expect,it } from 'vitest';
import { validPublicAgentKey,ownsAgentForRequest } from '../../supabase/functions/api-gateway/agentAuthority';
it('accepts only an owned public-read key',()=>expect(validPublicAgentKey({user_id:'a',agent_id:'agent',scopes:['read:public']},'a')).toBe(true));
it.each([['admin:*'],['read:public','admin:*'],[],null])('rejects existing unsafe scopes %j',scopes=>expect(validPublicAgentKey({user_id:'a',agent_id:'agent',scopes},'a')).toBe(false));
it('rejects former owners',()=>expect(validPublicAgentKey({user_id:'a',agent_id:'agent',scopes:['read:public']},'b')).toBe(false));
it('does not let a matching agent ID replace server ownership',()=>expect(ownsAgentForRequest({userId:'a',agentId:'agent'},{owner_user_id:'b'},'agent')).toBe(false));
it('does not let a key for one agent mutate another owned agent',()=>expect(ownsAgentForRequest({userId:'a',agentId:'agent'},{owner_user_id:'a'},'other')).toBe(false));
