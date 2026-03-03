import "@testing-library/jest-dom";

// Suppress jsdom "Not implemented: navigation" noise in tests
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (msg: any, ...args: any[]) => {
    const text = msg instanceof Error ? msg.message : String(msg);
    if (text.includes("Not implemented: navigation")) return;
    originalError(msg, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
