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
exports.writeAttestations = exports.createStatement = void 0;
const types = __importStar(require("./intoto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Maximum number of attestations to be written.
const MAX_ATTESTATION_COUNT = 50;
function createStatement(subjects, type, predicate) {
    return {
        _type: types.INTOTO_TYPE,
        subject: subjects,
        predicateType: type,
        predicate,
    };
}
exports.createStatement = createStatement;
function writeAttestations(layoutFile, predicateType, predicateFile) {
    // Read SLSA output layout file.
    const buffer = fs_1.default.readFileSync(layoutFile);
    const layout = JSON.parse(buffer.toString());
    if (layout.version !== 1) {
        throw Error(`SLSA outputs layout invalid version: ${layout.version}`);
    }
    const count = Object.keys(layout.attestations).length;
    if (count > MAX_ATTESTATION_COUNT) {
        throw Error(`SLSA outputs layout had too many attestations: ${count}`);
    }
    // Read predicate
    const predicateBuffer = fs_1.default.readFileSync(predicateFile);
    const predicateJson = JSON.parse(predicateBuffer.toString());
    // TODO(https://github.com/slsa-framework/slsa-github-generator/issues/1422): Add other predicate validations.
    // Iterate through SLSA output layout and create attestations
    const ret = {};
    for (const att of layout.attestations) {
        // Validate that attestation path is not nested.
        if (path_1.default.dirname(att.name) !== ".") {
            throw Error(`attestation filename must not be nested ${att}`);
        }
        const subjectJson = JSON.parse(JSON.stringify(att.subjects));
        const attestationJSON = createStatement(subjectJson, predicateType, predicateJson);
        ret[att.name] = JSON.stringify(attestationJSON);
    }
    return ret;
}
exports.writeAttestations = writeAttestations;
