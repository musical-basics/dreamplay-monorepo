import { DB_PACKAGE } from "@dreamplay/db";
import { ANALYTICS_PACKAGE } from "@dreamplay/analytics";
import { AB_PACKAGE } from "@dreamplay/ab";
import { EMAIL_PACKAGE } from "@dreamplay/email";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">DreamPlay Monorepo</h1>
      <p className="text-sm text-gray-500">
        Workspace packages linked: {[DB_PACKAGE, ANALYTICS_PACKAGE, AB_PACKAGE, EMAIL_PACKAGE].join(", ")}
      </p>
    </main>
  );
}
