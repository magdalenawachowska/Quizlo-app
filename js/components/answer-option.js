const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{ display:block; }
    button{
      width: 100%;
      text-align:left;
      padding: 14px 14px;
      border-radius: 18px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card), var(--surface) 10%);
      color: var(--text);
      cursor:pointer;
      transition: transform var(--speed) var(--ease), border-color var(--speed) var(--ease), background var(--speed) var(--ease);
      display:flex; align-items:center; justify-content:space-between; gap: 12px;
    }
    button:hover{ transform: translateY(-1px); border-color: color-mix(in oklab, var(--muted), transparent 55%); }
    button:disabled{ cursor:not-allowed; opacity: .95; transform:none; }

    .icon{
      width: 28px; height: 28px;
      border-radius: 999px;
      display:grid; place-items:center;
      font-weight: 900;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      color: var(--muted);
    }

    :host([state="correct"]) button{
      border-color: color-mix(in oklab, var(--success), transparent 30%);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--success), transparent 85%);
    }
    :host([state="wrong"]) button{
      border-color: color-mix(in oklab, var(--danger), transparent 30%);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--danger), transparent 88%);
    }
    :host([state="selected"]) button{
      border-color: color-mix(in oklab, var(--primary), transparent 35%);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--primary), transparent 88%);
    }
  </style>

  <button type="button" id="btn">
    <span id="text"></span>
    <span class="icon" id="icon">•</span>
  </button>
`;

export class AnswerOption extends HTMLElement {
    #value = '';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        this.shadowRoot.getElementById('btn').addEventListener('click', () => {
            this.dispatchEvent(
                new CustomEvent('pick', {
                    bubbles: true,
                    detail: { value: this.#value },
                })
            );
        });
    }

    set data({ text, value, disabled, state, icon }) {
        this.#value = value;
        this.shadowRoot.getElementById('text').textContent = text;
        this.shadowRoot.getElementById('btn').disabled = !!disabled;
        if (state) this.setAttribute('state', state);
        else this.removeAttribute('state');
        this.shadowRoot.getElementById('icon').textContent = icon ?? '•';
    }
}

customElements.define('answer-option', AnswerOption);
