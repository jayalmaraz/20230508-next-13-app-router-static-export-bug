import { fetcher } from '@/utils/fetcher';
import { isWeb } from '@/utils/isWeb';
import { onWeb } from '@/utils/onWeb';
import { Metadata } from 'next';
import { PostScreen } from './PostScreen';
import { PostScreenClientPage } from './PostScreenClientPage';

async function getData({ id }: { id: string }) {
  return fetcher(`https://jsonplaceholder.typicode.com/posts/${id}`);
}

type PageProps = { params: { id: string } };

// ref: https://json-ld.org/playground/
function generateJsonLd(data: any) {
  return {
    '@context': {
      name: 'http://rdf.data-vocabulary.org/#name',
      ingredient: 'http://rdf.data-vocabulary.org/#ingredients',
      yield: 'http://rdf.data-vocabulary.org/#yield',
      instructions: 'http://rdf.data-vocabulary.org/#instructions',
      step: {
        '@id': 'http://rdf.data-vocabulary.org/#step',
        '@type': 'xsd:integer',
      },
      description: 'http://rdf.data-vocabulary.org/#description',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
    name: data.title,
    ingredient: [
      '12 fresh mint leaves',
      '1/2 lime, juiced with pulp',
      '1 tablespoons white sugar',
      '1 cup ice cubes',
      '2 fluid ounces white rum',
      '1/2 cup club soda',
    ],
    yield: '1 cocktail',
    instructions: [
      {
        step: 1,
        description: 'Crush lime juice, mint and sugar together in glass.',
      },
      {
        step: 2,
        description: 'Fill glass to top with ice cubes.',
      },
      {
        step: 3,
        description: 'Pour white rum over ice.',
      },
      {
        step: 4,
        description: 'Fill the rest of glass with club soda, stir.',
      },
      {
        step: 5,
        description: 'Garnish with a lime wedge.',
      },
    ],
  };
}

export const generateMetadata = onWeb(async ({ params }: PageProps): Promise<Metadata> => {
  const data = await getData({ id: params.id });
  return {
    title: `Post: ${data?.title}`,
    description: 'Dynamic metadata for the post page',
  };
});

export default async function Page({ params }: PageProps) {
  if (isWeb) {
    const data = await getData({ id: params.id });
    const jsonLd = generateJsonLd(data);

    return (
      <main>
        <section>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <PostScreen data={data} />
        </section>
      </main>
    );
  }

  return <PostScreenClientPage params={params} />;
}

// fucking bullshit temporary hack workaround (see https://github.com/vercel/next.js/issues/49059)
export const generateStaticParams = isWeb
  ? undefined
  : async () => {
      return [{ id: '1' }, { id: '2' }];
    };
