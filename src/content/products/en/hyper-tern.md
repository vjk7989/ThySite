---
title: 'Hyper Tern'
description: 'Routing, permissions, and control boundaries for AI workflows'
main:
  id: 2
  content: |
    Hyper Tern is Buckleson's routing and permission layer for configured AI workflows. It helps teams define who can invoke a workflow, which model route it may use, which tools it may reach, and where human review remains required.
  imgCard: '@/images/product-image-2.avif'
  imgMain: '@/images/product-image-main-2.avif'
  imgAlt: 'Mockup boxes retained as temporary placeholder imagery'
tabs:
  - id: 'tabs-with-card-item-1'
    dataTab: '#tabs-with-card-1'
    title: 'Overview'
  - id: 'tabs-with-card-item-2'
    dataTab: '#tabs-with-card-2'
    title: 'Control Points'
  - id: 'tabs-with-card-item-3'
    dataTab: '#tabs-with-card-3'
    title: 'Workflow Map'
longDescription:
  title: 'Make every AI route explicit before it acts'
  subTitle: |
    Agentic AI risk often grows when a model can choose tools, retrieve data, or call services without a clear execution boundary. Hyper Tern is designed to make that boundary visible: actor, task, model route, tool scope, side effects, and review owner. It supports least-privilege design, but it does not replace identity, endpoint, network, or human approval controls.
  btnTitle: 'Request an assessment'
  btnURL: '/ThySite/contact/'
descriptionList:
  - title: 'Actor and Intent'
    subTitle: 'Connect a workflow request to the user, operator, or system role that initiated it.'
  - title: 'Route and Tool Scope'
    subTitle: 'Define which model, tool, service, or infrastructure path is allowed for the task.'
  - title: 'Review Boundary'
    subTitle: 'Mark high-impact actions that should require human approval before execution.'
specificationsLeft:
  - title: 'Primary Use'
    subTitle: 'Configured routing and permission boundaries for AI and agentic workflows.'
  - title: 'Inputs'
    subTitle: 'Actors, tasks, model routes, tools, data classes, side-effect rules, and review requirements.'
  - title: 'Output'
    subTitle: 'An allowed execution path that can be logged, reviewed, and monitored.'
  - title: 'Limit'
    subTitle: 'Does not prove model output is correct and does not prevent prompt injection by itself.'
tableData:
  - feature: ['Control Area', 'Purpose']
    description:
      - ['Actor', 'Who may initiate or approve the workflow']
      - ['Route', 'Which model, endpoint, or service may be used']
      - ['Tool', 'Which external action is permitted']
      - ['Data', 'Which information classes may enter the workflow']
      - ['Review', 'Where human approval remains required']
      - ['Evidence', 'What should be recorded for later review']
blueprints:
  first: '@/images/blueprint-1.avif'
  second: '@/images/blueprint-2.avif'
---
