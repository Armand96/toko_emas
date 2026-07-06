import { useSearchParams } from 'react-router';
import { useCallback } from 'react';

/**
 * State synced with the URL query string.
 *
 * - On mount/refresh/deep-link: URL query params are respected, so
 *   filters/pagination are restored (persists across refresh & shared links).
 * - setQuery writes changes back to the URL via history.replace, so
 *   filter/pagination changes don't pollute browser back/forward history.
 */
export function useQueryParams(defaults) {
    const [searchParams, setSearchParams] = useSearchParams();

    const values = { ...defaults };
    for (const key of Object.keys(defaults)) {
        const rawValue = searchParams.get(key);
        if (rawValue === null) continue;

        if (typeof defaults[key] === 'number') {
            const parsed = Number(rawValue);
            if (!Number.isNaN(parsed)) values[key] = parsed;
        } else {
            values[key] = rawValue;
        }
    }

    const setQuery = useCallback((newValues) => {
        const params = new URLSearchParams(window.location.search);

        for (const key of Object.keys(newValues)) {
            const value = newValues[key];
            if (value === defaults[key] || value === '' || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        }

        const currentQuery = window.location.search.replace(/^\?/, '');
        const newQuery = params.toString();

        if (newQuery !== currentQuery) {
            setSearchParams(params, { replace: true });
        }
    }, [defaults, setSearchParams]);

    return [values, setQuery];
}
