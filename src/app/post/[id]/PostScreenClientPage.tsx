'use client';

import useSWR from 'swr';
import { PostScreen } from './PostScreen';
import { PostScreenError } from './PostScreenError';
import { PostScreenLoading } from './PostScreenLoading';

const fetcher = (url: string) => fetch(url, { cache: 'no-cache' }).then((r) => r.json());

export function PostScreenClientPage({ params }: { params: { id: string } }) {
  const { data, error } = useSWR(`https://jsonplaceholder.typicode.com/posts/${params.id}`, fetcher);
  if (error) return <PostScreenError />;
  if (!data) return <PostScreenLoading />;
  return <PostScreen data={data} />;
}
