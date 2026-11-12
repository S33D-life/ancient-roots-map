class Circle240Hearth extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    this.innerHTML = `<section aria-label="Circle 240 Fire"><h3>The Fire</h3>
      <p>No live Fire is scheduled. You’re welcome to sit quietly or reflect on this week’s inquiry.</p>
      <details><summary>Write a private reflection</summary>
      <p id="circle240-reflection-info">This reflection stays on this page and clears when you leave or refresh.</p>
      <label for="circle240-reflection">What came to mind?</label>
      <textarea autocomplete="off" id="circle240-reflection" aria-describedby="circle240-reflection-info" maxlength="2000" rows="4" style="display:block;width:100%;font:inherit"></textarea>
      <button type="button" style="min-height:44px">Clear reflection</button>
      <p role="status"></p></details></section>`;
    this.querySelector('button').addEventListener('click', () => {
      const field = this.querySelector('textarea');
      field.value = '';
      field.focus();
      this.querySelector('[role=status]').textContent = 'Reflection cleared.';
    });
  }
}
if (!customElements.get('circle240-hearth')) customElements.define('circle240-hearth', Circle240Hearth);
