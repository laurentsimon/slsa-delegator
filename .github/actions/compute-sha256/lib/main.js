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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
function shasum256(untrustedPath) {
    if (!fs.existsSync(untrustedPath)) {
        throw new Error(`File ${untrustedPath} not present`);
    }
    const untrustedFile = fs.readFileSync(untrustedPath);
    return crypto.createHash("sha256").update(untrustedFile).digest("hex");
}
function run() {
    // Get the path to the untrusted file from ENV variable 'UNTRUSTED_PATH'
    const untrustedPath = core.getInput("path");
    core.info(`Computing sha256 of ${untrustedPath}`);
    const sha = shasum256(untrustedPath);
    core.info(`Computed sha256 of ${untrustedPath} as ${sha}`);
    core.setOutput("sha256", sha);
}
run();
