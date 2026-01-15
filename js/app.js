import { store } from './store.js';
import { onRouteChange, go } from './router.js';
import { loadQuizzes } from './services/quizService.js';
import './components/app-shell.js';

async function bootstrap() {
    document.documentElement.dataset.theme = store.state.theme;

    const abort = new AbortController();
    try {
        const quizzes = await loadQuizzes({ signal: abort.signal });

        // jeśli admin dodawał quizy wcześniej, są już w store.state.quizzes (persist)
        // ale pierwszy start projektu: wczytaj z JSON
        if (!store.state.quizzes?.length) {
            store.state.quizzes = quizzes;
        } else {
            // merge: zachowaj zapisane w LS + dodaj brakujące z JSON po id
            const map = new Map(store.state.quizzes.map((q) => [q.id, q]));
            for (const q of quizzes) if (!map.has(q.id)) map.set(q.id, q);
            store.state.quizzes = [...map.values()];
        }
    } catch (e) {
        // error handling
        console.error('Błąd wczytywania quizów:', e);
    }

    onRouteChange(() => {
        if (!location.hash) go('/login');
    });
}

bootstrap();
