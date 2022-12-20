import * as github from "@actions/github";
import * as core from "@actions/core";
import * as sigstore from "sigstore";

const signOptions = {
    oidcClientID: "sigstore",
    oidcIssuer: "https://oauth2.sigstore.dev/auth",
    rekorBaseURL: sigstore.sigstore.DEFAULT_REKOR_BASE_URL,
  };

async function run(): Promise<void> {
  try {
    /* Test locally: 
      export INPUT_PRIVATE_REPOSITORY=true
      export INPUT_RUNNER_LABEL="ubuntu-latest"
      export INPUT_WORKFLOW_RECIPIENT="laurentsimon/slsa-delegated-tool"
      export INPUT_BUILD_ARIFACTS_ACTION_PATH="./actions/build-artifacts-composite"
      export INPUT_WORKFLOW_INPUTS="{\n  \"name1\": \"value1\",\n  \"name2\": \"value2\",\n  \"private-repository\": true\n}"
      export INPUT_WORKFLOW_INPUTS="{\"name1\":\"value1\",\"name2\":\"value2\",\"private-repository\":true}"
    */

    const workflowRecipient = core.getInput('slsa-workflow-recipient');
    const privateRepository = core.getInput('slsa-private-repository');
    const runnerLabel = core.getInput('slsa-runner-label');
    const buildArtifactsActionPath = core.getInput('slsa-build-action-path');
    // The workflow inputs are represented as a JSON object theselves.
    const workflowsInputsText = core.getInput('slsa-workflow-inputs')
    
    // Log the inputs for troubleshooting.
    core.info(`privateRepository: ${privateRepository}`);
    core.info(`runnerLabel: ${runnerLabel}`);
    core.info(`workflowRecipient: ${workflowRecipient}`);
    core.info(`buildArtifactsActionPath: ${buildArtifactsActionPath}`);
    core.info(`workflowsInputsText: ${workflowsInputsText}`);
    core.info(`workfowInputs: `);
    const workflowInputs = JSON.parse(workflowsInputsText);
    const workflowInputsMap = new Map(Object.entries(workflowInputs));
    workflowInputsMap.forEach((value, key) => {
      core.info(` ${key}: ${value}`);
    });

    const payload = JSON.stringify(github.context.payload, undefined, 2);
    core.info(`The event payload: ${payload}`);

    // Construct an unsigned SLSA token.
    const unsignedSlsaToken = {
      version: 1,
      context: "SLSA integration framework",
      builder: {
        "private-repository": true,
        "runner-label": runnerLabel,
        audience: workflowRecipient,
      },
      github: {
        context: github.context
      },
      tool: {
        actions: {
          "build-artifacts": {
            path: buildArtifactsActionPath,
          },
        },
        // TODO: grab the calling workflow here ?
        // We need it for policy authz and we should report it
        // somewhere. Where?
        inputs: workflowInputs,
      },
    };

    const token = JSON.stringify(unsignedSlsaToken, undefined);
    core.info(`Raw unsigned SLSA token: ${token}`);
    const signedToken = await sigstore.sigstore.signBlob(
        token,
        "",
        signOptions
      );
    const b64Token = Buffer.from(token, 'base64');
    core.info(`Base64 unsigned SLSA token: ${b64Token}`);
    core.setOutput("slsa-signed-token", b64Token);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.info(`Unexpected error: ${error}`);
    }
  }
}

run();
