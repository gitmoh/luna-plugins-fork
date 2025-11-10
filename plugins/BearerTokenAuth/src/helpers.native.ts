import { showOpenDialog } from "@luna/lib.native";
import { readFile } from "fs/promises";

/**
 * Opens a file dialog to select a JSON file
 * @returns The file path if selected, undefined if cancelled
 */
export const selectTokenFile = async (): Promise<string | undefined> => {
	const { canceled, filePaths } = await showOpenDialog({
		properties: ["openFile"],
		filters: [{ name: "JSON Files", extensions: ["json"] }],
	});
	if (!canceled && filePaths.length > 0) return filePaths[0];
	return undefined;
};

/**
 * Reads a JSON file and extracts the bearer token
 * Supports multiple JSON formats:
 * - { "token": "..." }
 * - { "bearer_token": "..." }
 * - { "bearerToken": "..." }
 * - { "access_token": "..." }
 * - { "accessToken": "..." }
 *
 * @param filePath Path to the JSON file
 * @returns The extracted bearer token
 * @throws Error if file cannot be read or token not found
 */
export const readTokenFromFile = async (filePath: string): Promise<string> => {
	try {
		const fileContent = await readFile(filePath, "utf-8");
		const jsonData = JSON.parse(fileContent);

		// Try multiple possible token field names
		const token =
			jsonData.token ||
			jsonData.bearer_token ||
			jsonData.bearerToken ||
			jsonData.access_token ||
			jsonData.accessToken;

		if (!token || typeof token !== "string") {
			throw new Error(
				'Token not found in JSON file. Expected one of: "token", "bearer_token", "bearerToken", "access_token", or "accessToken"'
			);
		}

		return token;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error("Invalid JSON file format");
		}
		throw error;
	}
};
