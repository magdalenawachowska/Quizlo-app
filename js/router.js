export function getRoute() {
    const hash = location.hash || '#/login';
    const [path, queryString] = hash.slice(1).split('?');
    const query = Object.fromEntries(new URLSearchParams(queryString || ''));
    return { path, query };
}

export function go(path, query = {}) {
    const qs = new URLSearchParams(query).toString();
    location.hash = `#${path}${qs ? '?' + qs : ''}`;
}

export function onRouteChange(cb) {
    window.addEventListener('hashchange', cb);
    cb();
}
