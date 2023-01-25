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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const attestation_1 = require("./attestation");
const utils_1 = require("./utils");
/*
Test:
  env INPUT_SLSA-LAYOUT-FILE=layout.json \
  INPUT_PREDICATE-TYPE=https://slsa.dev/provenance/v1.0?draft \
  INPUT-PREDICATE-FILE=predicate.json \
  INPUT_OUTPUT-FOLDER=out-folder \
  nodejs ./dist/index.js
*/
function run() {
    try {
        const wd = process.env[`GITHUB_WORKSPACE`] || "";
        // SLSA subjects layout file.
        const slsaLayout = core.getInput("slsa-layout-file");
        const safeSlsaLayout = (0, utils_1.resolvePathInput)(slsaLayout, wd);
        core.info(`Using SLSA layout file at ${safeSlsaLayout}!`);
        // Predicate.
        const predicateFile = core.getInput("predicate-file");
        const safePredicateFile = (0, utils_1.resolvePathInput)(predicateFile, wd);
        core.info(`Inputs: Predicate file ${safePredicateFile}!`);
        // Predicate type
        const predicateType = core.getInput("predicate-type");
        core.info(`Inputs: Predicate type ${predicateType}!`);
        // Attach subjects and generate attestation files
        const outputFolder = core.getInput("output-folder");
        core.info(`outputFolder: ${outputFolder}!`);
        const attestations = (0, attestation_1.writeAttestations)(safeSlsaLayout, predicateType, safePredicateFile);
        core.info(`outputFolder: ${outputFolder}!`);
        // Write attestations
        fs_1.default.mkdirSync(outputFolder, { recursive: true });
        for (const att in attestations) {
            const outputFile = path_1.default.join(outputFolder, att);
            const safeOutput = (0, utils_1.resolvePathInput)(outputFile, wd);
            fs_1.default.writeFileSync(safeOutput, attestations[att], {
                flag: "ax",
                mode: 0o600,
            });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed(`Unexpected error: ${error}`);
        }
    }
}
exports.run = run;
run();
