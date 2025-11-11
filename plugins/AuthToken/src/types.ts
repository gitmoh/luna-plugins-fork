export interface TokenData {
	access_token: string;
	refresh_token: string;
	expiry_time?: number; // Unix timestamp when token expires
	token_type?: string; // Usually "Bearer"
}

export interface AccountInfo {
	userId?: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	countryCode?: string;
	created?: string;
	picture?: string;
	newsletter?: boolean;
	acceptedEULA?: boolean;
	gender?: string;
	dateOfBirth?: string;
}

export interface SubscriptionInfo {
	type?: string; // e.g., "PREMIUM", "HIFI", "FAMILY"
	offlineGracePeriod?: number;
	status?: string;
	subscription?: {
		type?: string;
		offlineGracePeriod?: number;
	};
	highestSoundQuality?: string;
	premiumAccess?: boolean;
	canGetTrial?: boolean;
	paymentType?: string;
	startDate?: string;
	endDate?: string;
	validUntil?: string;
}

export interface PluginStorage {
	tokenFilePath?: string;
	tokens?: TokenData;
	lastRefresh?: number; // Timestamp of last token refresh
	accountInfo?: AccountInfo;
	subscriptionInfo?: SubscriptionInfo;
}
