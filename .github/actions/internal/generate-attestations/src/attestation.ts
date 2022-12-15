import fs from "fs";
import { context } from "@actions/github";
import * as sigstore from "sigstore";
import fetch from "node-fetch";

const signOptions = {
  oidcClientID: "sigstore",
  oidcIssuer: "https://oauth2.sigstore.dev/auth",
  rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
};

const PEM_HEADER = "-----BEGIN CERTIFICATE-----";
const PEM_FOOTER = "-----END CERTIFICATE-----";

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
            "inputs": ${toolInputs},
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

      // TODO: also write the normal attestation in slsa-verifier format
      const envelopeJSON = JSON.parse(JSON.stringify(bundle.dsseEnvelope));
      const certBytes =
        bundle.verificationMaterial?.x509CertificateChain?.certificates[0]
          .rawBytes || "";
      const lines = certBytes.match(/.{1,64}/g) || "";
      let certPEM = [...lines].join("\n").concat("");
      certPEM = `${PEM_HEADER}\n${certPEM}\n${PEM_FOOTER}`;
      console.log(certPEM);
      const base64Cert = Buffer.from(certPEM).toString("base64");

      certPEM = JSON.stringify(certPEM);
      console.log(certPEM);
      envelopeJSON.signatures[0]["cert"] = certPEM;

      const envelopeStr = JSON.stringify(envelopeJSON).replace(/"/g, '\\"');

      // Upload to tlog with the augmented format.
      const intoto = `{
        "apiVersion":"0.0.1",
        "kind":"intoto",
        "spec":{
          "content":{
            "envelope": "${envelopeStr}"
          },
          "publicKey":"${base64Cert}"
        }
      }`;
      console.log(intoto);

      const response = await fetch(
        "https://rekor.sigstore.dev/api/v1/log/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: intoto,
        }
      );
      const data = await response.json();
      console.log(data);

      // Write .sigstore bundle
      fs.mkdirSync(outputFolder, { recursive: true });
      const outputBundleFile = `${outputFolder}/${att}.sigstore`;
      fs.writeFileSync(outputBundleFile, `${JSON.stringify(bundle)}\n`);

      // Write .jsonl for slsa-verifier
      const outputDSSEfile = `${outputFolder}/${att}.jsonl`;
      fs.writeFileSync(outputDSSEfile, `${JSON.stringify(envelopeJSON)}\n`);

      // Log debug
      console.log(`Writing attestation ${att}`);
      console.log(JSON.stringify(bundle));
    }
  }
}
