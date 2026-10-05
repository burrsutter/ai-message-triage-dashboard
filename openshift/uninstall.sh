#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENSHIFT_DIR="${ROOT_DIR}/openshift"
NAMESPACE="message-triage"

oc delete -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/03-application.yaml" --ignore-not-found
oc delete -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/02-build.yaml" --ignore-not-found
oc delete -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/01-configmap.yaml" --ignore-not-found
