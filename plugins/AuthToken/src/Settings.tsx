import { showOpenDialog } from "@luna/lib.native";
import { LunaButtonSetting, LunaLink, LunaSettings, LunaTextSetting } from "@luna/ui";
import React from "react";
import { errSignal } from ".";
import { readTokenFile } from "./fileReader.native";
import { storage } from "./storage";
import { TokenService } from "./TokenService";

export const Settings = () => {
	const [filePath, setFilePath] = React.useState(storage.tokenFilePath);
	const [isLoading, setIsLoading] = React.useState(false);
	const [status, setStatus] = React.useState<string>("");

	// Load tokens on mount if file path exists
	React.useEffect(() => {
		if (storage.tokenFilePath) {
			loadTokensFromFile(storage.tokenFilePath);
		}
	}, []);

	React.useEffect(() => {
		errSignal!._ = !storage.tokens ? "No tokens loaded. Please select a token file." : undefined;
	}, [storage.tokens]);

	const loadTokensFromFile = async (path: string) => {
		try {
			setIsLoading(true);
			setStatus("Loading tokens...");

			const tokenData = await readTokenFile(path);
			await TokenService.injectToken(tokenData);

			setStatus("Tokens loaded successfully!");
			errSignal!._ = undefined;

			// Clear status after 3 seconds
			setTimeout(() => setStatus(""), 3000);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Unknown error";
			setStatus(`Error: ${errorMsg}`);
			errSignal!._ = errorMsg;
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectFile = async () => {
		try {
			const result = await showOpenDialog({
				title: "Select Token File",
				properties: ["openFile"],
				filters: [
					{ name: "JSON Files", extensions: ["json"] },
					{ name: "All Files", extensions: ["*"] },
				],
			});

			if (result && !result.canceled && result.filePaths.length > 0) {
				const selectedPath = result.filePaths[0];
				storage.tokenFilePath = selectedPath;
				setFilePath(selectedPath);
				await loadTokensFromFile(selectedPath);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Failed to select file";
			setStatus(`Error: ${errorMsg}`);
			errSignal!._ = errorMsg;
		}
	};

	const handleRefreshToken = async () => {
		try {
			setIsLoading(true);
			setStatus("Refreshing token...");

			await TokenService.refreshToken();

			setStatus("Token refreshed successfully!");
			errSignal!._ = undefined;

			setTimeout(() => setStatus(""), 3000);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Failed to refresh token";
			setStatus(`Error: ${errorMsg}`);
			errSignal!._ = errorMsg;
		} finally {
			setIsLoading(false);
		}
	};

	const handleReloadFile = async () => {
		if (filePath) {
			await loadTokensFromFile(filePath);
		}
	};

	return (
		<LunaSettings>
			<LunaTextSetting
				title="Token File Path"
				desc={
					<>
						Path to JSON file containing <b>access_token</b> and <b>refresh_token</b>
					</>
				}
				value={filePath || ""}
				readOnly
				placeholder="No file selected"
			/>

			<LunaButtonSetting
				title="Select Token File"
				desc="Choose a JSON file containing your authentication tokens"
				onClick={handleSelectFile}
				disabled={isLoading}
			>
				Select File
			</LunaButtonSetting>

			{filePath && (
				<>
					<LunaButtonSetting
						title="Reload Tokens"
						desc="Reload tokens from the selected file"
						onClick={handleReloadFile}
						disabled={isLoading}
					>
						Reload
					</LunaButtonSetting>

					<LunaButtonSetting
						title="Refresh Token"
						desc="Use refresh token to get a new access token"
						onClick={handleRefreshToken}
						disabled={isLoading || !storage.tokens?.refresh_token}
					>
						Refresh Token
					</LunaButtonSetting>
				</>
			)}

			{status && (
				<div style={{ padding: "10px", marginTop: "10px", color: status.startsWith("Error") ? "#ff4444" : "#44ff44" }}>
					{status}
				</div>
			)}

			{storage.tokens && (
				<div style={{ padding: "10px", marginTop: "10px", fontSize: "12px", opacity: 0.7 }}>
					<div>Token loaded: Yes</div>
					{storage.lastRefresh && <div>Last refresh: {new Date(storage.lastRefresh).toLocaleString()}</div>}
					{storage.tokens.expiry_time && <div>Expires: {new Date(storage.tokens.expiry_time * 1000).toLocaleString()}</div>}
				</div>
			)}

			<div style={{ marginTop: "20px", padding: "10px", opacity: 0.7, fontSize: "12px" }}>
				<p>
					<b>Token file format:</b>
				</p>
				<pre style={{ background: "#1a1a1a", padding: "10px", borderRadius: "4px" }}>
					{JSON.stringify(
						{
							token_type: "Bearer",
							access_token: "your_access_token_here",
							refresh_token: "your_refresh_token_here",
							expiry_time: 1761278457.441437,
						},
						null,
						2
					)}
				</pre>
			</div>
		</LunaSettings>
	);
};
