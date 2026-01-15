import { store } from '../store.js';
import { formatDuration } from '../utils/time.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    .card{
      background: var(--card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      padding: 18px;
      display:grid;
      gap: 12px;
    }
    h2{ margin: 0; font-size: 18px; }
    p{ margin:0; color: var(--muted); font-size: 13px; }

    .list{ display:grid; gap: 10px; margin-top: 8px; }
    .item{
        display:flex; justify-content:space-between; gap: 12px; flex-wrap: wrap;
        padding: 14px 16px;
        border-radius: 18px;
        background: color-mix(in oklab, var(--card), var(--surface) 12%);
        border: 1px solid color-mix(in oklab, var(--muted), transparent 82%);
        }
    .item + .item{
        margin-top: 2px;
        }

    .left{ display:grid; gap: 3px; }
    .title{ font-weight: 700; }
    .meta{ color: var(--muted); font-size: 12px; }
    .right{ display:flex; gap: 10px; align-items:center; }
    .chip{
      padding: 6px 10px; border-radius: 999px;
      font-size: 12px; color: var(--muted);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
      background: color-mix(in oklab, var(--card), var(--surface) 20%);
      white-space: nowrap;
    }
  </style>

  <section class="card fade-in">
    <div>
      <h2>Historia</h2>
      <p>Twoje ostatnie podejścia do quizów.</p>
    </div>
    <div class="list" id="list"></div>
  </section>
`;

export class HistoryList extends HTMLElement {
    #unsub = null;

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
    }

    render() {
        const list = this.shadowRoot.getElementById('list');
        list.innerHTML = '';

        const session = store.state.session;
        if (!session) return;

        const raw = store.state.historyByUser[session.userId] || [];
        if (!raw.length) {
            const p = document.createElement('p');
            p.style.color = 'var(--muted)';
            p.style.fontSize = '13px';
            p.textContent = 'Brak historii. Zrób pierwszy quiz 🙂';
            list.appendChild(p);
            return;
        }

        //sortowanie od najnowszych
        const sorted = [...raw].sort((a, b) => {
            const ta = new Date(a.finishedAtISO).getTime();
            const tb = new Date(b.finishedAtISO).getTime();
            return tb - ta;
        });

        //usuniete duplikaty (ten sam quiz + ten sam wynik + prawie ten sam czas zakończenia)
        const uniq = [];
        const seen = new Set();

        for (const a of sorted) {
            // "klucz duplikatu" — można potem dopasować
            const t = new Date(a.finishedAtISO).getTime();
            const bucket = Math.floor(t / 5000); // 5-sekundowe okienko
            const key = `${a.quizId ?? a.title}|${a.score}|${
                a.total
            }|${bucket}`;

            if (seen.has(key)) continue;
            seen.add(key);
            uniq.push(a);
            if (uniq.length >= 20) break;
        }

        for (const a of uniq) {
            const item = document.createElement('div');
            item.className = 'item';

            const when = new Date(a.finishedAtISO).toLocaleString();
            const percent = a.total ? Math.round((a.score / a.total) * 100) : 0;

            item.innerHTML = `
      <div class="left">
        <div class="title">${a.title}</div>
        <div class="meta">#${a.category} • ${when}</div>
      </div>
      <div class="right">
        <span class="chip">Wynik: ${a.score}/${a.total} (${percent}%)</span>
        <span class="chip">Czas: ${formatDuration(a.durationMs)}</span>
      </div>
        `;
            list.appendChild(item);
        }
    }
}

customElements.define('history-list', HistoryList);
