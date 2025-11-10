import { Tracer, type LunaUnload } from "@luna/core";

export const { trace, errSignal } = Tracer("[BearerTokenAuth]");

export { Settings, storage } from "./Settings";

export const unloads = new Set<LunaUnload>();

// Export the storage for other plugins to access the bearer token
// Usage in other plugins:
// import { storage } from "@luna/plugins/BearerTokenAuth";
// const token = storage.bearerToken;
// Use in Authorization header: `Authorization: Bearer ${token}`
