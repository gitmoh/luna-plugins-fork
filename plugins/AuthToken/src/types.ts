export interface TokenData {
	access_token: string;
	refresh_token: string;
	expiry_time?: number; // Unix timestamp when token expires
	token_type?: string; // Usually "Bearer"
}

export interface PluginStorage {
	tokenFilePath?: string;
	tokens?: TokenData;
	lastRefresh?: number; // Timestamp of last token refresh
}
