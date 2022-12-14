import fs from "fs";
import { context } from "@actions/github";
import * as sigstore from "sigstore";

const signOptions = {
  oidcClientID: "sigstore",
  oidcIssuer: "https://oauth2.sigstore.dev/auth",
  rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
};

export async function generatePredicate(
  toolInputs: string,
  toolUri: string,
  toolPath: string
): Promise<Buffer> {
  console.log(`Generating predicate!`);
  // TODO: Validate inputs!

  // Create materials with repository and sha from GH context
  // TODO: Use a client to get repository_id, actor_id, and repository_owner_id
  const predicateJson = `{
        "builder": {
          "id": "${toolUri}"
        },
        "buildType": "https://github.com/slsa-framework/slsa-github-generator/delegator-generic@v0",
        "metadata": {},
        "invocation": {
            "parameters": {},
            "environment": {
              "github_actor": "${context.action}",
              "github_event_name": "${context.eventName}",
              "github_ref": "${context.ref}",
              "github_ref_type": "${context.payload}",
              "github_repository_owner": "${context.repo.owner}",
              "github_run_id": "${context.runId}",
              "github_run_number": "${context.runNumber}",
              "github_sha1": "${context.sha}"
            },
            "metadata": {
                "buildInvocationID": "${context.runId}-${context.runNumber}"
            }
        },
        "buildConfig" :{
            "version": 1,
            "inputs": "${toolInputs}",
            "tool": "${toolPath}"
        },
        "materials": [
          {
            "uri": "git+${context.serverUrl}/${context.repo}@${context.ref}",
            "digest": {
              "sha1": "${context.sha}"
            }
          }
        ]
      }`;

  // TODO: Return a string with JSON.stringify?
  return Buffer.from(predicateJson);
}

export async function writeAttestations(
  layoutFile: string,
  predicate: Buffer,
  outputFolder: string
): Promise<void> {
  // Read SLSA output layout file.
  console.log(`Reading SLSA output file at ${layoutFile}!`);
  const buffer = fs.readFileSync(layoutFile);
  const layout = JSON.parse(buffer.toString());
  console.log(`Using layout ${JSON.stringify(layout)}\n`);

  // Read predicate
  console.log(`Using predicate ${predicate}`);

  // Iterate through SLSA output layout and create attestations
  for (const att in layout) {
    if (att !== "version") {
      const subjectJson = JSON.stringify(layout[att]);

      const attestationJSON = `{
        "_type": "https://in-toto.io/Statement/v0.1",
        "subject": ${subjectJson},
        "predicateType": "https://slsa.dev/provenance/v0.2",
        "predicate": ${predicate}`;

      // Sign attestations with sigstore
      const attestationBuffer = Buffer.from(attestationJSON);
      const bundle = await sigstore.sigstore.signAttestation(
        attestationBuffer,
        "application/vnd.in-toto+json",
        signOptions
      );

      // Write .sigstore bundle
      // TODO: also write the normal attestation in slsa-verifier format
      const outputFile = `${outputFolder}/${att}.sigstore`;
      fs.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`);

      // Write signed envelopes
      console.log(`Writing attestation ${att}`);
      console.log(JSON.stringify(bundle));
    }
  }
}
