import { store } from '../store.js';

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    button{
      height: 40px; width: 40px;
      border-radius: 999px;
      border: 1px solid color-mix(in oklab, var(--muted), transparent 70%);
      background: color-mix(in oklab, var(--card) 85%, transparent);
      cursor:pointer;
      display:grid; place-items:center;
      transition: transform var(--speed) var(--ease);
    }
    button:hover{ transform: translateY(-1px); }
    .ico{ font-weight: 900; color: var(--muted); }
    button:hover .ico{ color: var(--text); }
  </style>

  <button id="btn" title="Tryb jasny/ciemny">
    <span class="ico" id="ico">☾</span>
  </button>
`;

export class ThemeToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(
            tpl.content.cloneNode(true)
        );
    }

    connectedCallback() {
        this.shadowRoot.getElementById('btn').addEventListener('click', () => {
            store.state.theme = store.state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = store.state.theme;
            this.render();
        });
        this.render();
    }

    render() {
        this.shadowRoot.getElementById('ico').textContent =
            store.state.theme === 'dark' ? '☀' : '☾';
    }
}

customElements.define('theme-toggle', ThemeToggle);
