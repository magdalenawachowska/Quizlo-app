import { store } from '../store.js';
import { go } from '../router.js';
import { nowMs, isoNow, formatDuration } from '../utils/time.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    .card{
      background: var(--card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      padding: 18px;
      display:grid;
      gap: 14px;
    }
    .head{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    h2{ margin:0; font-size: 20px; font-weight: 900; }
    .muted{ margin: 4px 0 0; color: var(--muted); font-size: 13px; }

    .grid{
      display:grid;
      grid-template-columns: 1.2fr .8fr;
      gap: 14px;
    }
    @media (max-width: 760px){ .grid{ grid-template-columns: 1fr; } }

    .panel{
      padding: 14px;
      border-radius: 22px;
      background: color-mix(in oklab, var(--surface), var(--card) 35%);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 80%);
      display:grid;
      gap: 10px;
    }

    .big{
      font-size: 36px;
      font-weight: 950;
      letter-spacing: -0.6px;
      line-height: 1;
    }

    .row{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .chip{
      padding: 8px 12px;
      border-radius: 999px;
      background: color-mix(in oklab, var(--card), var(--surface) 20%);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .actions{
      display:flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content:flex-end;
    }
    .btn{
      height: 42px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card) 85%, transparent);
      cursor:pointer;
      padding: 0 14px;
      transition: transform var(--speed) var(--ease);
      color: var(--text);
    }
    .btn:hover{ transform: translateY(-1px); }

    .btn-ghost{
    background: rgba(255,255,255,.55);
    backdrop-filter: blur(10px);
    }

    .btn-primary{
      border-color: transparent;
      background: color-mix(in oklab, var(--accent), #fff 60%);
      color: var(--text);
      font-weight: 650;
    }
    .btn-primary:hover{
      background: color-mix(in oklab, var(--accent), #fff 45%);
    }

    :host-context([data-theme='dark']) .btn{
      color: #fff;
    }
    :host-context([data-theme='dark']) .btn-primary{
      color: var(--text);
    }
    :host-context([data-theme='dark']) .btn-ghost{
    background: color-mix(in oklab, var(--card), transparent 40%);
    }

    .tipText{
    font-size: 14px;
    line-height: 1.25;
    font-weight: 600;
    letter-spacing: -0.2px;
    text-align: center;
    color: color-mix(in oklab, var(--text), #000 10%);
    }

    :host-context([data-theme='dark']) .tipText{
    color: color-mix(in oklab, var(--text), #fff 0%);
    }


    .empty{
      color: var(--muted);
      font-size: 13px;
      padding: 14px;
    }
    .hidden{ display:none !important; }
  </style>

  <section class="card fade-in">
    <div class="head">
      <div>
        <h2>Podsumowanie</h2>
        <p class="muted" id="sub"></p>
      </div>
      <div class="actions">
      <button class="btn btn-ghost" id="exit">Wyjdź</button>
      </div>
    </div>

    <div class="grid" id="grid">
      <div class="panel">
        <div class="row">
          <div>
            <div class="muted">Wynik</div>
            <div class="big" id="score"></div>
          </div>
          <div class="chip" id="pct"></div>
        </div>

        <div class="row">
          <span class="muted">Czas</span>
          <span class="chip" id="time"></span>
        </div>

        <div class="row">
          <span class="muted">Quiz</span>
          <span class="chip" id="quizTitle"></span>
        </div>

        <div class="row">
          <span class="muted">Kategoria</span>
          <span class="chip" id="cat"></span>
        </div>
      </div>

      <div class="panel">
        <div class="muted">Tip</div>
        <div class="tipText">Wszystkie twoje podejścia zapisane są w "Historia"</div>
      </div>
    </div>

    <div class="empty hidden" id="empty">
      Brak aktywnej sesji quizu. Wróć do dashboardu i uruchom quiz.
    </div>
  </section>
`;

export class ResultSummary extends HTMLElement {
    #saved = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        const s = this.shadowRoot;

        this.shadowRoot.getElementById('exit').addEventListener('click', () => {
            store.state.current = null;
            go('/dashboard');
        });

        this.render();
    }

    render() {
        const s = this.shadowRoot;
        const session = store.state.session;
        const cur = store.state.current;

        if (!session || !cur) {
            s.getElementById('grid').classList.add('hidden');
            s.getElementById('empty').classList.remove('hidden');
            s.getElementById('sub').textContent = '';
            return;
        }

        const quiz = store.state.quizzes.find((q) => q.id === cur.quizId);
        const total = quiz?.questions?.length ?? cur.answers?.length ?? 0;
        const score = cur.score ?? 0;

        const finishedAtMs = cur.finishedAtMs ?? nowMs();
        const finishedAtISO = cur.finishedAtISO ?? isoNow();
        const durationMs =
            cur.durationMs ??
            Math.max(0, finishedAtMs - (cur.startedAtMs ?? finishedAtMs));

        // dopnij do current jeśli brak
        if (!cur.finishedAtISO || !cur.durationMs) {
            store.state.current = {
                ...cur,
                finishedAtMs,
                finishedAtISO,
                durationMs,
            };
        }

        // bez duplikowania
        if (!this.#saved) {
            this.#saved = true;

            const entryId = `${cur.quizId}_${cur.startedAtISO || ''}`;

            const entry = {
                id: entryId,
                quizId: cur.quizId,
                title: quiz?.title ?? 'Quiz',
                category: quiz?.category ?? 'inne',
                total,
                score,
                startedAtISO: cur.startedAtISO,
                finishedAtISO,
                durationMs,
            };

            const userId = session.userId;
            const prev = store.state.historyByUser[userId] || [];
            const exists = prev.some((e) => e.id === entryId);

            if (!exists) {
                store.state.historyByUser = {
                    ...store.state.historyByUser,
                    [userId]: [entry, ...prev].slice(0, 50),
                };
            }
        }

        const pct = total ? Math.round((score / total) * 100) : 0;

        s.getElementById('sub').textContent = `Zakończono: ${new Date(
            finishedAtISO
        ).toLocaleString()}`;

        s.getElementById('score').textContent = `${score}/${total}`;
        s.getElementById('pct').textContent = `${pct}%`;
        s.getElementById('time').textContent = formatDuration(durationMs);
        s.getElementById('quizTitle').textContent = quiz?.title ?? '—';
        s.getElementById('cat').textContent = quiz?.category ?? '—';

        s.getElementById('grid').classList.remove('hidden');
        s.getElementById('empty').classList.add('hidden');
    }
}

customElements.define('result-summary', ResultSummary);
