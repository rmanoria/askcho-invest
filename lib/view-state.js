export function readQueryParam(key) {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(key);
}

export function readPositivePage(key = "page") {
    const value = Number.parseInt(readQueryParam(key) || "", 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
}

export function replaceQueryParams(updates) {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") url.searchParams.delete(key);
        else url.searchParams.set(key, String(value));
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
        window.history.replaceState({ ...window.history.state }, "", nextUrl);
    }
}
