'use client';

export function PostScreen({ data }: { data: any }) {
  return (
    <>
      <h1>Post</h1>
      <hr />
      {data.title}
    </>
  );
}
