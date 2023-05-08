'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Page({ params }: { params: { id: string } }) {
  const { data, error } = useSWR(`https://jsonplaceholder.typicode.com/posts/${params.id}`, fetcher);
  if (error) return 'Failed to load';
  if (!data) return 'Loading...';

  return data.title;
}
