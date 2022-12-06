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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const sigstore = __importStar(require("sigstore"));
const path_1 = __importDefault(require("path"));
const signOptions = {
    oidcClientID: "sigstore",
    oidcIssuer: "https://oauth2.sigstore.dev/auth",
    rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // `attestation` input defined in action metadata file
            const attestation = core.getInput("attestation");
            console.log(`Attestation ${attestation}!`);
            const payloadType = core.getInput("payload-type");
            console.log(`Payload Type ${payloadType}!`);
            const safe_input = path_1.default
                .normalize(attestation)
                .replace(/^(\.\.(\/|\\|$))+/, "");
            const wd = process.env[`GITHUB_WORKSPACE`] || "";
            const safe_join = path_1.default.join(wd, safe_input);
            console.log(`Reading attestation file at ${safe_join}!`);
            const buffer = fs_1.default.readFileSync(safe_join);
            const bundle = yield sigstore.sigstore.signAttestation(buffer, payloadType, signOptions);
            console.log(JSON.stringify(bundle));
            const outputFile = `${attestation}.jsonl`;
            fs_1.default.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`);
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
            else {
                core.info(`Unexpected error: ${error}`);
            }
        }
    });
}
run();
