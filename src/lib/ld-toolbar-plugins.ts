import {
  EventInterceptionPlugin,
  FlagOverridePlugin,
} from "@launchdarkly/toolbar/plugins";
import Observability from "@launchdarkly/observability";
import SessionReplay from "@launchdarkly/session-replay";

export const flagOverridePlugin = new FlagOverridePlugin({
  storageNamespace: "traveld-ld-overrides",
});

export const eventInterceptionPlugin = new EventInterceptionPlugin();

export const observabilityPlugin = new Observability({
  serviceName: "traveld",
  networkRecording: {
    enabled: true,
    recordHeadersAndBody: true,
  },
});

export const sessionReplayPlugin = new SessionReplay({
  serviceName: "traveld",
});
