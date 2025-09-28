// Disable Mastra telemetry warnings
declare global {
  var ___MASTRA_TELEMETRY___: boolean;
}

globalThis.___MASTRA_TELEMETRY___ = true;

export async function register() {
  // Set telemetry flag to prevent warnings
  if (typeof globalThis !== 'undefined') {
    globalThis.___MASTRA_TELEMETRY___ = true;
  }
}