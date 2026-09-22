---
title: 'Hyper Wallet'
description: 'A supporting identity and signing interface for controlled actions and their receipts.'
order: 4
action: 'Authorize'
eyebrow: 'Supporting proof'
summary: 'Hyper Wallet helps connect an authorized identity to signed intent and the execution evidence produced by the wider platform.'
diagram: 'hyper-wallet'
secondary: true
capabilities:
  - title: 'Sign declared intent'
    body: 'Associate an authorized identity with the scope of a controlled action.'
  - title: 'Carry portable receipts'
    body: 'Present relevant execution records to approved workflows and reviewers.'
  - title: 'Support the trust layer'
    body: 'Complement Hyper Tern, Hyper-ABS, and Hyper-0x without acting as the primary platform boundary.'
flow:
  - 'Confirm the identity authorized to request an action.'
  - 'Sign the declared intent and approved scope.'
  - 'Associate the resulting execution receipt with the authorized workflow.'
boundaries:
  - 'Hyper Wallet is a supporting interface, not a replacement for enterprise identity systems.'
  - 'A signature confirms attribution; it does not validate the quality of an AI decision.'
  - 'Key management and recovery requirements depend on the deployment model.'
---
