---
title: 'Hyper Tern'
description: 'Intent-aware routing and permission control for AI execution paths.'
order: 1
action: 'Control'
eyebrow: 'Policy-aware routing'
summary: 'Hyper Tern evaluates declared intent and deployment policy before an AI request reaches an approved capability.'
diagram: 'hyper-tern'
secondary: false
capabilities:
  - title: 'Route by intent'
    body: 'Evaluate the requested action and direct it only toward configured capabilities.'
  - title: 'Apply permission policy'
    body: 'Bind model access to explicit rules defined around the deployment boundary.'
  - title: 'Record the decision'
    body: 'Retain the routing and policy outcome for review alongside later execution evidence.'
flow:
  - 'Receive a model or agent request with its declared intent.'
  - 'Evaluate route and permission policy at the control boundary.'
  - 'Allow a scoped capability or deny the direct route.'
boundaries:
  - 'Hyper Tern does not replace identity, endpoint, or network controls.'
  - 'Containment depends on every relevant integration enforcing the routing decision.'
  - 'A permitted route is not a guarantee that the requested action is safe or correct.'
---
