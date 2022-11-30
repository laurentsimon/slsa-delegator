import * as github from "@actions/github";
import * as core from "@actions/core";

const snakeToCamel = (str:string) =>
  str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );


async function run(): Promise<void> {
  try {
    /* Test locally: 
      export INPUTS="$(cat ./INPUTS.txt | jq -c)"
      TOOL_REPOSITORY=laurentsimon/slsa-delegated-tool
      REF=main
    */
    const envInputs = process.env.INPUTS;
    if (!envInputs) {
      core.setFailed("No envInputs found.");
      return;
    }
    core.info(`Found Action inputs: ${envInputs}`)

    interface inputsObj {
      slsaPrivateRepository: boolean;
      slsaRunnerLabel: string;
      slsaBuildArtifactsActionPath: string;
      slsaWorkflowRecipient: string;
      slsaWorkflowInputs: Map<string, string>;
  }
    const inputsObj: inputsObj = JSON.parse(envInputs, function(key, value) {
      const camelCaseKey = snakeToCamel(key)
      // See https://stackoverflow.com/questions/68337817/is-it-possible-to-use-json-parse-to-change-the-keys-from-underscore-to-camelcase.
      if (this instanceof Array || camelCaseKey === key) {
        return value
      } else {
        this[camelCaseKey] = value
      }
    })
    /* test*/
    // const inputs = new Map(Object.entries(inputsObj));
    // inputs.forEach((value, key) => {
    //   core.info(`${key}: ${value}`); 
    // });
    // core.info("---")
    
    const toolRepository = process.env.TOOL_REPOSITORY
    const toolRef = process.env.TOOL_REF
    const ref = core.getInput("ref");
    const privateRepository = inputsObj.slsaPrivateRepository;
    const runnerLabel = inputsObj.slsaRunnerLabel;
    const buildArtifactsActionPath = inputsObj.slsaBuildArtifactsActionPath;
    const workflowInputs = inputsObj.slsaWorkflowInputs
    
    // Log for troubleshooting.
    const audience = "delegator_generic_slsa3.yml";//core.getInput("slsa-workflow-recipient")
    core.info(`privateRepository: ${privateRepository}`);
    core.info(`runnerLabel: ${runnerLabel}`);
    core.info(`audience: ${audience}`);
    core.info(`buildArtifactsActionPath: ${buildArtifactsActionPath}`);
    core.info(`workfowInputs:`);
    const workflowInputsMap = new Map(Object.entries(workflowInputs));
    workflowInputsMap.forEach((value, key) => {
      core.info(` ${key}: ${value}`); 
    });

    
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    core.info(`The event payload: ${payload}`);

    // Construct our raw token.
    const rawSlsaToken = {
      "version": 1,
      "builder":{
        "private-repository": true,
        "runner-label": runnerLabel,
      },
      "tool":{
        "actions": {
          "build-artifacts":{
            "path": buildArtifactsActionPath
            }
        },
        "reusable-workflow":{
          "path": audience,
          "repository": toolRepository,
          "ref": toolRef
        },
        "inputs":workflowInputs
      }
    }

    const token = JSON.stringify(rawSlsaToken, undefined);
    core.info(`Raw SLSA token: ${token}`);
    const b64Token = btoa(token)
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
