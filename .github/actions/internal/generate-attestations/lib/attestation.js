"use strict";
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
exports.writeAttestations = exports.generatePredicate = void 0;
const fs_1 = __importDefault(require("fs"));
function generatePredicate(toolInputs, toolUri, toolPath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Generating predicate!`);
        // TODO: Validate inputs!
        const predicateJson = `{
        "builder": {
          "id": "${toolUri}"
        },
        "buildType": "https://github.com/slsa-framework/slsa-github-generator/delegator-generic@v0",
        "metadata": {},
        "invocation": {
            "parameters": {}
        },
        "buildConfig" :{
            "version": 1,
            "inputs": ${toolInputs},
            "tool": ${toolPath}
        },
        "materials": [
          {
            "uri": materialsUri,
            "digest": {
              "sha1": buildSourceVersion
            }
          }
        ]
      }`;
        return Buffer.from(predicateJson);
    });
}
exports.generatePredicate = generatePredicate;
function writeAttestations(layoutFile, predicate) {
    return __awaiter(this, void 0, void 0, function* () {
        // Read SLSA output layout file.
        console.log(`Reading SLSA output file at ${layoutFile}!`);
        const buffer = fs_1.default.readFileSync(layoutFile);
        console.log(`Using layout ${JSON.stringify(buffer)}\n`);
        console.log(`Using predicate ${predicate}`);
    });
}
exports.writeAttestations = writeAttestations;
