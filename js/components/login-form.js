import { store } from '../store.js';
import { go } from '../router.js';
import { loadUsers, verifyUser } from '../services/auth.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    .card{
      background: var(--card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      padding: 22px;
      display:grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 18px;
      overflow:hidden;
    }
    @media (max-width: 820px){ .card{ grid-template-columns: 1fr; } }

    .hero{
      border-radius: var(--radius-xl);
      padding: 18px;
      background: linear-gradient(135deg,
        color-mix(in oklab, var(--accent), transparent 60%),
        color-mix(in oklab, var(--primary), transparent 65%)
      );
      position: relative;
      min-height: 220px;
    }
    .hero h1{ margin: 0 0 6px; font-size: 26px; }
    .hero p{ margin: 0; color: var(--muted); }
    .bubble{
      position:absolute; inset:auto 16px 16px auto;
      width: 140px; height: 140px;
      border-radius: 40px;
      background: color-mix(in oklab, var(--card), transparent 20%);
      box-shadow: var(--shadow-soft);
      transform: rotate(8deg);
    }

    form{ display:grid; gap: 12px; align-content:start; }
    label{ display:grid; gap: 6px; font-size: 13px; color: var(--muted); }
    input{
      height: 42px;
      border-radius: 14px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
      padding: 0 12px;
      background: color-mix(in oklab, var(--card), var(--surface) 20%);
      color: var(--text);
    }
    .row{ display:flex; gap: 10px; align-items:center; }
    button{
      height: 42px;
      border-radius: 999px;
      border: none;
      cursor:pointer;
      background: linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary), #fff 35%));
      color: color-mix(in oklab, var(--card), var(--text) 20%);
      font-weight: 600;
      transition: transform var(--speed) var(--ease);
    }
    button:hover{ transform: translateY(-1px); }
    .hint{ font-size: 12px; color: var(--muted); }
    .error{ color: var(--danger); font-size: 13px; min-height: 18px; }
    .loader{ display:none; font-size: 12px; color: var(--muted); }
    .loading .loader{ display:block; }
  </style>

  <section class="card fade-in">
    <div class="hero">
      <h1>Quizlo</h1>
      <p>Minimalistyczny projekt aplikacji do tworzenia i uzupełniania quiz'ów.</br></br>
       --> web components</br>
       --> localStorage</br>
       --> asynchroniczność</br>
       --> reaktywność - observer</br>
       --> wczytanie danych z json
       </p>
      <div class="bubble"></div>
    </div>

    <div>
      <form id="form">
        <label>
          Login
          <input name="username" autocomplete="username" required />
        </label>
        <label>
          Hasło
          <input name="password" type="password" autocomplete="current-password" required />
        </label>

        <button type="submit">Zaloguj</button>

        <div class="loader">Ładowanie użytkowników…</div>
        <div class="error" id="err"></div>

        <div class="hint">
          Testowe konta: <b>ania/1234</b>, <b>jan/1234</b>, <b>ola/abcd</b>, <b>admin/admin</b>
        </div>
      </form>
    </div>
  </section>
`;

export class LoginForm extends HTMLElement {
    #users = [];
    #abort = new AbortController();

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    async connectedCallback() {
        const form = this.shadowRoot.getElementById('form');
        const err = this.shadowRoot.getElementById('err');

        try {
            form.classList.add('loading');
            this.#users = await loadUsers({ signal: this.#abort.signal });
        } catch (e) {
            err.textContent = e?.message || 'Błąd ładowania użytkowników.';
        } finally {
            form.classList.remove('loading');
        }

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            err.textContent = '';

            const fd = new FormData(form);
            const username = String(fd.get('username') || '').trim();
            const password = String(fd.get('password') || '').trim();

            const session = verifyUser(this.#users, username, password);
            if (!session) {
                err.textContent = 'Niepoprawny login lub hasło.';
                return;
            }

            store.state.session = session;
            go('/dashboard');
        });
    }

    disconnectedCallback() {
        this.#abort.abort();
    }
}

customElements.define('login-form', LoginForm);
