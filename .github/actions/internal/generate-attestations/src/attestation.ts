import fs from "fs";

export async function generatePredicate(
  toolInputs: string,
  toolUri: string,
  toolPath: string
): Promise<Buffer> {
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

  // TODO: Return a string with JSON.stringify?
  return Buffer.from(predicateJson);
}

export async function writeAttestations(
  layoutFile: string,
  predicate: Buffer
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
        "predicate": {
          ${predicate}
        }`;

      console.log(`Writing attestation ${att}`);
      console.log(attestationJSON);
    }
  }
}
