import * as core from "@actions/core";
import fs from "fs";
import path from "path";
import { writeAttestations } from "./attestation";
import { resolvePathInput } from "./utils";

/*
Test:
  env INPUT_SLSA-LAYOUT-FILE=layout.json \
  INPUT_PREDICATE-TYPE=https://slsa.dev/provenance/v1.0?draft \
  INPUT-PREDICATE-FILE=predicate.json \
  INPUT_OUTPUT-FOLDER=out-folder \
  nodejs ./dist/index.js
*/ 
export function run(): void {
  try {
    const wd = process.env[`GITHUB_WORKSPACE`] || "";

    // SLSA subjects layout file.
    const slsaLayout = core.getInput("slsa-layout-file");
    const safeSlsaLayout = resolvePathInput(slsaLayout, wd);
    core.info(`Using SLSA layout file at ${safeSlsaLayout}!`);

    // Predicate.
    const predicateFile = core.getInput("predicate-file");
    const safePredicateFile = resolvePathInput(predicateFile, wd);
    core.info(`Inputs: Predicate file ${safePredicateFile}!`);

    // Predicate type
    const predicateType = core.getInput("predicate-type");
    core.info(`Inputs: Predicate type ${predicateType}!`);

    // Attach subjects and generate attestation files
    const outputFolder = core.getInput("output-folder");
    core.info(`outputFolder: ${outputFolder}!`);
    const attestations = writeAttestations(
      safeSlsaLayout,
      predicateType,
      safePredicateFile
    );
    core.info(`outputFolder: ${outputFolder}!`);
    // Write attestations
    fs.mkdirSync(outputFolder, { recursive: true });
    for (const att in attestations) {
      const outputFile = path.join(outputFolder, att);
      const safeOutput = resolvePathInput(outputFile, wd);
      fs.writeFileSync(safeOutput, attestations[att], {
        flag: "ax",
        mode: 0o600,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(`Unexpected error: ${error}`);
    }
  }
}

run();
