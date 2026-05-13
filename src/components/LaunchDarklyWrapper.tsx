"use client";

import { LDProvider } from "launchdarkly-react-client-sdk";
import { useMemo } from "react";
import { LaunchDarklyDevToolbar } from "@/components/LaunchDarklyDevToolbar";
import { LdAdminWithLd } from "@/components/LdAdminPanel";
import { LdContextIdentifyEffect } from "@/components/LdContextIdentifyEffect";
import { useSession } from "@/context/session";
import { buildLdContext } from "@/lib/ld-context";
import {
  eventInterceptionPlugin,
  flagOverridePlugin,
} from "@/lib/ld-toolbar-plugins";

const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID ?? "";

export function LaunchDarklyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { anonymousKey, user, ready } = useSession();

  const context = useMemo(
    () =>
      buildLdContext({
        anonymousKey: ready ? anonymousKey : "booting",
        user,
      }),
    [anonymousKey, user, ready],
  );

  if (!clientSideID) {
    return <>{children}</>;
  }

  return (
    <LDProvider
      clientSideID={clientSideID}
      context={context}
      options={{
        evaluationReasons: true,
        plugins: [flagOverridePlugin, eventInterceptionPlugin],
      }}
      reactOptions={{ useCamelCaseFlagKeys: false }}
    >
      <LdContextIdentifyEffect />
      <LaunchDarklyDevToolbar />
      {children}
      <LdAdminWithLd />
    </LDProvider>
  );
}

export function hasLaunchDarklyClientId(): boolean {
  return Boolean(clientSideID);
}
