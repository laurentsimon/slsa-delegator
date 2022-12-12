import * as core from "@actions/core";
// import * as sigstore from "sigstore";
import path from "path";
import { generatePredicate, writeAttestations } from "./attestation";

async function run(): Promise<void> {
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
    const safe_join = path.join(wd, slsaOutputs);
    if (!safe_join.startsWith(wd)) {
      throw Error(`unsafe path ${slsaOutputs}`);
    }
    console.log(`Using SLSA output file at ${safe_join}!`);

    // Generate the predicate.
    const predicate = await generatePredicate(toolInputs, toolUri, toolPath);
    console.log(predicate.toString());

    // Attach subjects and generate attestation files
    await writeAttestations(safe_join, predicate);

    // const outputFile = `${attestation}.jsonl`;
    // fs.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.info(`Unexpected error: ${error}`);
    }
  }
}

run();
