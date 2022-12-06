import * as core from "@actions/core";
import fs from "fs";
import * as sigstore from "sigstore";
import path from "path";

const signOptions = {
  oidcClientID: "sigstore",
  oidcIssuer: "https://oauth2.sigstore.dev/auth",
  rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
};

async function run(): Promise<void> {
  try {
    // `attestation` input defined in action metadata file
    const attestation = core.getInput("attestation");
    console.log(`Attestation ${attestation}!`);
    const payloadType = core.getInput("payload-type");
    console.log(`Payload Type ${payloadType}!`);

    const safe_input = path.normalize(attestation);
    const wd = process.env[`GITHUB_WORKSPACE`] || "";
    const safe_join = path.join(wd, safe_input);
    console.log(`Reading attestation file at ${safe_join}!`);

    const buffer = fs.readFileSync(safe_join);

    const bundle = await sigstore.sigstore.signAttestation(
      buffer,
      payloadType,
      signOptions
    );

    console.log(JSON.stringify(bundle));
    const outputFile = `${attestation}.jsonl`;
    fs.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.info(`Unexpected error: ${error}`);
    }
  }
}

run();
