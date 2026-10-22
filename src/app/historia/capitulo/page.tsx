import { Suspense } from "react";
import { Chapter } from "../Chapter";

export default function Page() {
  return (
    <Suspense>
      <Chapter />
    </Suspense>
  );
}
