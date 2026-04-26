"use client";
import { useTestQuery } from "@/hooks/queries/useTestQuery";

export default function TestPage() {
  const { data: test } = useTestQuery();
  console.log(test);
  return (
    <>
      <h1>API-TEST Component</h1>
      <ul>
        {test?.response?.body?.items?.item.map((t) => (
          <li key={t.contentid}>{t.title}</li>
        ))}
      </ul>
    </>
  );
}
