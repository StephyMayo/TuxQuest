import { Suspense } from "react";
import { Battle } from "../Battle";

export default function Page() {
  return (
    <Suspense>
      <Battle />
    </Suspense>
  );
}
