import * as github from "@actions/github";
import * as core from "@actions/core";

const snakeToCamel = (str: string) =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );

async function run(): Promise<void> {
  try {
    /* Test locally: 
      export ACTION_INPUTS="$(cat ./ACTION_INPUTS.txt | jq -c)"
      export WORKFLOW_INPUTS="$(cat ./WORKFLOW_INPUTS.txt | jq -c)"
      TOOL_REPOSITORY=laurentsimon/slsa-delegated-tool
      REF=main
    */

    // Read the Action inputs.
    const actionInputs = process.env.ACTION_INPUTS;
    if (!actionInputs) {
      core.setFailed("No actionInputs found.");
      return;
    }
    core.info(`Found Action inputs: ${actionInputs}`);

    // Read the Workflow inputs.
    const workflowsInputs = process.env.WORKFLOW_INPUTS;
    if (!workflowsInputs) {
      core.setFailed("No workflowsInputs found.");
      return;
    }
    core.info(`Found Workflow inputs: ${workflowsInputs}`);

    // Parse the Action inputs.
    interface inputsObj {
      slsaPrivateRepository: boolean;
      slsaRunnerLabel: string;
      slsaBuildArtifactsActionPath: string;
      slsaWorkflowRecipient: string;
      slsaWorkflowInputs: string;
    }

    const inputsObj: inputsObj = JSON.parse(
      actionInputs,
      function (key, value) {
        const camelCaseKey = snakeToCamel(key);
        // See https://stackoverflow.com/questions/68337817/is-it-possible-to-use-json-parse-to-change-the-keys-from-underscore-to-camelcase.
        if (this instanceof Array || camelCaseKey === key) {
          return value;
        } else {
          this[camelCaseKey] = value;
        }
      }
    );
    /* test*/
    // const inputs = new Map(Object.entries(inputsObj));
    // inputs.forEach((value, key) => {
    //   core.info(`${key}: ${value}`);
    // });

    const workflowRecipient = inputsObj.slsaWorkflowRecipient;
    const privateRepository = inputsObj.slsaPrivateRepository;
    const runnerLabel = inputsObj.slsaRunnerLabel;
    const buildArtifactsActionPath = inputsObj.slsaBuildArtifactsActionPath;
    const tmpWorkflowInputs = inputsObj.slsaWorkflowInputs;
    // The workflow inputs are represented as a JSON object theselves.
    const workflowInputs: Map<string, string> = JSON.parse(tmpWorkflowInputs);

    // Log the inputs for troubleshooting.
    core.info(`privateRepository: ${privateRepository}`);
    core.info(`runnerLabel: ${runnerLabel}`);
    core.info(`workflowRecipient: ${workflowRecipient}`);
    core.info(`buildArtifactsActionPath: ${buildArtifactsActionPath}`);
    core.info(`workfowInputs:`);
    const workflowInputsMap = new Map(Object.entries(workflowInputs));
    workflowInputsMap.forEach((value, key) => {
      core.info(` ${key}: ${value}`);
    });

    //
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    core.info(`The event payload: ${payload}`);

    // Construct our raw token.
    const rawSlsaToken = {
      version: 1,
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
        // WARNING: We shoud remove this:
        // it's the validator's role to extract the
        // repo / ref and add it to the token.
        "reusable-workflow": {
          repository: "laurentsimon/slsa-delegated-tool",
          ref: "main",
        },
        inputs: workflowInputs,
      },
    };

    const token = JSON.stringify(rawSlsaToken, undefined);
    core.info(`Raw SLSA token: ${token}`);
    const b64Token = btoa(token);
    core.info(`Base64 raw SLSA token: ${b64Token}`);
    core.setOutput("base64-slsa-token", b64Token);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.info(`Unexpected error: ${error}`);
    }
  }
}

run();
