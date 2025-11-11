import { readFile } from "fs/promises";
import type { TokenData } from "./types";

export const readTokenFile = async (filePath: string): Promise<TokenData> => {
	try {
		const fileContent = await readFile(filePath, "utf-8");
		const data = JSON.parse(fileContent) as TokenData;

		// Validate required fields
		if (!data.access_token || !data.refresh_token) {
			throw new Error("Token file must contain 'access_token' and 'refresh_token' fields");
		}

		return data;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error("Invalid JSON format in token file");
		}
		throw error;
	}
};

export const watchTokenFile = (filePath: string, onChange: () => void): (() => void) => {
	const { watch } = require("fs");
	const watcher = watch(filePath, (eventType: string) => {
		if (eventType === "change") {
			onChange();
		}
	});

	return () => watcher.close();
};
