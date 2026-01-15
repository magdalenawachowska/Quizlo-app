import { store } from '../store.js';
import { getRoute, go, onRouteChange } from '../router.js';

import './login-form.js';
import './quiz-dashboard.js';
import './quiz-runner.js';
import './result-summary.js';
import './history-list.js';
import './admin-quiz-builder.js';
import './theme-toggle.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{ display:block; }
    .wrap{
        width: min(var(--max), 100% - 48px);
        margin: 0 auto;
        padding: 34px 0 56px;
        }

    @media (max-width: 560px){
        .wrap{ width: min(var(--max), 100% - 24px); }
        }

    .spacer{ height: 18px; }

    .topbar{
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      padding: 18px 22px;
      background: color-mix(in oklab, var(--card) 88%, transparent);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-soft);
      backdrop-filter: blur(10px);
    }
    .brand{ display:flex; align-items:center; gap:10px; font-weight:700; }
    .badge{
      width: 36px; height: 36px; border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--primary), #fff 40%));
      box-shadow: 0 10px 20px rgba(0,0,0,.10);
    }
    .right{ display:flex; align-items:center; gap:10px; }
    .hello{ color: var(--muted); font-size: 13px; }

    .btn{
      display:inline-flex; align-items:center; justify-content:center;
      height: 40px; padding: 0 14px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card) 85%, transparent);
      color: var(--muted);
      cursor:pointer;
      transition: transform var(--speed) var(--ease);
      font-weight: 650;
    }
    .btn:hover{ 
    transform: translateY(-1px);
    color: var(--text); }

    .btn-primary{
    border-color: transparent;
    background: color-mix(in oklab, var(--accent), #fff 60%);
    color: var(--text);
    }
    .btn-primary:hover{
    color: var(--text);  
    background: color-mix(in oklab, var(--accent), #fff 45%);
    }
    
    /*Mobile topbar*/
    @media (max-width: 680px){
    .topbar{
        flex-wrap: wrap;
        gap: 12px;
    }

    .hello{
        display: none !important;
    }

    /* wrzuć przyciski do drugiej linii */
    .right{
        width: 100%;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
    }

    .btn{
        height: 38px;
        padding: 0 12px;
        font-size: 13px;
    }
    }
  </style>

  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="badge"></div>
        <div>Quizlo</div>
      </div>

      <div class="right">
        <div class="hello" id="hello"></div>
        <theme-toggle></theme-toggle>
        <button class="btn" id="historyBtn">Historia</button>
        <button class="btn" id="adminBtn">Dodaj</button>
        <button class="btn btn-primary" id="dashBtn">Quizy</button>
        <button class="btn" id="logoutBtn">Wyloguj</button>
      </div>
    </div>

    <div class="spacer"></div>

    <main id="view"></main>
  </div>
`;

export class AppShell extends HTMLElement {
    #unsub = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        // theme
        document.documentElement.dataset.theme = store.state.theme;

        const s = this.shadowRoot;
        s.getElementById('logoutBtn').addEventListener('click', () => {
            store.state.session = null;
            store.state.current = null;
            go('/login');
        });

        s.getElementById('dashBtn').addEventListener('click', () =>
            go('/dashboard')
        );
        s.getElementById('historyBtn').addEventListener('click', () =>
            go('/history')
        );
        s.getElementById('adminBtn').addEventListener('click', () =>
            go('/admin')
        );

        this.#unsub = store.subscribe(() => this.render());
        onRouteChange(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        this.#unsub?.();
    }

    render() {
        const { path, query } = getRoute();
        const view = this.shadowRoot.getElementById('view');

        const session = store.state.session;
        const isLogged = !!session;

        // prosta ochrona routów
        const protectedRoutes = [
            '/dashboard',
            '/quiz',
            '/summary',
            '/history',
            '/admin',
        ];
        if (!isLogged && protectedRoutes.includes(path)) {
            go('/login');
            return;
        }

        // przyciski widoczne/ukryte
        this.shadowRoot.getElementById('logoutBtn').style.display = isLogged
            ? 'inline-flex'
            : 'none';
        this.shadowRoot.getElementById('dashBtn').style.display = isLogged
            ? 'inline-flex'
            : 'none';
        this.shadowRoot.getElementById('historyBtn').style.display = isLogged
            ? 'inline-flex'
            : 'none';
        this.shadowRoot.getElementById('adminBtn').style.display =
            session?.role === 'admin' ? 'inline-flex' : 'none';
        this.shadowRoot.getElementById('hello').textContent = isLogged
            ? `Hej, ${session.displayName}`
            : '';

        // mount view
        view.innerHTML = '';
        if (path === '/login')
            view.appendChild(document.createElement('login-form'));
        else if (path === '/dashboard')
            view.appendChild(document.createElement('quiz-dashboard'));
        else if (path === '/quiz') {
            const el = document.createElement('quiz-runner');
            el.setAttribute('quiz-id', query.id || '');
            view.appendChild(el);
        } else if (path === '/summary')
            view.appendChild(document.createElement('result-summary'));
        else if (path === '/history')
            view.appendChild(document.createElement('history-list'));
        else if (path === '/admin') {
            const el = document.createElement('admin-quiz-builder');
            if (query.id) el.setAttribute('edit-id', query.id);
            view.appendChild(el);
        } else view.appendChild(document.createElement('quiz-dashboard'));
    }
}

customElements.define('app-shell', AppShell);
