#!/bin/bash

set -euo pipefail

source "./.github/workflows/scripts/e2e-assert.sh"

# NOTE: this is a pre-submit, so the signature is not generated and there is
# just a place holder for it.
echo "SLSA_TOKEN: $SLSA_TOKEN"
[[ "$SLSA_TOKEN" != "" ]]

b64_token=$(echo -n "$SLSA_TOKEN" | cut -d '.' -f2)
echo "b64_token:"
echo "$b64_token"

decoded_token=$(echo "$b64_token" | base64 -d)
echo "decoded_token:"
echo "$decoded_token"

# Non-GitHub's information.
audience=$(echo "$decoded_token" | jq -r '.builder.audience')
runner_label=$(echo "$decoded_token" | jq -r '.builder.runner_label')
private_repository=$(echo "$decoded_token" | jq -r '.builder.private_repository')
action_path=$(echo "$decoded_token" | jq -r '.tool.actions.build_artifacts.path')
inputs=$(echo "$decoded_token" | jq -rc '.tool.inputs')

# GitHub's information.
run_attempt=$(echo "$decoded_token" | jq -r '.github.run_attempt')
run_id=$(echo "$decoded_token" | jq -r '.github.run_id')
run_number=$(echo "$decoded_token" | jq -r '.github.run_number')
sha=$(echo "$decoded_token" | jq -r '.github.sha')
workflow=$(echo "$decoded_token" | jq -r '.github.workflow')
event_name=$(echo "$decoded_token" | jq -r '.github.event_name')
repository=$(echo "$decoded_token" | jq -r '.github.repository')
repository_owner=$(echo "$decoded_token" | jq -r '.github.repository_owner')
ref=$(echo "$decoded_token" | jq -r '.github.ref')
ref_type=$(echo "$decoded_token" | jq -r '.github.ref_type')
actor=$(echo "$decoded_token" | jq -r '.github.actor')

echo "1 - $audience"
e2e_assert_eq "delegator_generic_slsa3.yml" "$audience"
echo "2 - $run_attempt"
e2e_assert_eq "$GITHUB_RUN_ATTEMPT" "$run_attempt"
echo "3 - $run_number"
e2e_assert_eq "$GITHUB_RUN_NUMBER" "$run_number"
echo "run_id - $run_id"
e2e_assert_eq "$GITHUB_RUN_ID" "$run_id"
echo "sha - $sha"
e2e_assert_eq "$GITHUB_SHA" "$sha"
echo "workflow - $workflow"
e2e_assert_eq "$GITHUB_WORKFLOW" "$workflow"
echo "runner_label - $runner_label"
e2e_assert_eq "ubuntu-latest" "$runner_label"
echo "private_repository - $private_repository"
e2e_assert_eq "true" "$private_repository"
echo "action_path - $action_path"
e2e_assert_eq "./actions/build-artifacts-composite" "$action_path"
echo "inputs - $inputs"
e2e_assert_eq '{"name1":"value1","name2":"value2","private-repository":true}' "$inputs"
echo "event_name - $event_name"
e2e_assert_eq "$GITHUB_EVENT_NAME" "$event_name"
echo "repository - $repository"
e2e_assert_eq "$GITHUB_REPOSITORY" "$repository"
echo "repository_owner - $repository_owner"
e2e_assert_eq "$GITHUB_REPOSITORY_OWNER" "$repository_owner"
echo "ref - $ref"
e2e_assert_eq "$GITHUB_REF" "$ref"
echo "ref_type - $ref_type"
e2e_assert_eq "$GITHUB_REF_TYPE" "$ref_type"
echo "actor - $actor"
e2e_assert_eq "$GITHUB_ACTOR" "$actor"
echo "END"
