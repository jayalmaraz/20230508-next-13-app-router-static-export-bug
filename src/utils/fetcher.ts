export const fetcher = (url: string) => fetch(url, { cache: 'no-cache' }).then((r) => r.json());
