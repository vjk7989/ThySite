---
title: 'Hyper-ABS'
description: 'Privacy-aware abstraction and data minimization before inference'
main:
  id: 3
  content: |
    Hyper-ABS is Buckleson's abstraction layer for reducing unnecessary raw-data exposure before inference. It helps teams separate what the AI task needs from what the workflow happens to have access to.
  imgCard: '@/images/product-image-3.avif'
  imgMain: '@/images/product-image-main-3.avif'
  imgAlt: 'Mockup boxes retained as temporary placeholder imagery'
tabs:
  - id: 'tabs-with-card-item-1'
    dataTab: '#tabs-with-card-1'
    title: 'Overview'
  - id: 'tabs-with-card-item-2'
    dataTab: '#tabs-with-card-2'
    title: 'Data Boundary'
  - id: 'tabs-with-card-item-3'
    dataTab: '#tabs-with-card-3'
    title: 'Workflow Map'
longDescription:
  title: 'Send less raw context into the model'
  subTitle: |
    Secure inference is not only a hosting choice. It is a design choice about prompts, retrieval, memory, tools, and outputs. Hyper-ABS is designed to minimize or transform sensitive context before model calls where the workflow allows it. It can reduce exposure, but it does not guarantee privacy or replace access control, encryption, retention policy, or human review.
  btnTitle: 'Request an assessment'
  btnURL: '/ThySite/contact/'
descriptionList:
  - title: 'Data Classification'
    subTitle: 'Identify what information is sensitive, task-critical, optional, or blocked.'
  - title: 'Context Minimization'
    subTitle: 'Pass the smallest useful representation instead of full raw records when possible.'
  - title: 'Inference Boundary'
    subTitle: 'Document where prompt, retrieval, memory, and output controls apply.'
specificationsLeft:
  - title: 'Primary Use'
    subTitle: 'Sensitive-data exposure reduction before AI inference.'
  - title: 'Inputs'
    subTitle: 'Data classes, task purpose, retrieval context, memory policy, and blocked fields.'
  - title: 'Output'
    subTitle: 'A bounded representation that supports the intended AI task.'
  - title: 'Limit'
    subTitle: 'Does not guarantee privacy and does not prevent every reconstruction, leakage, or misuse path.'
tableData:
  - feature: ['Boundary', 'Purpose']
    description:
      - ['Data Class', 'Know what type of information is being handled']
      - ['Minimum Context', 'Keep only what the task needs']
      - ['Transformation', 'Reduce direct raw-data exposure']
      - ['Retrieval', 'Limit what external context can be added']
      - ['Memory', 'Define what can persist across runs']
      - ['Review', 'Check where abstraction may be insufficient']
blueprints:
  first: '@/images/blueprint-1.avif'
  second: '@/images/blueprint-2.avif'
---
