export async function loadQuizzes({ signal } = {}) {
    // mały “real feel” event loop: microtask + timeout
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 120));

    const res = await fetch('./data/quizzes.json', { signal });
    if (!res.ok)
        throw new Error(`Nie udało się wczytać quizów (HTTP ${res.status}).`);
    const data = await res.json();

    // podstawowa walidacja struktury
    if (!Array.isArray(data)) throw new Error('Dane quizów mają zły format.');
    return data;
}
