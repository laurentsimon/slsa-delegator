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
// import * as sigstore from "sigstore";
const path_1 = __importDefault(require("path"));
const attestation_1 = require("./attestation");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const slsaOutputs = core.getInput("slsa-outputs-file");
            console.log(`SLSA outputs ${slsaOutputs}!`);
            // Trusted predicate inputs.
            const toolInputs = core.getInput("tool-inputs");
            console.log(`Tool inputs ${toolInputs}!`);
            const toolUri = core.getInput("tool-uri");
            console.log(`Tool URI ${toolUri}!`);
            const toolPath = core.getInput("tool-path");
            console.log(`Tool path ${toolPath}!`);
            // Detect directory traversal for SLSA outputs file
            const wd = process.env[`GITHUB_WORKSPACE`] || "";
            const safe_join = path_1.default.join(wd, slsaOutputs);
            if (!safe_join.startsWith(wd)) {
                throw Error(`unsafe path ${slsaOutputs}`);
            }
            console.log(`Using SLSA output file at ${safe_join}!`);
            // Generate the predicate.
            const predicate = yield (0, attestation_1.generatePredicate)(toolInputs, toolUri, toolPath);
            console.log(JSON.stringify(predicate));
            // Attach subjects and generate attestation files
            yield (0, attestation_1.writeAttestations)(safe_join, predicate);
            // const outputFile = `${attestation}.jsonl`;
            // fs.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`);
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
