export function qs(root, sel) {
    return root.querySelector(sel);
}
export function qsa(root, sel) {
    return [...root.querySelectorAll(sel)];
}

export function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
