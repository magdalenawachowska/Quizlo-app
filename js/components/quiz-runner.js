import { store } from '../store.js';
import { go } from '../router.js';
import { nowMs, isoNow } from '../utils/time.js';

import './progress-bar.js';
import './answer-option.js';

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
    .head{ display:flex; justify-content:space-between; gap: 12px; align-items:center; }
    .title{ font-weight: 800; font-size: 18px; }
    .muted{ color: var(--muted); font-size: 13px; }

    .q{
      display:grid;
      gap: 12px;
      padding: 14px;
      border-radius: var(--radius-xl);
      background: color-mix(in oklab, var(--surface), var(--card) 35%);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 80%);
    }
    .qtext{ font-size: 16px; font-weight: 650; line-height: 1.35; }

    .options{
      display:grid;
      gap: 10px;
    }

    .actions{
      display:flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn{
      height: 42px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card) 85%, transparent);
      cursor:pointer;
      padding: 0 14px;
      transition: transform var(--speed) var(--ease);
    }
    .btn:hover{ transform: translateY(-1px); }

    .btn-primary{
      border: none;
      background: linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary), #fff 35%));
      color: color-mix(in oklab, var(--card), var(--text) 20%);
      font-weight: 650;
    }

    .note{ color: var(--muted); font-size: 12px; }
    
    :host-context([data-theme='dark']) .btn{
        color: #fff;
    }

  </style>

  <section class="card fade-in">
    <div class="head">
      <div>
        <div class="title" id="quizTitle"></div>
        <div class="muted" id="quizMeta"></div>
      </div>
      <button class="btn" id="exitBtn">Wyjdź</button>
    </div>

    <progress-bar id="bar"></progress-bar>

    <div class="q slide-in" id="qcard">
      <div class="qtext" id="qtext"></div>
      <div class="options" id="options"></div>
      <div class="note" id="note"></div>
    </div>

    <div class="actions">
      <button class="btn" id="backBtn">Wróć</button>
      <button class="btn btn-primary" id="nextBtn">Dalej</button>
    </div>
  </section>
`;

export class QuizRunner extends HTMLElement {
    #quizId = '';
    #quiz = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        this.#quizId = this.getAttribute('quiz-id') || '';
        this.#quiz = store.state.quizzes.find((q) => q.id === this.#quizId);

        if (!this.#quiz) {
            // fallback
            go('/dashboard');
            return;
        }

        // init current session quiz state
        if (
            !store.state.current ||
            store.state.current.quizId !== this.#quizId
        ) {
            store.state.current = {
                quizId: this.#quizId,
                index: 0,
                answers: Array(this.#quiz.questions.length).fill(null), // null lub { selectedIndex, isCorrect }
                score: 0,
                startedAtMs: nowMs(),
                startedAtISO: isoNow(),
            };
        }

        const s = this.shadowRoot;
        s.getElementById('exitBtn').addEventListener('click', () =>
            go('/dashboard')
        );
        s.getElementById('backBtn').addEventListener('click', () =>
            this.back()
        );
        s.getElementById('nextBtn').addEventListener('click', () =>
            this.next()
        );

        // event delegation: pick odpowiedzi
        s.getElementById('options').addEventListener('pick', (ev) => {
            const selectedIndex = Number(ev.detail.value);
            this.pick(selectedIndex);
        });

        this.render();
    }

    pick(selectedIndex) {
        const cur = store.state.current;
        const qi = cur.index;

        // jeżeli już odpowiedziano na to pytanie — blokada
        if (cur.answers[qi] !== null) return;

        const q = this.#quiz.questions[qi];
        const isCorrect = selectedIndex === q.correctIndex;

        // update score i odpowiedzi (reaktywność przez store)
        const newAnswers = cur.answers.slice();
        newAnswers[qi] = { selectedIndex, isCorrect };

        store.state.current = {
            ...cur,
            answers: newAnswers,
            score: cur.score + (isCorrect ? 1 : 0),
        };

        // render (żeby pokazać zielone/czerwone)
        this.render();

        // drobny “event loop” - microtask
        queueMicrotask(() => {
            const card = this.shadowRoot.getElementById('qcard');
            card.classList.remove('slide-in');
            void card.offsetWidth;
            card.classList.add('slide-in');
        });
    }

    back() {
        const cur = store.state.current;
        if (cur.index <= 0) return;
        store.state.current = { ...cur, index: cur.index - 1 };
        this.render();
    }

    next() {
        const cur = store.state.current;
        const last = this.#quiz.questions.length - 1;
        if (cur.index >= last) {
            const finishedAtMs = nowMs();
            store.state.current = {
                ...cur,
                finishedAtMs,
                finishedAtISO: isoNow(),
                durationMs: finishedAtMs - cur.startedAtMs,
            };
            go('/summary');
            return;
        }
        store.state.current = { ...cur, index: cur.index + 1 };
        this.render();
    }

    render() {
        const s = this.shadowRoot;
        const cur = store.state.current;
        const total = this.#quiz.questions.length;
        const idx = cur.index;

        s.getElementById('quizTitle').textContent = this.#quiz.title;
        s.getElementById('quizMeta').textContent = `Kategoria: ${
            this.#quiz.category
        }`;

        const bar = s.getElementById('bar');
        bar.setAttribute('current', String(idx + 1));
        bar.setAttribute('total', String(total));
        bar.setAttribute('score', String(cur.score));

        const q = this.#quiz.questions[idx];
        s.getElementById('qtext').textContent = q.text;

        const note = s.getElementById('note');
        const options = s.getElementById('options');
        options.innerHTML = '';

        const answered = cur.answers[idx] !== null;

        note.textContent = answered
            ? 'Odpowiedź została zapisana. Możesz iść dalej lub wrócić.'
            : 'Kliknij "Dalej" aby przejść dalej. Brak udzielenia odpowiedzi- 0 punktów za pytanie.';

        q.options.forEach((text, i) => {
            const opt = document.createElement('answer-option');

            // stan kafelka po wyborze: zielony/czerwony + ikonka
            let state = null;
            let icon = '•';

            if (answered) {
                const sel = cur.answers[idx].selectedIndex;
                const isCorrect = i === q.correctIndex;
                const isSelected = i === sel;

                if (isSelected && isCorrect) {
                    state = 'correct';
                    icon = '✓';
                } else if (isSelected && !isCorrect) {
                    state = 'wrong';
                    icon = '✕';
                } else if (!isSelected && isCorrect) {
                    state = 'correct';
                    icon = '✓';
                } else {
                    state = null;
                    icon = '•';
                }
            }

            opt.data = {
                text,
                value: String(i),
                disabled: answered, // blokada ponownego kliku
                state,
                icon,
            };

            options.appendChild(opt);
        });

        // back disabled na pierwszym
        s.getElementById('backBtn').disabled = idx === 0;
        s.getElementById('nextBtn').textContent =
            idx === total - 1 ? 'Zakończ' : 'Dalej';
    }
}

customElements.define('quiz-runner', QuizRunner);
