import { isWeb } from '@/utils/isWeb';
import { PostScreen } from './PostScreen';
import { PostScreenClientPage } from './PostScreenClientPage';

const fetcher = (url: string) => fetch(url, { cache: 'no-cache' }).then((r) => r.json());

export default async function Page({ params }: { params: { id: string } }) {
  if (isWeb) {
    const data = await fetcher(`https://jsonplaceholder.typicode.com/posts/${params.id}`);
    return <PostScreen data={data} />;
  }

  return <PostScreenClientPage params={params} />;
}

// fucking bullshit temporary hack workaround (see https://github.com/vercel/next.js/issues/49059)
export const generateStaticParams = isWeb
  ? undefined
  : async () => {
      return [{ id: '1' }, { id: '2' }];
    };
