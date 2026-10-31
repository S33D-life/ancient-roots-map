import {invitation} from './model';
export default function Invitation({onOffer,companionName}:{companionName:string;onOffer:(button:HTMLButtonElement)=>void}) {
 return <section className="fixture-invitation" aria-label="Offering invitation"><span className="new-mark">New · offerings</span><p className="q">{invitation.question}</p><button onClick={e=>onOffer(e.currentTarget)}>Leave something with {companionName}</button><p className="hint">{invitation.hint}</p></section>;
}
