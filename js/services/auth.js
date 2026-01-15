export async function loadUsers({ signal } = {}) {
    const res = await fetch('./data/users.json', { signal });
    if (!res.ok)
        throw new Error(
            `Nie udało się wczytać użytkowników (HTTP ${res.status}).`
        );
    return res.json();
}

export function verifyUser(users, username, password) {
    const u = users.find(
        (x) => x.username === username && x.password === password
    );
    if (!u) return null;
    return { userId: u.id, role: u.role, displayName: u.displayName };
}
