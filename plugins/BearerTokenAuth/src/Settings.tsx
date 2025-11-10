import { ReactiveStore } from "@luna/core";
import { LunaButtonSetting, LunaSecureTextSetting, LunaSettings, LunaTextSetting } from "@luna/ui";

import React from "react";

import { errSignal } from ".";
import { readTokenFromFile, selectTokenFile } from "./helpers.native";

export const storage = await ReactiveStore.getPluginStorage<{
	bearerToken?: string;
	tokenFilePath?: string;
}>("BearerTokenAuth");

export const Settings = () => {
	const [token, setToken] = React.useState(storage.bearerToken);
	const [filePath, setFilePath] = React.useState(storage.tokenFilePath);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | undefined>();

	React.useEffect(() => {
		errSignal!._ = (token ?? "") === "" ? "Bearer token not loaded." : error;
	}, [token, error]);

	const handleSelectFile = async () => {
		setLoading(true);
		setError(undefined);

		try {
			const selectedPath = await selectTokenFile();
			if (!selectedPath) {
				setLoading(false);
				return; // User cancelled
			}

			const extractedToken = await readTokenFromFile(selectedPath);

			// Store the token and file path
			storage.bearerToken = extractedToken;
			storage.tokenFilePath = selectedPath;

			setToken(extractedToken);
			setFilePath(selectedPath);
			setError(undefined);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to load token from file";
			setError(errorMessage);
			errSignal!._ = errorMessage;
		} finally {
			setLoading(false);
		}
	};

	const handleClearToken = () => {
		storage.bearerToken = undefined;
		storage.tokenFilePath = undefined;
		setToken(undefined);
		setFilePath(undefined);
		setError(undefined);
	};

	return (
		<LunaSettings>
			<LunaButtonSetting
				title="Select Token File"
				desc="Choose a JSON file containing your bearer token"
				onClick={handleSelectFile}
				disabled={loading}
			>
				{loading ? "Loading..." : "Select File"}
			</LunaButtonSetting>

			{filePath && (
				<LunaTextSetting
					title="Token File Path"
					desc="Currently loaded token file"
					value={filePath}
					readOnly
				/>
			)}

			{token && (
				<>
					<LunaSecureTextSetting
						title="Bearer Token"
						desc="Your authentication token (stored securely)"
						value={token}
						readOnly
						onChange={() => {}} // Required by component but we're in readOnly mode
					/>

					<LunaButtonSetting
						title="Clear Token"
						desc="Remove the stored bearer token"
						onClick={handleClearToken}
					>
						Clear Token
					</LunaButtonSetting>
				</>
			)}

			{error && (
				<div style={{ color: "red", padding: "10px", marginTop: "10px" }}>
					Error: {error}
				</div>
			)}
		</LunaSettings>
	);
};
