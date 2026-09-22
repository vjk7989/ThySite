---
title: 'Prompt injection is an execution-boundary problem'
description: 'Treat untrusted instructions as one input to a controlled system, not as authority to reach tools and data.'
cardImage: '@/images/buckleson/insights/prompt-injection.png'
cardImageAlt: 'Abstract violet path diverted before entering a protected control boundary'
---

Prompt injection is often described as a prompt-writing problem. In an agentic system, the more durable question is whether untrusted content can change which capabilities the system reaches.

## Separate content from authority

Retrieved documents, web pages, messages, and tool outputs can all contain instructions. They may be useful context, but they should not automatically inherit the authority of the user or service that initiated the workflow.

The application should keep identity, intent, permission, and tool policy outside the untrusted content channel. A model may propose an action; the execution layer should decide whether that action is within scope.

## Constrain tools, data, and side effects

Use the narrowest capability that completes the task. Prefer read-only access when writes are unnecessary. Validate tool parameters, apply data minimization, require confirmation for high-impact actions, and ensure denied routes are not reachable through an alternate integration.

## Record the decision, not only the output

For review, retain the requested action, relevant source context, policy result, selected capability, and execution outcome. This evidence can help investigate unexpected behavior, but it does not guarantee that every malicious instruction will be detected.

A strong boundary assumes the model can be influenced and limits what that influence can cause.
