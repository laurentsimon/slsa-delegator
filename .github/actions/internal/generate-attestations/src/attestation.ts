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
  console.log(`Using predicate ${predicate}`);
}
