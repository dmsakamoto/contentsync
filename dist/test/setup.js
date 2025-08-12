"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file
const util_1 = require("util");
// Polyfill for Node.js environment
global.TextEncoder = util_1.TextEncoder;
global.TextDecoder = util_1.TextDecoder;
// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});
afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});
//# sourceMappingURL=setup.js.map