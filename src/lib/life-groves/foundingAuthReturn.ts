/** Reuse the existing AuthPage confirmation/consume-invitation journey. */
export function foundingActivationPath(value:string|null):string|null {
  return value && /^\/founding-grove\/activate\/[a-f0-9]{64}$/.test(value) ? value : null;
}
export function foundingEmailReturn(origin:string,returnTo:string|null,invite:string|null):string {
  const path=foundingActivationPath(returnTo);
  if(!path) return `${origin}/welcome`;
  const params=new URLSearchParams({returnTo:path});
  if(invite && invite.length<=256) params.set('invite',invite);
  return `${origin}/auth?${params}`;
}
