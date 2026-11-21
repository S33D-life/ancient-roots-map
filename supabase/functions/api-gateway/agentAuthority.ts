/** Current ownership is checked for old and new keys alike. */
export function validPublicAgentKey(token: { user_id?: string; agent_id?: string; scopes?: unknown }, owner: string | null | undefined): boolean {
  return !!owner && owner === token.user_id && !!token.agent_id && Array.isArray(token.scopes) && token.scopes.length === 1 && token.scopes[0] === 'read:public';
}
export function ownsAgentForRequest(auth: { userId: string | null; agentId: string | null }, agent: { id?: string; owner_user_id?: string }, requestedId: string): boolean {
  return !!auth.userId && agent.owner_user_id === auth.userId && (!auth.agentId || auth.agentId === requestedId);
}
/** Public-read keys cannot use mutation routes, even routes without a scope hook. */
export function agentKeyAllowsMethod(method:string):boolean { return ['GET','HEAD','OPTIONS'].includes(method); }
