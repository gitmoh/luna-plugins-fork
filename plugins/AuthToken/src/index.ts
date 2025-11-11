import { Tracer, type LunaUnload } from "@luna/core";
import { readTokenFile, watchTokenFile } from "./fileReader.native";
import { storage } from "./storage";
import { TokenService } from "./TokenService";

export const unloads = new Set<LunaUnload>();
export const { trace, errSignal } = Tracer("[AuthToken]");
export { Settings } from "./Settings";

// Store the original fetch function
const originalFetch = window.fetch;

/**
 * Intercepts fetch requests to inject the access token
 */
const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
	const token = TokenService.getCurrentToken();

	// Only inject token for TIDAL API requests
	const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
	const isTidalRequest = url.includes("tidal.com") || url.includes("tidalhifi.com");

	if (token && isTidalRequest) {
		// Clone init if it exists, or create new one
		const modifiedInit: RequestInit = {
			...init,
			headers: {
				...(init?.headers || {}),
				Authorization: `Bearer ${token}`,
			},
		};

		try {
			const response = await originalFetch(input, modifiedInit);

			// If we get a 401, try to refresh the token
			if (response.status === 401 && storage.tokens?.refresh_token) {
				trace.msg.log("Token expired, attempting refresh...");

				try {
					await TokenService.refreshToken();
					const newToken = TokenService.getCurrentToken();

					if (newToken) {
						// Retry the request with the new token
						const retryInit: RequestInit = {
							...init,
							headers: {
								...(init?.headers || {}),
								Authorization: `Bearer ${newToken}`,
							},
						};
						return originalFetch(input, retryInit);
					}
				} catch (error) {
					console.error("[AuthToken] Failed to refresh token:", error);
					errSignal!._ = "Token refresh failed. Please check your tokens.";
				}
			}

			return response;
		} catch (error) {
			console.error("[AuthToken] Fetch error:", error);
			throw error;
		}
	}

	// If not a TIDAL request or no token, use original fetch
	return originalFetch(input, init);
};

// Replace window.fetch with our intercepted version
window.fetch = interceptedFetch;

// Restore original fetch on unload
unloads.add(() => {
	window.fetch = originalFetch;
	trace.msg.log("Restored original fetch");
});

/**
 * Initialize the plugin by loading tokens from the file if available
 */
const initialize = async () => {
	try {
		if (storage.tokenFilePath) {
			trace.msg.log(`Loading tokens from ${storage.tokenFilePath}`);
			const tokenData = await readTokenFile(storage.tokenFilePath);
			await TokenService.injectToken(tokenData);

			// Set up file watcher to reload tokens when the file changes
			const stopWatching = watchTokenFile(storage.tokenFilePath, async () => {
				try {
					trace.msg.log("Token file changed, reloading...");
					const newTokenData = await readTokenFile(storage.tokenFilePath!);
					await TokenService.injectToken(newTokenData);
					errSignal!._ = undefined;
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : "Failed to reload tokens";
					console.error("[AuthToken]", errorMsg);
					errSignal!._ = errorMsg;
				}
			});

			unloads.add(stopWatching);
			trace.msg.log("Token file watcher initialized");
		}
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : "Failed to load tokens";
		console.error("[AuthToken]", errorMsg);
		errSignal!._ = errorMsg;
	}
};

// Initialize the plugin after a short delay to ensure Luna is ready
setTimeout(() => {
	initialize().catch((error) => {
		console.error("[AuthToken] Plugin initialization failed:", error);
	});
}, 100);
