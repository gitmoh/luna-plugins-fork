import { ftch } from "@luna/core";
import type { AccountInfo, SubscriptionInfo } from "./types";
import { storage } from "./storage";

export class AccountService {
	/**
	 * Fetches user account information from TIDAL API
	 */
	public static async fetchAccountInfo(accessToken: string): Promise<AccountInfo | null> {
		try {
			const data = await ftch.json<any>("https://api.tidal.com/v1/sessions", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Accept": "application/json",
				},
			});

			const accountInfo: AccountInfo = {
				userId: data.userId,
				username: data.user?.username,
				firstName: data.user?.firstName,
				lastName: data.user?.lastName,
				email: data.user?.email,
				countryCode: data.countryCode || data.user?.countryCode,
				created: data.user?.created,
				picture: data.user?.picture,
				newsletter: data.user?.newsletter,
				acceptedEULA: data.user?.acceptedEULA,
				gender: data.user?.gender,
				dateOfBirth: data.user?.dateOfBirth,
			};

			storage.accountInfo = accountInfo;
			return accountInfo;
		} catch (error) {
			console.error("Failed to fetch account info:", error);
			return null;
		}
	}

	/**
	 * Fetches subscription information from TIDAL API
	 */
	public static async fetchSubscriptionInfo(userId: number, accessToken: string): Promise<SubscriptionInfo | null> {
		try {
			const data = await ftch.json<any>(`https://api.tidal.com/v1/users/${userId}/subscription`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Accept": "application/json",
				},
			});

			const subscriptionInfo: SubscriptionInfo = {
				type: data.type || data.subscription?.type,
				status: data.status,
				subscription: data.subscription,
				highestSoundQuality: data.highestSoundQuality,
				premiumAccess: data.premiumAccess,
				canGetTrial: data.canGetTrial,
				paymentType: data.paymentType,
				startDate: data.startDate,
				endDate: data.endDate,
				validUntil: data.validUntil,
			};

			storage.subscriptionInfo = subscriptionInfo;
			return subscriptionInfo;
		} catch (error) {
			console.error("Failed to fetch subscription info:", error);
			return null;
		}
	}

	/**
	 * Fetches all account and subscription information
	 */
	public static async fetchAllAccountData(accessToken: string): Promise<{ account: AccountInfo | null; subscription: SubscriptionInfo | null }> {
		const account = await this.fetchAccountInfo(accessToken);

		let subscription: SubscriptionInfo | null = null;
		if (account?.userId) {
			subscription = await this.fetchSubscriptionInfo(account.userId, accessToken);
		}

		return { account, subscription };
	}
}
