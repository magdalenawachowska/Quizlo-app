const API_URL = 'https://opentdb.com/api.php';
const DEFAULT_AMOUNT = 6;

function decodeOpenTdb(str = '') {
  try {
    return decodeURIComponent(str);
  } catch {
    return String(str);
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pobiera pytania MCQ z OpenTDB (MIX kategorii) i mapuje do formatu Twojej apki.
 * @param {{ amount?: number, signal?: AbortSignal, timeoutMs?: number }} opts
 */
export async function fetchTriviaQuiz(opts = {}) {
  const amount = Number(opts.amount ?? DEFAULT_AMOUNT) || DEFAULT_AMOUNT;
  const timeoutMs = Number(opts.timeoutMs ?? 8000);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  // jeśli ktoś podał signal z zewnątrz, to “przekaź” abort
  if (opts.signal) {
    if (opts.signal.aborted) ctrl.abort();
    else opts.signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }

  try {
    // encode=url3986 => prosty decodeURIComponent (bez HTML entities)
    // UWAGA: tu NIE ma category=... -> MIX
    const url = `${API_URL}?amount=${amount}&type=multiple&encode=url3986`;

    // microtask
    await Promise.resolve();

    const res = await fetch(url, { signal: ctrl.signal });

    // obsługa 429 czytelniej
    if (res.status === 429) {
      throw new Error('Za dużo zapytań do OpenTDB (429). Odczekaj chwilę i spróbuj ponownie.');
    }
    if (!res.ok) {
      throw new Error(`OpenTDB: HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.response_code !== 0 || !Array.isArray(data.results)) {
      throw new Error('OpenTDB: zły format danych lub brak pytań.');
    }

    const results = data.results;

    const questions = results.map((r, idx) => {
      const text = decodeOpenTdb(r.question);
      const correct = decodeOpenTdb(r.correct_answer);
      const incorrect = Array.isArray(r.incorrect_answers)
        ? r.incorrect_answers.map(decodeOpenTdb)
        : [];

      const mixed = shuffle([correct, ...incorrect]);
      const correctIndex = mixed.findIndex((x) => x === correct);

      return {
        id: `q${idx + 1}`,
        text,
        options: mixed,
        correctIndex: correctIndex < 0 ? 0 : correctIndex,
      };
    });

    const id = `qz_trivia_${Date.now().toString(36)}`;
    const quiz = {
      id,
      category: 'inne',
      title: `Trivia quiz`,
      cover: 'https://i.pinimg.com/736x/de/54/42/de54424d43501a053bee938cc2ab6ec9.jpg',
      questions,
     // categoryLabel,
      source: 'opentdb',
    };

    return quiz;
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error('Timeout: nie udało się pobrać quizu (spróbuj ponownie).');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
