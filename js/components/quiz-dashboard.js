import { store } from '../store.js';
import { go } from '../router.js';

import './confirm-modal.js';

import './quiz-title.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    .wrap{ display:grid; gap: 16px; }
    .header{
      display:flex; align-items: baseline; justify-content:space-between; gap:12px;
      margin: 6px 0 0;
    }
    .header h2{ margin:0; font-size: 18px; }
    .header p{ margin:0; color: var(--muted); font-size: 13px; }

    .tiles{
      display:grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px){ .tiles{ grid-template-columns: repeat(6, 1fr);} }
    @media (max-width: 560px){ .tiles{ grid-template-columns: 1fr; } }

    .skeleton{
      border-radius: var(--radius-xl);
      background: linear-gradient(90deg,
        color-mix(in oklab, var(--card), transparent 10%),
        color-mix(in oklab, var(--surface), transparent 15%),
        color-mix(in oklab, var(--card), transparent 10%)
      );
      height: 170px;
      animation: shimmer 1.1s linear infinite;
      background-size: 200% 100%;
    }
    @keyframes shimmer{ from{ background-position: 0% 0; } to{ background-position: -200% 0; } }
    .error{
      padding: 14px 16px;
      border-radius: 16px;
      background: color-mix(in oklab, var(--danger), transparent 90%);
      border: 1px solid color-mix(in oklab, var(--danger), transparent 55%);
      color: color-mix(in oklab, var(--danger), var(--text) 30%);
    }

   .count{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--surface), var(--card) 55%);
  border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
  box-shadow: 0 10px 18px rgba(0,0,0,.06);
}

.count .label{
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.count .value{
  font-size: 16px;  
  font-weight: 600;   
  letter-spacing: 0.2px;
  color: var(--text); 
}


  </style>

  <div class="wrap fade-in">
    <div class="header">
      <div>
        <h2>Dostępne quizy</h2>
      </div>
      <div class="count" id="count"></div>
    </div>

    <div class="tiles" id="tiles"></div>
    <div id="msg"></div>
  </div>
`;

export class QuizDashboard extends HTMLElement {
    #unsub = null;
    #io = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        this.#unsub = store.subscribe(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        this.#unsub?.();
        this.#io?.disconnect();
    }

    render() {
        const tiles = this.shadowRoot.getElementById('tiles');
        const msg = this.shadowRoot.getElementById('msg');
        const count = this.shadowRoot.getElementById('count');

        tiles.innerHTML = '';
        msg.innerHTML = '';

        const quizzes = store.state.quizzes;
        count.innerHTML = `
        <span class="label">Łącznie</span>
        <span class="value">${quizzes.length}</span>
        <span class="label">quizów</span>
        `;

        if (!quizzes.length) {
            // jeśli jeszcze się ładuje – skeleton
            for (let i = 0; i < 6; i++) {
                const sk = document.createElement('div');
                sk.className = 'skeleton';
                sk.style.gridColumn = 'span 4';
                tiles.appendChild(sk);
            }
            return;
        }

        this.#io?.disconnect();
        this.#io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        e.target.classList.add('fade-in');
                        this.#io.unobserve(e.target);
                    }
                }
            },
            { threshold: 0.15 }
        );

        quizzes.forEach((q) => {
            const el = document.createElement('quiz-tile');
            el.style.gridColumn = 'span 4';
            el.data = q; // "import danych" do webcomponentu
            el.addEventListener('start', () => go('/quiz', { id: q.id }));
            el.addEventListener('edit', () => go('/admin', { id: q.id }));

            el.addEventListener('delete', async () => {
                // singleton modala (jedna instancja na appkę)
                let modal = document.querySelector('confirm-modal');
                if (!modal) {
                    modal = document.createElement('confirm-modal');
                    document.body.appendChild(modal);
                }

                const ok = await modal.open({
                    title: 'Usunąć quiz?',
                    description: `Czy na pewno chcesz usunąć „${q.title}”? Tej operacji nie da się cofnąć.`,
                });

                if (!ok) return;

                // jeśli ktoś akurat robi ten quiz, wyczyść current
                if (store.state.current?.quizId === q.id) {
                    store.state.current = null;
                }

                store.state.quizzes = store.state.quizzes.filter(
                    (x) => x.id !== q.id
                );
            });

            tiles.appendChild(el);
            this.#io.observe(el);
        });
    }
}

customElements.define('quiz-dashboard', QuizDashboard);
