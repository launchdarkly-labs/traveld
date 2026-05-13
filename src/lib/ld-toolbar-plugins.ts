import {
  EventInterceptionPlugin,
  FlagOverridePlugin,
} from "@launchdarkly/toolbar/plugins";

export const flagOverridePlugin = new FlagOverridePlugin({
  storageNamespace: "traveld-ld-overrides",
});

export const eventInterceptionPlugin = new EventInterceptionPlugin();
