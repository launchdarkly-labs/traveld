"use client";

import { useFlags } from "launchdarkly-react-client-sdk";
import { useLaunchDarklyToolbar } from "@launchdarkly/toolbar/react";
import {
  eventInterceptionPlugin,
  flagOverridePlugin,
} from "@/lib/ld-toolbar-plugins";
import { FLAG_KEYS } from "@/lib/flags";

const devToolbarEnabled = process.env.NODE_ENV === "development";

export function LaunchDarklyDevToolbar() {
  const flags = useFlags();
  const toolbarEnabled =
    devToolbarEnabled && flags[FLAG_KEYS.ldDevToolbar] === true;

  useLaunchDarklyToolbar({
    flagOverridePlugin,
    eventInterceptionPlugin,
    position: "bottom-right",
    enabled: toolbarEnabled,
  });

  return null;
}
