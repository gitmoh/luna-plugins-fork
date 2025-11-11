import { ReactiveStore } from "@luna/core";
import type { PluginStorage } from "./types";

export const storage = await ReactiveStore.getPluginStorage<PluginStorage>("AuthToken", {
	tokenFilePath: undefined,
	tokens: undefined,
	lastRefresh: undefined,
	accountInfo: undefined,
	subscriptionInfo: undefined,
});
