const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{ position: fixed; inset: 0; z-index: 9999; display:none; }
    :host([open]){ display:block; }

    .backdrop{
      position:absolute; inset:0;
      background: rgba(0,0,0,.35);
      backdrop-filter: blur(6px);
      animation: fadeIn 180ms var(--ease) both;
    }

    .dialog{
      position:absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: min(520px, calc(100% - 32px));
      background: var(--card);
      color: var(--text);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 80%);
      padding: 18px;
      display:grid;
      gap: 12px;
      animation: popIn 180ms var(--ease) both;
    }

    .title{ font-weight: 800; font-size: 18px; margin:0; }
    .desc{ margin:0; color: var(--muted); font-size: 13px; line-height: 1.35; }

    .actions{
      display:flex;
      gap: 10px;
      justify-content:flex-end;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    .btn{
      height: 40px;
      border-radius: 999px;
      padding: 0 14px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card) 85%, transparent);
      color: var(--text);
      cursor:pointer;
      transition: transform var(--speed) var(--ease);
    }
    .btn:hover{ transform: translateY(-1px); }

    .btn-danger{
      border-color: transparent;
      background: linear-gradient(
        135deg,
        var(--danger),
        color-mix(in oklab, var(--danger), #fff 25%)
      );
      color: #fff;
      font-weight: 650;
    }

    :host-context([data-theme='dark']) .btn{
      color: #fff;
    }

    @keyframes fadeIn{ from{ opacity: 0; } to{ opacity: 1; } }
    @keyframes popIn{
      from{ opacity: 0; transform: translate(-50%, -48%) scale(.98); }
      to{ opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  </style>

  <div class="backdrop" id="backdrop" aria-hidden="true"></div>

  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="t" aria-describedby="d">
    <h3 class="title" id="t"></h3>
    <p class="desc" id="d"></p>

    <div class="actions">
      <button class="btn" id="cancelBtn">Nie, wróć</button>
      <button class="btn btn-danger" id="okBtn">Tak, usuń</button>
    </div>
  </div>
`;

export class ConfirmModal extends HTMLElement {
    #resolver = null;
    #onKey = null;
    #prevOverflow = '';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        const s = this.shadowRoot;
        s.getElementById('cancelBtn').addEventListener('click', () =>
            this.close(false)
        );
        s.getElementById('okBtn').addEventListener('click', () =>
            this.close(true)
        );
        s.getElementById('backdrop').addEventListener('click', () =>
            this.close(false)
        );

        this.#onKey = (e) => {
            if (e.key === 'Escape') this.close(false);
        };
    }

    open({ title = 'Potwierdź', description = 'Czy na pewno?' } = {}) {
        this.shadowRoot.getElementById('t').textContent = title;
        this.shadowRoot.getElementById('d').textContent = description;

        this.setAttribute('open', '');
        document.addEventListener('keydown', this.#onKey);

        this.#prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return new Promise((resolve) => {
            this.#resolver = resolve;
        });
    }

    close(result) {
        this.removeAttribute('open');
        document.removeEventListener('keydown', this.#onKey);
        document.body.style.overflow = this.#prevOverflow || '';

        this.#resolver?.(result);
        this.#resolver = null;
    }
}

customElements.define('confirm-modal', ConfirmModal);
