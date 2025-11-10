# Bearer Token Auth Plugin

This plugin allows you to authenticate using a bearer token loaded from a JSON file. This is useful for services that provide bearer tokens for API authentication.

## Features

- Select a JSON file containing your bearer token
- Securely store the token in Luna's plugin storage
- Display the current token status (masked for security)
- Clear the stored token when needed
- Support for multiple JSON token formats

## Usage

1. Create a JSON file with your bearer token in one of the following formats:

```json
{
  "token": "your-bearer-token-here"
}
```

Or:

```json
{
  "bearer_token": "your-bearer-token-here"
}
```

Or:

```json
{
  "bearerToken": "your-bearer-token-here"
}
```

Or:

```json
{
  "access_token": "your-bearer-token-here"
}
```

Or:

```json
{
  "accessToken": "your-bearer-token-here"
}
```

2. Open Luna and navigate to the BearerTokenAuth plugin settings
3. Click "Select File" and choose your JSON file
4. The token will be loaded and stored securely
5. The token can now be used by other plugins or services for authentication

## For Developers

Other plugins can access the stored bearer token:

```typescript
import { storage } from "@luna/plugins/BearerTokenAuth";

// Get the bearer token
const token = storage.bearerToken;

// Use in API requests
fetch("https://api.example.com/endpoint", {
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});
```

## Security Note

The token is stored in Luna's plugin storage and displayed as a secure text field (password field) in the settings. The actual token file is only read once during selection and is not stored in memory.
