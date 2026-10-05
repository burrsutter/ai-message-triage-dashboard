#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENSHIFT_DIR="${ROOT_DIR}/openshift"
NAMESPACE="message-triage"
DASHBOARD_GIT_REF="${DASHBOARD_GIT_REF:-main}"

echo "==> Applying dashboard configuration and build resources in ${NAMESPACE}"
oc apply -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/01-configmap.yaml"
oc apply -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/02-build.yaml"
oc patch buildconfig/message-triage-dashboard \
  -n "${NAMESPACE}" \
  --type=merge \
  -p "{\"spec\":{\"source\":{\"git\":{\"ref\":\"${DASHBOARD_GIT_REF}\"}}}}"

echo "==> Building dashboard image from GitHub ref ${DASHBOARD_GIT_REF}"
oc start-build message-triage-dashboard -n "${NAMESPACE}" --follow --wait

echo "==> Deploying dashboard, service, and TLS route"
oc apply -n "${NAMESPACE}" -f "${OPENSHIFT_DIR}/03-application.yaml"
oc rollout restart deployment/message-triage-dashboard -n "${NAMESPACE}"
oc rollout status deployment/message-triage-dashboard -n "${NAMESPACE}" --timeout=300s

ROUTE_HOST="$(oc get route message-triage-dashboard -n "${NAMESPACE}" -o jsonpath='{.spec.host}')"
echo "==> Dashboard: https://${ROUTE_HOST}"
