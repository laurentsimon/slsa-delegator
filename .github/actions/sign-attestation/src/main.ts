import * as core from "@actions/core";
import * as fs from "fs";
import * as sigstore from "sigstore";

const signOptions = {
  oidcClientID: "sigstore",
  oidcIssuer: "https://oauth2.sigstore.dev/auth",
  rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
};

async function run(): Promise<void> {
  try {
    // `predicate` input defined in action metadata file
    const attestation = core.getInput("attestation");
    console.log(`Attestation ${attestation}!`);
    const payloadType = core.getInput("payload_type");
    console.log(`Payload Type ${payloadType}!`);

    const buffer = fs.readFileSync(attestation);

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
