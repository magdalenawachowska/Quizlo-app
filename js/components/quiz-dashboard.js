import { store } from '../store.js';
import { go } from '../router.js';

import './confirm-modal.js';
import './quiz-title.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
  .wrap{ display:grid; gap: 16px; }

  .header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    margin: 6px 0 0;
    flex-wrap: wrap;
  }

  .title{
    display:flex;
    align-items:baseline;
    gap: 8px;
    min-width: 220px;
  }

  .title h2{
    margin:0;
    font-size: 18px;
    font-weight: 800;
    color: color-mix(in oklab, var(--text), var(--primary) 18%);
  }
  .title .sub{
    color: color-mix(in oklab, var(--muted), var(--primary) 12%);
    font-size: 13px;
    margin:0;
  }

  .controls{
    display:flex;
    gap: 10px;
    align-items:center;
    justify-content:flex-end;
    flex: 1 1 420px;
  }

  .search{
    position: relative;
    width: 320px;
    flex: 0 0 320px;
  }

  .search input{
    width: 100%;
    height: 42px;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--muted), transparent 78%);
    background: color-mix(in oklab, var(--card) 88%, transparent);
    color: var(--text);
    padding: 0 42px 0 14px;
    outline: none;
    box-shadow: 0 10px 18px rgba(0,0,0,.05);
  }
  .search input::placeholder{
    color: color-mix(in oklab, var(--muted), transparent 25%);
  }

  .icon{
    position:absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: color-mix(in oklab, var(--muted), var(--text) 25%);
    pointer-events: none;
    display:grid;
    place-items:center;
  }
  .icon svg{ display:block; }

  .sort select{
    height: 42px;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--muted), transparent 78%);
    background: color-mix(in oklab, var(--card) 88%, transparent);
    color: var(--text);
    outline: none;
    cursor: pointer;

    min-width: 200px;
    padding: 0 44px 0 14px;
    box-shadow: 0 10px 18px rgba(0,0,0,.05);

    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    /* własna strzałka*/
    background-image:
      linear-gradient(45deg, transparent 50%, currentColor 50%),
      linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position:
      calc(100% - 22px) 18px,
      calc(100% - 16px) 18px;
    background-size: 6px 6px, 6px 6px;
    background-repeat: no-repeat;
  }

  /*kafelki */
  .tiles{
    display:grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px){ .tiles{ grid-template-columns: repeat(6, 1fr);} }

  @media (max-width: 560px){
    .tiles{ grid-template-columns: 1fr; }
    .controls{ flex: 1 1 100%; justify-content: stretch; }
    .search{ width: 100%; flex: 1 1 auto; }
    .sort select{ min-width: 160px; }
  }

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

  .empty{
    padding: 14px 16px;
    border-radius: 16px;
    background: color-mix(in oklab, var(--surface), transparent 35%);
    border: 1px solid color-mix(in oklab, var(--muted), transparent 80%);
    color: color-mix(in oklab, var(--muted), var(--primary) 12%);
    font-size: 13px;
  }
</style>


  <div class="wrap fade-in">
    <div class="header">
      <div class="title">
        <h2 id="title">Dostępne quizy</h2>
        <p class="sub" id="sub"></p>
      </div>

      <div class="controls">
        <div class="search">
          <input id="q" type="search" placeholder="Szukaj" autocomplete="off" />
        <span class="icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
        </span>

        </div>

        <div class="sort">
          <select id="sort">
            <option value="default">Sortowanie: domyślnie</option>
            <option value="az">Nazwa A–Z</option>
            <option value="za">Nazwa Z–A</option>
            <option value="qasc">Pytania rosnąco</option>
            <option value="qdesc">Pytania malejąco</option>
          </select>
        </div>
      </div>
    </div>

    <div class="tiles" id="tiles"></div>
    <div id="msg"></div>
  </div>
`;

export class QuizDashboard extends HTMLElement {
  #unsub = null;
  #io = null;

  // UI state
  #query = '';
  #sort = 'default';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(tpl.content.cloneNode(true));
  }

  connectedCallback() {
    const q = this.shadowRoot.getElementById('q');
    const sort = this.shadowRoot.getElementById('sort');

    q.addEventListener('input', () => {
      this.#query = q.value || '';
      this.render();
    });

    sort.addEventListener('change', () => {
      this.#sort = sort.value || 'default';
      this.render();
    });

    this.#unsub = store.subscribe(() => this.render());
    this.render();
  }

  disconnectedCallback() {
    this.#unsub?.();
    this.#io?.disconnect();
  }

  #applyFilterAndSort(quizzes) {
    // filter
    const needle = this.#query.trim().toLowerCase();
    let list = Array.isArray(quizzes) ? quizzes.slice() : [];

    if (needle) {
      list = list.filter((q) => String(q.title || '').toLowerCase().includes(needle));
    }

    // sort
    const byTitle = (a, b) =>
      String(a.title || '').localeCompare(String(b.title || ''), 'pl', { sensitivity: 'base' });

    const byCount = (a, b) =>
      (a.questions?.length || 0) - (b.questions?.length || 0);

    if (this.#sort === 'az') list.sort(byTitle);
    else if (this.#sort === 'za') list.sort((a, b) => byTitle(b, a));
    else if (this.#sort === 'qasc') list.sort(byCount);
    else if (this.#sort === 'qdesc') list.sort((a, b) => byCount(b, a));

    return list;
  }

  render() {
    const tiles = this.shadowRoot.getElementById('tiles');
    const msg = this.shadowRoot.getElementById('msg');
    const title = this.shadowRoot.getElementById('title');
    const sub = this.shadowRoot.getElementById('sub');

    tiles.innerHTML = '';
    msg.innerHTML = '';

    const allQuizzes = store.state.quizzes || [];

    // skeleton tylko gdy totalnie pusto (pierwsze ładowanie / brak danych)
    if (!allQuizzes.length) {
      title.textContent = `Dostępne quizy`;
      sub.textContent = '';
      for (let i = 0; i < 6; i++) {
        const sk = document.createElement('div');
        sk.className = 'skeleton';
        sk.style.gridColumn = 'span 4';
        tiles.appendChild(sk);
      }
      return;
    }

    const filtered = this.#applyFilterAndSort(allQuizzes);

    // licznik po lewej (zgodny z filtrem)
    title.textContent = `Dostępne quizy: ${filtered.length}`;
    sub.textContent = '';

    if (!filtered.length) {
      msg.innerHTML = `<div class="empty">Brak wyników. Zmień frazę wyszukiwania lub wyczyść filtr.</div>`;
      return;
    }

    // IntersectionObserver: delikatne wejście kafelków
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

    filtered.forEach((q) => {
      const el = document.createElement('quiz-tile');
      el.style.gridColumn = 'span 4';
      el.data = q;

      el.addEventListener('start', () => go('/quiz', { id: q.id }));
      el.addEventListener('edit', () => go('/admin', { id: q.id }));

      el.addEventListener('delete', async () => {
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

        if (store.state.current?.quizId === q.id) {
          store.state.current = null;
        }

        store.state.quizzes = store.state.quizzes.filter((x) => x.id !== q.id);
      });

      tiles.appendChild(el);
      this.#io.observe(el);
    });
  }
}

customElements.define('quiz-dashboard', QuizDashboard);
