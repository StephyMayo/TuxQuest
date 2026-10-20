import { Suspense } from "react";
import { MissionList } from "./MissionList";

export default function Page() {
  return (
    <Suspense>
      <MissionList />
    </Suspense>
  );
}
