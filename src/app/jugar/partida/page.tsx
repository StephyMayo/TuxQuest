import { Suspense } from "react";
import { Game } from "./Game";

export default function Page() {
  return (
    <Suspense>
      <Game />
    </Suspense>
  );
}
