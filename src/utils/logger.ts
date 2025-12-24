import debug from "debug";

// Create debug instances for different framework components
export const debugFramework = debug("framework");
export const debugReport = debug("framework:report");
export const debugLLM = debug("framework:llm");
export const debugRenderer = debug("framework:renderer");
export const debugBundle = debug("framework:bundle");
export const debugPlugin = debug("framework:plugin");

// Error logger (always enabled)
export const debugError = debug("framework:error");
debugError.enabled = true;

// Helper to log errors with stack traces
export function logError(message: string, error?: Error | unknown): void {
  debugError(message);
  if (error instanceof Error && error.stack) {
    debugError(error.stack);
  } else if (error) {
    debugError(String(error));
  }
}
