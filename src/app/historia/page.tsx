import { Suspense } from "react";
import { StoryMap } from "./StoryMap";

export default function Page() {
  return (
    <Suspense>
      <StoryMap />
    </Suspense>
  );
}
