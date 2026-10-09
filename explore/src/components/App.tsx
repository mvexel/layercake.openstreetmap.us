import type { Context } from "@b9g/crank";
import { Store } from "../store.ts";
import { Header } from "./Header.tsx";
import { UnofficialNotice } from "./UnofficialNotice.tsx";
import { Viewer } from "./Viewer.tsx";

export function* App(this: Context) {
  const store = new Store(() => this.refresh());

  const onPopState = () => store.applyRoute();
  addEventListener("popstate", onPopState);
  this.cleanup(() => removeEventListener("popstate", onPopState));

  for ({} of this) {
    yield (
      <>
        <UnofficialNotice />
        <Header store={store} />
        <Viewer store={store} />
      </>
    );
  }
}
