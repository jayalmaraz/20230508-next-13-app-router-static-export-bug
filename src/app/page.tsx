import Link from 'next/link';

export default function Page() {
  return (
    <>
      <h1>Index Page</h1>
      <hr />
      <ul>
        <li>
          <Link href="/post/1">Post 1</Link>
        </li>
        <li>
          <Link href="/post/2">Post 2</Link>
        </li>
      </ul>

      <ul>
        <li>
          <Link href="/profile">My profile</Link>
        </li>
      </ul>
    </>
  );
}
