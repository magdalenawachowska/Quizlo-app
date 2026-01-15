import { store } from '../store.js';
import './confirm-modal.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{ display:block; }
    .tile{
      border-radius: var(--radius-xl);
      background: var(--card);
      box-shadow: var(--shadow);
      overflow:hidden;
      transform: translateY(0);
      transition: transform var(--speed) var(--ease);
      cursor: pointer;
      position: relative;
    }
    .tile:hover{ transform: translateY(-2px); }

    .cover{
      height: 110px;
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .cover::after{
      content:"";
      position:absolute; inset:0;
      background: linear-gradient(180deg, rgba(0,0,0,.0), rgba(0,0,0,.18));
    }

    /* ADMIN -EDIT/DELETE*/
    .admin-actions{
      position:absolute;
      top: 10px;
      right: 10px;
      display:flex;
      gap: 8px;
      z-index: 3;
    }
    .hidden{ display:none !important; }

    .iconBtn{
      width: 34px;
      height: 34px;
      border-radius: 999px;
      display:grid;
      place-items:center;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: rgba(255,255,255,.55);
      backdrop-filter: blur(10px);
      cursor:pointer;
      transition: transform var(--speed) var(--ease), background var(--speed) var(--ease);
      color: var(--text);
      padding: 0;
    }
    .iconBtn:hover{ transform: translateY(-1px); }
    .iconBtn:active{ transform: translateY(0px); }

    /* dark mode:*/ 
    :host-context([data-theme='dark']) .iconBtn{
      background: color-mix(in oklab, var(--card), transparent 40%);
      color: #fff;
      border-color: color-mix(in oklab, var(--muted), transparent 60%);
    }

    svg{ display:block; }

    .body{ padding: 14px; display:grid; gap: 10px; }
    .title{ font-weight: 700; }
    .meta{ display:flex; gap: 10px; flex-wrap: wrap; }
    .chip{
      display:inline-flex; align-items:center;
      padding: 6px 10px; border-radius: 999px;
      font-size: 12px; color: var(--muted);
      background: color-mix(in oklab, var(--surface), var(--card) 50%);
      border: 1px solid color-mix(in oklab, var(--muted), transparent 75%);
    }
    .row{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }

    #startBtn{
      height: 36px;
      border-radius: 999px;
      border: none;
      cursor:pointer;
      padding: 0 14px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary), #fff 35%));
      color: color-mix(in oklab, var(--card), var(--text) 20%);
      transition: transform var(--speed) var(--ease);
    }
    #startBtn:hover{ transform: translateY(-1px); }
  </style>

  <div class="tile">
    <div class="cover" id="cover">
      <div class="admin-actions hidden" id="adminActions">
        <button class="iconBtn" id="editBtn" title="Edytuj quiz" aria-label="Edytuj quiz" type="button">
          <!-- pencil -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.854a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708l-9.5 9.5L3 13l.354-2.646 9.5-9.5z"/>
            <path fill-rule="evenodd" d="M1 15.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H1.5a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>

        <button class="iconBtn" id="delBtn" title="Usuń quiz" aria-label="Usuń quiz" type="button">
          <!-- trash -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5.5l.5-.5h4l.5.5H14a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="body">
      <div class="title" id="title"></div>
      <div class="meta">
        <span class="chip" id="cat"></span>
        <span class="chip" id="count"></span>
      </div>
      <div class="row">
        <span class="chip">Ready</span>
        <button id="startBtn" type="button">START</button>
      </div>
    </div>
  </div>
`;

export class QuizTile extends HTMLElement {
    data = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        // START
        this.shadowRoot
            .getElementById('startBtn')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('start', { bubbles: true }));
            });

        // klik w tile = start
        // this.shadowRoot.querySelector('.tile').addEventListener('click', () => {
        //     this.dispatchEvent(new CustomEvent('start', { bubbles: true }));
        // });

        // EDIT / DELETE (admin only)
        this.shadowRoot
            .getElementById('editBtn')
            .addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('edit', { bubbles: true }));
            });

        this.shadowRoot
            .getElementById('delBtn')
            .addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dispatchEvent(
                    new CustomEvent('delete', { bubbles: true })
                );
            });

        this.render();
    }

    render() {
        if (!this.data) return;
        const q = this.data;

        this.shadowRoot.getElementById(
            'cover'
        ).style.backgroundImage = `url("${q.cover}")`;
        this.shadowRoot.getElementById('title').textContent = q.title;
        this.shadowRoot.getElementById('cat').textContent = `#${q.category}`;
        this.shadowRoot.getElementById(
            'count'
        ).textContent = `Pytania: ${q.questions.length}`;

        //overlay tylko dla admina
        const isAdmin = store.state.session?.role === 'admin';
        this.shadowRoot
            .getElementById('adminActions')
            .classList.toggle('hidden', !isAdmin);
    }
}

customElements.define('quiz-tile', QuizTile);
