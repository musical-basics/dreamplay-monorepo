#!/usr/bin/env bash
#
# PreToolUse(Bash) guard: force HUMAN approval for irreversible Shopify order
# operations (refunds + cancellations). An AI agent cannot self-approve a
# permissionDecision "ask", so this is the actual human-in-the-loop gate.
#
# Reads the PreToolUse hook JSON on stdin. If the Bash command looks like a
# Shopify refund or order cancellation, emits permissionDecision "ask". For
# everything else it stays silent (exit 0) so normal permission behavior is
# unchanged.
#
# Scope is intentionally broad (matches the GraphQL mutation names, our
# shopify-refund/shopify-cancel script names, and the REST endpoints). A rare
# false positive just adds one approval prompt — erring on the safe side.
set -uo pipefail

# Match the raw hook payload directly — no jq dependency (jq isn't guaranteed to
# be installed). The Bash command is the only free-text field in the payload, so
# matching the whole stdin against these tokens is equivalent in practice.
input="$(cat)"

# Irreversible Shopify order operations (case-insensitive):
#   GraphQL: refundCreate, orderRefund, refundLineItem, refundSessionCreate,
#            orderCancel, orderClose
#   Scripts: shopify-refund*, shopify-cancel*
#   REST:    /refunds.json, orders/<id>/cancel(.json)
PATTERN='refundCreate|orderRefund|refundLineItem|refundSessionCreate|orderCancel|orderClose|shopify-refund|shopify-cancel|/refunds\.json|orders/[0-9]+/cancel'

if printf '%s' "$input" | grep -Eiq "$PATTERN"; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Shopify refund/cancellation is irreversible — human approval required. Review the exact order, customer, and dollar amount before approving."}}'
fi

exit 0
