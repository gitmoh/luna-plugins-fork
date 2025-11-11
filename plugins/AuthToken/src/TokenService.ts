import { ftch } from "@luna/core";
import type { TokenData } from "./types";
import { storage } from "./Settings";

export class TokenService {
	private static refreshTimeout: NodeJS.Timeout | null = null;

	/**
	 * Injects the access token into the app's authentication system
	 */
	public static async injectToken(tokenData: TokenData): Promise<void> {
		if (!tokenData.access_token) {
			throw new Error("No access token available");
		}

		// Store tokens in storage
		storage.tokens = tokenData;
		storage.lastRefresh = Date.now();

		// Schedule automatic refresh if expiry_time is provided
		if (tokenData.expiry_time) {
			this.scheduleTokenRefresh(tokenData.expiry_time);
		}
	}

	/**
	 * Refreshes the bearer token using the refresh token
	 */
	public static async refreshToken(): Promise<TokenData> {
		if (!storage.tokens?.refresh_token) {
			throw new Error("No refresh token available");
		}

		try {
			// TIDAL's token refresh endpoint
			// TODO: Find the correct client_id using findModuleProperty or allow configuration in settings
			// For now, you may need to manually refresh tokens by updating the JSON file
			const response = await ftch("https://auth.tidal.com/v1/oauth2/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: storage.tokens.refresh_token,
					// client_id: "...", // May be required depending on TIDAL's OAuth configuration
				}),
			});

			if (!response.ok) {
				throw new Error(`Token refresh failed: ${response.statusText}`);
			}

			const data = await response.json();
			const newTokenData: TokenData = {
				access_token: data.access_token,
				refresh_token: data.refresh_token || storage.tokens.refresh_token,
				expiry_time: data.expiry_time,
				token_type: data.token_type,
			};

			await this.injectToken(newTokenData);
			return newTokenData;
		} catch (error) {
			throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Schedules automatic token refresh before expiration
	 */
	private static scheduleTokenRefresh(expiryTime: number): void {
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
		}

		// Calculate time until expiration (expiry_time is Unix timestamp)
		const now = Date.now();
		const expiryMs = expiryTime * 1000; // Convert to milliseconds
		const timeUntilExpiry = expiryMs - now;

		// Refresh 5 minutes before expiration, but at least 1 minute from now
		const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000);

		// Only schedule if we have positive time
		if (refreshTime > 0) {
			this.refreshTimeout = setTimeout(() => {
				this.refreshToken().catch((error) => {
					console.error("Automatic token refresh failed:", error);
				});
			}, refreshTime);
		}
	}

	/**
	 * Clears the scheduled token refresh
	 */
	public static clearRefreshSchedule(): void {
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
			this.refreshTimeout = null;
		}
	}

	/**
	 * Gets the current access token for use in API requests
	 */
	public static getCurrentToken(): string | undefined {
		return storage.tokens?.access_token;
	}

	/**
	 * Checks if a token is available and not expired
	 */
	public static isTokenValid(): boolean {
		if (!storage.tokens?.access_token) return false;

		if (storage.tokens.expiry_time) {
			const expirationTime = storage.tokens.expiry_time * 1000; // Convert to ms
			return Date.now() < expirationTime;
		}

		return true; // If no expiration info, assume valid
	}
}
