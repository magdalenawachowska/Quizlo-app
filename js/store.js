import { storage } from './utils/storage.js';

const LS_KEY = 'quizlab_state_v1';

const initialState = {
    theme: storage.get('quizlab_theme', 'light'),
    session: storage.get('quizlab_session', null), // --> userId, role, displayName
    quizzes: [], // wczytane z json + local additions
    historyByUser: storage.get('quizlab_history', {}), // --> userId: [attempts...]
    current: null, // --> quizId, index, answers[], score, startedAtMs, startedAtISO
};

class Store extends EventTarget {
    constructor() {
        super();
        const persisted = storage.get(LS_KEY, null);
        const base = persisted
            ? { ...initialState, ...persisted }
            : initialState;

        this.state = new Proxy(base, {
            set: (obj, prop, value) => {
                obj[prop] = value;
                this.persist();
                this.dispatchEvent(
                    new CustomEvent('change', { detail: { prop, value } })
                );
                return true;
            },
        });
    }

    patch(partial) {
        Object.entries(partial).forEach(([k, v]) => (this.state[k] = v));
    }

    persist() {
        const toSave = {
            theme: this.state.theme,
            session: this.state.session,
            quizzes: this.state.quizzes,
            historyByUser: this.state.historyByUser,
            current: this.state.current,
        };
        storage.set(LS_KEY, toSave);
        storage.set('quizlab_theme', this.state.theme);
        storage.set('quizlab_session', this.state.session);
        storage.set('quizlab_history', this.state.historyByUser);
    }

    subscribe(fn) {
        const handler = (e) => fn(this.state, e.detail);
        this.addEventListener('change', handler);
        return () => this.removeEventListener('change', handler);
    }
}

export const store = new Store();
