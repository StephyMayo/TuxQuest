import { Suspense } from "react";
import { Shop } from "./Shop";

export default function Page() {
  return (
    <Suspense>
      <Shop />
    </Suspense>
  );
}
