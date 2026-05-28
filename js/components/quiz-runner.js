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

    .note{ color: var(--muted); font-size: 12px; line-height: 1.35; }
    
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
      <button class="btn btn-primary" id="nextBtn">Sprawdź</button>
    </div>
  </section>
`;

function getCorrectIndexes(question) {
  if (Array.isArray(question.correctIndexes)) {
    return question.correctIndexes.map(Number);
  }

  if (typeof question.correctIndex === 'number') {
    return [question.correctIndex];
  }

  return [0];
}

function sameIndexes(a, b) {
  const aa = [...a].map(Number).sort((x, y) => x - y);
  const bb = [...b].map(Number).sort((x, y) => x - y);

  return aa.length === bb.length && aa.every((x, i) => x === bb[i]);
}

function normalizeAnswer(answer) {
  if (!answer) {
    return {
      selectedIndexes: [],
      checked: false,
      isCorrect: false,
    };
  }

  // kompatybilność ze starym formatem: { selectedIndex, isCorrect }
  if (typeof answer.selectedIndex === 'number') {
    return {
      selectedIndexes: [answer.selectedIndex],
      checked: true,
      isCorrect: !!answer.isCorrect,
    };
  }

  return {
    selectedIndexes: Array.isArray(answer.selectedIndexes)
      ? answer.selectedIndexes.map(Number)
      : [],
    checked: !!answer.checked,
    isCorrect: !!answer.isCorrect,
  };
}

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
      go('/dashboard');
      return;
    }

    if (!store.state.current || store.state.current.quizId !== this.#quizId) {
      store.state.current = {
        quizId: this.#quizId,
        index: 0,
        answers: Array(this.#quiz.questions.length).fill(null),
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

    s.getElementById('options').addEventListener('pick', (ev) => {
      const selectedIndex = Number(ev.detail.value);
      this.pick(selectedIndex);
    });

    this.render();
  }

  pick(selectedIndex) {
    const cur = store.state.current;
    const qi = cur.index;

    const currentAnswer = normalizeAnswer(cur.answers[qi]);

    // po sprawdzeniu pytania blokujemy zmianę odpowiedzi
    if (currentAnswer.checked) return;

    let selectedIndexes = [...currentAnswer.selectedIndexes];

    if (selectedIndexes.includes(selectedIndex)) {
      selectedIndexes = selectedIndexes.filter((i) => i !== selectedIndex);
    } else {
      selectedIndexes.push(selectedIndex);
    }

    const newAnswers = cur.answers.slice();
    newAnswers[qi] = {
      ...currentAnswer,
      selectedIndexes,
      checked: false,
      isCorrect: false,
    };

    store.state.current = {
      ...cur,
      answers: newAnswers,
    };

    this.render();
  }

  checkCurrentQuestion() {
    const cur = store.state.current;
    const qi = cur.index;
    const q = this.#quiz.questions[qi];

    const currentAnswer = normalizeAnswer(cur.answers[qi]);

    if (currentAnswer.checked) return cur;

    const correctIndexes = getCorrectIndexes(q);
    const selectedIndexes = currentAnswer.selectedIndexes;

    const isCorrect = sameIndexes(selectedIndexes, correctIndexes);

    const newAnswers = cur.answers.slice();
    newAnswers[qi] = {
      selectedIndexes,
      checked: true,
      isCorrect,
    };

    const newCur = {
      ...cur,
      answers: newAnswers,
      score: cur.score + (isCorrect ? 1 : 0),
    };

    store.state.current = newCur;
    return newCur;
  }

  back() {
    const cur = store.state.current;
    if (cur.index <= 0) return;

    store.state.current = { ...cur, index: cur.index - 1 };
    this.render();
  }

  next() {
    let cur = store.state.current;
    const currentAnswer = normalizeAnswer(cur.answers[cur.index]);

    // pierwszy klik: sprawdź odpowiedź, pokaż feedback, nie przechodź dalej
    if (!currentAnswer.checked) {
      this.checkCurrentQuestion();
      this.render();
      return;
    }

    cur = store.state.current;
    const last = this.#quiz.questions.length - 1;

    // drugi klik: przejście dalej / zakończenie
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
    s.getElementById('quizMeta').textContent = `Kategoria: ${this.#quiz.category}`;

    const bar = s.getElementById('bar');
    bar.setAttribute('current', String(idx + 1));
    bar.setAttribute('total', String(total));
    bar.setAttribute('score', String(cur.score));

    const q = this.#quiz.questions[idx];
    const correctIndexes = getCorrectIndexes(q);

    s.getElementById('qtext').textContent = q.text;

    const note = s.getElementById('note');
    const options = s.getElementById('options');
    const nextBtn = s.getElementById('nextBtn');

    options.innerHTML = '';

    const currentAnswer = normalizeAnswer(cur.answers[idx]);
    const selectedIndexes = currentAnswer.selectedIndexes;
    const checked = currentAnswer.checked;

    if (checked) {
      note.textContent = currentAnswer.isCorrect
        ? 'Dobrze! Możesz przejść dalej.'
        : 'Odpowiedź została sprawdzona. Poprawne odpowiedzi są oznaczone.';
    } else if (correctIndexes.length > 1) {
      note.textContent =
        'To pytanie ma więcej niż jedną poprawną odpowiedź. Zaznacz wszystkie poprawne odpowiedzi i kliknij "Sprawdź".';
    } else {
      note.textContent =
        'Wybierz odpowiedź i kliknij "Sprawdź". Brak odpowiedzi oznacza 0 punktów za pytanie.';
    }

    q.options.forEach((text, i) => {
      const opt = document.createElement('answer-option');

      let state = null;
      let icon = '•';

      const isSelected = selectedIndexes.includes(i);
      const isCorrectOption = correctIndexes.includes(i);

      if (!checked) {
        if (isSelected) {
          state = 'selected';
          icon = '✓';
        }
      } else {
        if (isSelected && isCorrectOption) {
          state = 'correct';
          icon = '✓';
        } else if (isSelected && !isCorrectOption) {
          state = 'wrong';
          icon = '✕';
        } else if (!isSelected && isCorrectOption) {
          state = 'correct';
          icon = '✓';
        }
      }

      opt.data = {
        text,
        value: String(i),
        disabled: checked,
        state,
        icon,
      };

      options.appendChild(opt);
    });

    s.getElementById('backBtn').disabled = idx === 0;

    if (!checked) {
      nextBtn.textContent = 'Sprawdź';
    } else {
      nextBtn.textContent = idx === total - 1 ? 'Zakończ' : 'Dalej';
    }
  }
}

customElements.define('quiz-runner', QuizRunner);