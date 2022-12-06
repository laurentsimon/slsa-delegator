import * as core from "@actions/core";
import fs from "fs";
import sigstore from "sigstore";
import sanitizeFilename from "sanitize-filename";

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

    // This removes control characters, reserved filenames (..), and
    // reserved characters like :
    const safe_input = sanitizeFilename(attestation);

    const buffer = fs.readFileSync(safe_input);

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
