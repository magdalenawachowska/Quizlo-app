const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{ display:block; }
    .wrap{ display:grid; gap: 8px; }
    .top{ display:flex; justify-content:space-between; color: var(--muted); font-size: 12px; }
    .bar{
      height: 10px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--surface), var(--card) 60%);
      overflow:hidden;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
    }
    .fill{
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--primary), #fff 40%));
      transition: width 220ms var(--ease);
    }
  </style>

  <div class="wrap">
    <div class="top">
      <div id="left"></div>
      <div id="right"></div>
    </div>
    <div class="bar"><div class="fill" id="fill"></div></div>
  </div>
`;

export class ProgressBar extends HTMLElement {
    static get observedAttributes() {
        return ['current', 'total', 'score'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        this.#render();
    }

    attributeChangedCallback() {
        this.#render();
    }

    // opcjonalnie zostawiamy też setter, żeby można było dalej używać .value
    set value({ current, total, score }) {
        this.setAttribute('current', String(current ?? 0));
        this.setAttribute('total', String(total ?? 0));
        this.setAttribute('score', String(score ?? 0));
    }

    #render() {
        const current = Number(this.getAttribute('current') ?? 0);
        const total = Number(this.getAttribute('total') ?? 0);
        const score = Number(this.getAttribute('score') ?? 0);

        const pct = total ? Math.round((current / total) * 100) : 0;

        this.shadowRoot.getElementById('fill').style.width = `${pct}%`;
        this.shadowRoot.getElementById(
            'left'
        ).textContent = `${current} / ${total}`;
        this.shadowRoot.getElementById('right').textContent = `Score: ${score}`;
    }
}

customElements.define('progress-bar', ProgressBar);
