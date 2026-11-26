// Circle 242 only: retain literal image text and distinguish editorial readings.
export function appendLearningNotes(container, companion) {
 if (!companion) return;
 const note=document.createElement('p');note.textContent='Learning note — '+companion.learningNote;
 const invitation=document.createElement('p');invitation.textContent=companion.invitationNote;
 container.append(note,invitation);
 if(companion.correctedReading && companion.correctedReading!==companion.reverse.readableText){
  const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('pre');
  summary.textContent='Read the editorially corrected text';text.textContent=companion.correctedReading;details.append(summary,text);container.append(details);
 }
}
