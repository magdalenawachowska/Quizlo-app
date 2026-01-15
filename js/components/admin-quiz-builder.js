import { store } from '../store.js';
import { go } from '../router.js';

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
  h2{ margin:0; font-size: 18px; }
  p{ margin:0; color: var(--muted); font-size: 13px; }

  form{ display:grid; gap: 12px; }
  .grid{ display:grid; gap: 12px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 760px){ .grid{ grid-template-columns: 1fr; } }

  label{ display:grid; gap:6px; color: var(--muted); font-size: 13px; }
  input, select, textarea{
    border-radius: 14px;
    border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
    padding: 10px 12px;
    background: color-mix(in oklab, var(--card), var(--surface) 20%);
    color: var(--text);
  }
  textarea{ min-height: 70px; resize: vertical; }

  /* zwijane pytania (details/summary)*/
  .qbox{
    /* qbox = <details> */
    padding: 0;
    border-radius: 22px;
    background: color-mix(in oklab, var(--surface), var(--card) 35%);
    border: 1px solid color-mix(in oklab, var(--muted), transparent 80%);
    overflow: hidden;
  }

  .qsum{
    list-style: none;
    cursor: pointer;
    padding: 14px;
    display:flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items:center;
    justify-content:space-between;
  }
  .qsum::-webkit-details-marker{ display:none; }

  .qsum-left{
    display:grid;
    gap: 2px;
  }

  .qsum-right{
  display:flex;
  align-items:center;
  gap: 10px;
}

.chev{
  width: 38px;
  height: 38px;
  border-radius: 999px;

  display:grid;
  place-items:center;

  border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
  background: color-mix(in oklab, var(--card) 85%, transparent);

  color: var(--muted); /* currentColor dla SVG */
  transition: transform var(--speed) var(--ease), color var(--speed) var(--ease), border-color var(--speed) var(--ease);
}

.chev svg{
  display:block; /* usuwa baseline/shift */
}

.qsum:hover .chev{
  color: var(--text);
  border-color: color-mix(in oklab, var(--muted), transparent 55%);
}

.qbox[open] .chev{
  transform: rotate(180deg);
}

  :host-context([data-theme='dark']) .chev{
    color: color-mix(in oklab, var(--text), #fff 20%);
  }

  .qhint{
    color: var(--muted);
    font-size: 12px;
  }

  .qcontent{
    padding: 0 14px 14px;
    display:grid;
    gap: 10px;
    border-top: 1px solid color-mix(in oklab, var(--muted), transparent 85%);
  }

  .qbox[open] .qcontent{
    animation: openQ 180ms var(--ease) both;
  }
  @keyframes openQ{
    from{ opacity: 0; transform: translateY(-4px); }
    to{ opacity: 1; transform: translateY(0); }
  }

  .opts{ display:grid; gap: 8px; }
  .row{ display:flex; gap: 10px; flex-wrap: wrap; align-items:center; justify-content:space-between; }

  .btn{
    height: 42px; border-radius: 999px; padding: 0 14px;
    border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
    background: color-mix(in oklab, var(--card) 85%, transparent);
    cursor:pointer;
    transition: transform var(--speed) var(--ease);
  }
  .btn:hover{ transform: translateY(-1px); }

  /* mały “ghost” przycisk do nagłówka pytania */
  .btn-ghost{
    background: transparent;
  }

  .btn-primary{
    border: none;
    background: linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary), #fff 35%));
    color: color-mix(in oklab, var(--card), var(--text) 20%);
    font-weight: 650;
  }

  :host-context([data-theme='dark']) .btn{
    color: #fff;
  }

  .err{ color: var(--danger); font-size: 13px; min-height: 18px; }
  .ok{ color: var(--success); font-size: 13px; min-height: 18px; }

  .form-actions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.left-actions{
  display:flex;
  align-items:center;
  gap: 12px;
  flex-wrap: wrap;
}

.qcounter{
  color: var(--muted);
  font-size: 12px;
}

.status{
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 18px;
}
  .head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
}

.btn-ghost{
  background: transparent;
}


</style>


  <section class="card fade-in">
    <div class="head">
    <div>
      <h2 id="title">Dodaj nowy quiz</h2>
    </div>

    <button class="btn btn-ghost" type="button" id="exitBtn">Wyjdź</button>
  </div>


    <form id="form">
      <div class="grid">
        <label>
          Kategoria
          <select name="category" required>
            <option value="sport">sport</option>
            <option value="barmaństwo">barmaństwo</option>
            <option value="piosenki">piosenki</option>
            <option value="nauka">nauka</option>
          </select>
        </label>
        <label>
          Tytuł
          <input name="title" required maxlength="40" placeholder="np. Barmaństwo: podstawy" />
        </label>
      </div>

      <label>
        Cover (URL obrazka)
        <input name="cover" placeholder="https://..." />
      </label>

      <div id="questions"></div>

    <div class="form-actions">
    <div class="left-actions">
        <button class="btn" type="button" id="addQ">+ Dodaj pytanie</button>
        <span class="qcounter">Pytania: <b id="qCount">0</b>/12</span>
    </div>

    <button class="btn btn-primary" type="submit">Zapisz quiz</button>
    </div>

    <div class="status">
    <span class="err" id="err"></span>
    <span class="ok" id="ok"></span>
    </div>

    </form>
  </section>
`;

function makeQuestionBox(index) {
    const wrap = document.createElement('details');
    wrap.className = 'qbox';
    wrap.dataset.index = String(index);
    wrap.open = true;

    wrap.innerHTML = `
    <summary class="qsum">
      <div class="qsum-left">
        <b>Pytanie ${index + 1}</b>
      </div>
      <div class="qsum-right">
      <span class="chev" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
</svg></span>
      <button class="btn btn-ghost" type="button" data-remove aria-label="Usuń pytanie">Usuń</button>
    </div>
    </summary>

    <div class="qcontent">
      <label>Treść pytania
        <textarea name="q_text_${index}" required maxlength="180"></textarea>
      </label>

      <div class="opts">
        <label>Odpowiedź A <input name="q_${index}_opt_0" required maxlength="60"></label>
        <label>Odpowiedź B <input name="q_${index}_opt_1" required maxlength="60"></label>
        <label>Odpowiedź C <input name="q_${index}_opt_2" required maxlength="60"></label>
        <label>Odpowiedź D <input name="q_${index}_opt_3" required maxlength="60"></label>
        <label>Poprawna odpowiedź
          <select name="q_${index}_correct" required>
            <option value="0">A</option>
            <option value="1">B</option>
            <option value="2">C</option>
            <option value="3">D</option>
          </select>
        </label>
      </div>
    </div>
  `;
    return wrap;
}

export class AdminQuizBuilder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        const session = store.state.session;
        if (session?.role !== 'admin') {
            this.shadowRoot.innerHTML = `<div style="color:var(--muted)">Brak dostępu.</div>`;
            return;
        }

        const form = this.shadowRoot.getElementById('form');
        const qsWrap = this.shadowRoot.getElementById('questions');
        const qCount = this.shadowRoot.getElementById('qCount');
        const err = this.shadowRoot.getElementById('err');
        const ok = this.shadowRoot.getElementById('ok');
        const editId = this.getAttribute('edit-id') || '';
        const editingQuiz = editId
            ? store.state.quizzes.find((q) => q.id === editId)
            : null;

        // nagłówek zależnie od trybu
        this.shadowRoot.getElementById('title').textContent = editingQuiz
            ? 'Edytuj quiz'
            : 'Dodaj nowy quiz';

        // wyjdź bez zapisu
        this.shadowRoot
            .getElementById('exitBtn')
            .addEventListener('click', () => {
                // bez zapisu zmian
                window.location.hash = '#/dashboard';
            });

        const syncCount = () =>
            (qCount.textContent = String(qsWrap.children.length));

        if (editingQuiz) {
            // uzupełnij pola
            form.querySelector('[name="category"]').value =
                editingQuiz.category || 'sport';
            form.querySelector('[name="title"]').value =
                editingQuiz.title || '';
            form.querySelector('[name="cover"]').value =
                editingQuiz.cover || '';

            // pytania
            qsWrap.innerHTML = '';
            editingQuiz.questions.forEach((qq, i) => {
                const box = makeQuestionBox(i);
                qsWrap.appendChild(box);

                // set values
                box.querySelector(`[name="q_text_${i}"]`).value = qq.text || '';
                qq.options?.forEach((opt, k) => {
                    const inp = box.querySelector(`[name="q_${i}_opt_${k}"]`);
                    if (inp) inp.value = opt || '';
                });
                box.querySelector(`[name="q_${i}_correct"]`).value = String(
                    qq.correctIndex ?? 0
                );

                box.open = i === 0; // np. tylko pierwsze otwarte
            });

            ok.textContent = `Tryb edycji: ${editingQuiz.title}`;
            syncCount();
        }

        this.shadowRoot.getElementById('addQ').addEventListener('click', () => {
            err.textContent = '';
            ok.textContent = '';
            if (qsWrap.children.length >= 12) {
                err.textContent = 'Max 12 pytań.';
                return;
            }
            // qsWrap.appendChild(makeQuestionBox(qsWrap.children.length));

            const newBox = makeQuestionBox(qsWrap.children.length);
            qsWrap.appendChild(newBox);

            // przewiń do świeżo dodanego pytania
            newBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            syncCount();
        });

        qsWrap.addEventListener('click', (ev) => {
            const btn = ev.target.closest('[data-remove]');
            if (btn) ev.preventDefault();
            if (!btn) return;
            btn.closest('.qbox')?.remove();
            // reindex
            [...qsWrap.children].forEach((node, i) => {
                node.querySelector('b').textContent = `Pytanie ${i + 1}`;
                node.dataset.index = String(i);
            });
            syncCount();
        });

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            err.textContent = '';
            ok.textContent = '';

            const fd = new FormData(form);
            const title = String(fd.get('title') || '').trim();
            const category = String(fd.get('category') || '').trim();
            const cover =
                String(fd.get('cover') || '').trim() ||
                'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=70';

            if (!title) {
                err.textContent = 'Tytuł jest wymagany.';
                return;
            }
            if (qsWrap.children.length === 0) {
                err.textContent = 'Dodaj przynajmniej 1 pytanie.';
                return;
            }

            const questions = [];
            for (let i = 0; i < qsWrap.children.length; i++) {
                const text = String(fd.get(`q_text_${i}`) || '').trim();
                const options = [0, 1, 2, 3].map((k) =>
                    String(fd.get(`q_${i}_opt_${k}`) || '').trim()
                );
                const correctIndex = Number(fd.get(`q_${i}_correct`));

                if (!text || options.some((o) => !o)) {
                    err.textContent = `Uzupełnij pytanie ${i + 1}.`;
                    return;
                }
                questions.push({
                    id: `q${i + 1}`,
                    text,
                    options,
                    correctIndex,
                });
            }

            // const id = `qz_${Date.now().toString(36)}`;
            // const newQuiz = { id, category, title, cover, questions };

            // store.state.quizzes = [newQuiz, ...store.state.quizzes];

            const id = editingQuiz
                ? editingQuiz.id
                : `qz_${Date.now().toString(36)}`;
            const newQuiz = { id, category, title, cover, questions };

            if (editingQuiz) {
                store.state.quizzes = store.state.quizzes.map((q) =>
                    q.id === id ? newQuiz : q
                );
                ok.textContent = 'Zapisano zmiany ✅';
                setTimeout(() => go('/dashboard'), 250);
            } else {
                store.state.quizzes = [newQuiz, ...store.state.quizzes];
                ok.textContent =
                    'Zapisano! Quiz jest dostępny na dashboardzie.';
                form.reset();
                qsWrap.innerHTML = '';
                syncCount();
            }

            window.location.hash = '#/dashboard';

            ok.textContent = 'Zapisano! Quiz jest dostępny na dashboardzie.';
            form.reset();
            qsWrap.innerHTML = '';
            syncCount();
        });

        syncCount();
    }
}

customElements.define('admin-quiz-builder', AdminQuizBuilder);
