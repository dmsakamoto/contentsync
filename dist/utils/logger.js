"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLogger = exports.ConsoleLogger = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ConsoleLogger {
    constructor(verbose = false) {
        this.logs = [];
        this.verbose = verbose;
    }
    info(message, metadata) {
        this.log('info', message, metadata);
        console.log(chalk_1.default.blue(`ℹ ${message}`));
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
        console.log(chalk_1.default.yellow(`⚠ ${message}`));
    }
    error(message, metadata) {
        this.log('error', message, metadata);
        console.log(chalk_1.default.red(`✖ ${message}`));
    }
    debug(message, metadata) {
        this.log('info', message, metadata);
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔍 ${message}`));
        }
    }
    success(message) {
        console.log(chalk_1.default.green(`✓ ${message}`));
    }
    log(level, message, metadata) {
        const logEntry = {
            level,
            timestamp: new Date(),
            message,
            metadata,
        };
        this.logs.push(logEntry);
    }
    /**
     * Get all logs for export or analysis
     */
    getLogs() {
        return [...this.logs];
    }
    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
    }
    /**
     * Export logs to file
     */
    async exportLogs(filePath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        const logData = {
            timestamp: new Date(),
            logs: this.logs,
        };
        await fs.writeJson(filePath, logData, { spaces: 2 });
    }
}
exports.ConsoleLogger = ConsoleLogger;
class FileLogger extends ConsoleLogger {
    constructor(logFilePath, verbose = false) {
        super(verbose);
        this.logFilePath = logFilePath;
    }
    async writeToFile(level, message, metadata) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(this.logFilePath, logLine);
    }
    async info(message, metadata) {
        super.info(message, metadata);
        await this.writeToFile('info', message, metadata);
    }
    async warn(message, metadata) {
        super.warn(message, metadata);
        await this.writeToFile('warn', message, metadata);
    }
    async error(message, metadata) {
        super.error(message, metadata);
        await this.writeToFile('error', message, metadata);
    }
    async debug(message, metadata) {
        super.debug(message, metadata);
        await this.writeToFile('debug', message, metadata);
    }
}
exports.FileLogger = FileLogger;
//# sourceMappingURL=logger.js.map