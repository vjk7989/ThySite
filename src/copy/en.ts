import faqs from '@data/faqs.json';
import features from '@data/features.json';
import pricing from '@data/pricing.json';

/**
 * English copy table for the marketing site.
 *
 * Public Buckleson copy table.
 *
 * This pass updates text and public content slugs only. Template imagery,
 * theme, layout, components, forms, and dependencies remain unchanged.
 */
export const en = {
  site: {
    description:
      'Buckleson helps organizations adopt AI more safely with controlled access, privacy-aware data handling, and verifiable execution records.',
    descriptionShort:
      'Buckleson provides trust and execution infrastructure for safer AI adoption.',
    ogTitle: 'Buckleson: Trust and Execution Infrastructure for AI',
    ogDescription:
      'Control AI access, reduce sensitive-data exposure, and create verifiable execution records with Buckleson and Hyper-0x.',
  },

  layout: {
    skipToContent: 'Skip to content',
    changeLanguage: 'Change language',
    toggleNavigation: 'Toggle navigation',
    darkTheme: 'Dark Theme Toggle',
    lightTheme: 'Light Theme Toggle',
    toggleTheme: 'Toggle theme',
  },

  nav: {
    labels: {
      home: 'Home',
      products: 'Platform',
      services: 'Solutions',
      blog: 'Insights',
      contact: 'Contact',
    },
    footer: {
      sectionTitles: {
        ecosystem: 'Platform',
        company: 'Company',
      },
      links: {
        documentation: 'Documentation',
        tools: 'Platform modules',
        services: 'Solutions',
        about: 'About us',
        blog: 'Insights',
        careers: 'Careers',
        customers: 'Use cases',
      },
      hiringBadge: 'Coming soon',
      stayUpToDate: 'Stay up to date',
      stayUpToDateContent:
        'Get practical AI safety notes and platform updates from Buckleson.',
      craftedBy: 'Crafted by',
      newsletterDemoMessage:
        'Thanks! (Demo only - wire an email service before collecting subscribers.)',
    },
    megaMenu: {
      services: {
        guides: {
          title: 'AI Safety Guides',
          description:
            'Learn how to map AI workflows, controls, and evidence boundaries before deployment.',
        },
        integrations: {
          title: 'Deployment Boundaries',
          description:
            'Plan safer connections between models, tools, data sources, and human review.',
        },
        experts: {
          title: 'Assessment Services',
          description:
            'Review a bounded AI workflow with Buckleson before expanding adoption.',
        },
        tools: {
          title: 'Hyper-0x Platform',
          description:
            'Explore routing, abstraction, and verification layers for accountable AI execution.',
        },
        plans: {
          title: 'Engagement Paths',
          description:
            'Start with assessment, move through pilot design, and operate with evidence.',
        },
        community: {
          title: 'Operator Notes',
          description:
            'Share lessons from AI governance, secure inference, and custom model work.',
        },
      },
      successStories: 'Control Boundaries',
      successStory: {
        description:
          'Use Buckleson to describe what an AI workflow is allowed to do, what data it needs, and what evidence must be retained.',
        imageAlt: 'Portrait used by the template as a placeholder',
      },
      learnMore: 'Learn more',
    },
  },

  forms: {
    email: 'Email',
    emailAddress: 'Email address',
    emailPlaceholder: 'Enter your email',
    emailInvalid:
      'Please include a valid email address so we can get back to you',
    subscribe: 'Subscribe',
    phone: 'Phone Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot password?',
    passwordHint: '8+ characters required',
    passwordMismatch: 'Password does not match the password',
    rememberMe: 'Remember me',
    acceptTerms: 'I accept the ',
    termsAndConditions: 'Terms and Conditions',
    or: 'Or',
    demoFallbackMessage: 'Demo only - this form is not connected to a backend.',
  },

  auth: {
    logIn: 'Log in',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signInWithGoogle: 'Sign in with Google',
    signUpWithGoogle: 'Sign up with Google',
    noAccountYet: "Don't have an account yet?",
    signUpHere: 'Sign up here',
    alreadyHaveAccount: 'Already have an account?',
    signInHere: 'Sign in here',
    forgotPasswordTitle: 'Forgot password?',
    rememberYourPassword: 'Remember your password?',
    resetPassword: 'Reset password',
    credentialsDemoNotice:
      'Demo only - connect a real auth provider before collecting credentials.',
    recoveryDemoNotice:
      'Demo only - password recovery is not connected to a backend.',
    signInDemoMessage: 'Demo only - sign-in is not connected to a backend.',
    registerDemoMessage:
      'Demo only - registration is not connected to a backend.',
    recoverDemoMessage:
      'Demo only - password recovery is not connected to a backend.',
  },

  share: {
    share: 'Share',
    shareOn: (platform: string) => `Share on ${platform}`,
    copied: 'Copied',
    copyLink: 'Copy link',
  },

  banner: {
    dismiss: 'Dismiss',
    region: 'Informational banner',
  },

  blog: {
    readMore: 'Read More',
    minRead: (minutes: number) => `${minutes} min read`,
    relatedArticles: 'Related articles',
    wasHelpful: 'Was this post helpful?',
    yes: 'Yes',
    no: 'No',
    ogSection: 'Insights',
  },

  insights: {
    readMore: 'Read more',
    tableOfContents: 'Table of Contents:',
    ogSection: 'Insights',
  },

  products: {
    ogSection: 'Platform',
    tabs: 'Tabs',
  },

  notFound: {
    title: 'Page Not Found',
    subTitle: 'This workflow is outside the current map.',
    content:
      'Use the navigation to return to Buckleson platform, solutions, and AI safety resources.',
    goHome: 'Go Home',
    goBack: 'Go Back',
  },

  home: {
    banner: 'AI adoption is inevitable. Trust is not.',
    hero: {
      title:
        'Use AI safely. <span class="text-brand-500 dark:text-yellow-400">Prove every action.</span>',
      subTitle:
        'Buckleson helps organizations adopt AI with explicit control boundaries, privacy-aware inference, and verifiable execution records powered by Hyper-0x.',
      primaryBtn: 'Explore the Platform',
      secondaryBtn: 'Request an AI Safety Assessment',
      rating: '<span class="font-bold">Bounded</span> by design',
      reviews: 'Control, protect, verify',
      imageAlt:
        'Stack of template product boxes retained as temporary placeholder imagery',
    },
    clients: {
      title: 'Built for teams adopting AI responsibly',
      subTitle:
        'Support organizations, AI teams, developers, and individuals that need safer ways to connect models, data, tools, and review.',
    },
    featuresGeneral: {
      title: 'AI adoption needs boundaries, minimization, and evidence',
      subTitle:
        'Buckleson focuses on practical risks around agentic AI and LLM applications: prompt manipulation, sensitive-data exposure, excessive agency, untrusted tools, and actions that are hard to reconstruct later.',
      imageAlt: 'Template product boxes retained as placeholder imagery',
    },
    featuresNavs: {
      title:
        'Map one workflow through <span class="text-brand-500 dark:text-yellow-400">control, protection, and verification</span>.',
      tabs: {
        tools: {
          heading: 'Control with Hyper Tern',
          content:
            'Hyper Tern defines who can invoke a workflow, which model route it may use, which tools it may reach, and where human review remains required.',
          alt: 'Heavy equipment placeholder image retained from the template',
        },
        dashboard: {
          heading: 'Protect with Hyper-ABS',
          content:
            'Hyper-ABS is designed to reduce unnecessary raw-data exposure before inference by minimizing or transforming context where the workflow allows it.',
          alt: 'Dashboard placeholder image retained from the template',
        },
        features: {
          heading: 'Verify with Hyper-0x',
          content:
            'Hyper-0x preserves attributable execution records so reviewers can understand what was requested, allowed, executed, and escalated.',
          alt: 'Building-frame placeholder image retained from the template',
        },
      },
    },
    testimonials: {
      title: 'Move from AI idea to bounded pilot',
      subTitle:
        'Start with one workflow, define its route and data boundary, reduce unnecessary exposure, and keep useful evidence for review.',
      quotes: [
        {
          content:
            'Buckleson frames AI safety as an operating discipline: define the route, minimize exposure, verify the action, and keep humans in the loop where risk demands it.',
          author: 'Buckleson Research',
          role: 'AI safety and trust infrastructure',
        },
      ],
      statistics: [
        {
          count: 'Assess',
          description: 'map actors, tools, data, side effects, and evidence',
        },
        {
          count: 'Pilot',
          description: 'apply controls to one bounded AI workflow first',
        },
        {
          count: 'Verify',
          description: 'retain execution records for operational review',
        },
        {
          count: 'Operate',
          description: 'expand only where controls and evidence are clear',
        },
      ],
    },
    faqTitle: 'Frequently<br />asked questions',
    heroAlt: {
      title: 'Request a Buckleson AI safety assessment',
      subTitle:
        'Bring one real workflow: the model route, data sources, tools, actions, and review needs. We will help map practical control boundaries first.',
      btn: 'Request an Assessment',
    },
  },

  services: {
    title: 'Solutions',
    metaDescription:
      'Buckleson helps teams assess agentic AI risk, design secure inference boundaries, and build custom AI workflows with verifiable execution records.',
    ogTitle: 'AI Safety Solutions | Buckleson',
    intro: {
      title: 'Safer AI adoption starts with one bounded workflow',
      subTitle:
        'Buckleson helps identify where AI touches data, tools, infrastructure, and decisions, then designs controls around that execution path.',
      cta: 'Request an Assessment',
    },
    articles: {
      guidance: {
        title: 'AI Safety Assessment',
        subTitle:
          'Map one AI workflow from actor to model to tool call. We identify prompt-injection exposure, sensitive data, allowed actions, required review, and evidence that should be retained.',
        imageAlts: [
          'Blueprints and digital tablet retained as placeholder imagery.',
          'Person working in the office',
        ],
      },
      craftsmanship: {
        title: 'Secure Inference Design',
        subTitle:
          'Define how prompts, context, retrieval, memory, tools, and outputs move through the system. The goal is to reduce exposure and make enforcement points visible.',
        imageAlts: ['Before and after placeholder image retained temporarily'],
        cta: 'Learn More',
      },
      oversight: {
        title: 'Custom AI and Fine-Tuning Support',
        subTitle:
          'For teams that need custom models or fine-tuning, Buckleson helps shape data boundaries, evaluation expectations, and deployment controls before launch.',
        imageAlts: [
          'People coordinating work retained as placeholder imagery',
          'Aerial placeholder image retained temporarily',
        ],
      },
      maintenance: {
        title: 'Evidence and Operations',
        subTitle:
          'Hyper-0x records can support audit, incident review, and operating review. They do not prove that an AI answer is correct, but they help teams understand what happened.',
        imageAlts: [
          'Worker holding a power tool retained as placeholder imagery',
        ],
      },
      bespoke: {
        title: 'Enterprise Control Boundaries',
        subTitle:
          'For larger organizations, Buckleson helps separate public use cases, internal workflows, regulated actions, and high-impact decisions so each boundary can be reviewed separately.',
        imageAlts: [
          'In-progress structure retained as placeholder imagery',
          'Building placeholder image retained temporarily',
        ],
        cta: 'Read more',
      },
    },
    stats: {
      title: 'How We Work',
      subTitle:
        'We avoid unsupported guarantees. Buckleson is designed to reduce exposure, make control boundaries explicit, and preserve verifiable records where configured.',
      mainStatTitle: '1',
      mainStatSubTitle:
        'bounded AI workflow is enough to begin a practical safety assessment',
      stats: [
        { stat: 'Map', description: 'actors, data, tools, and decisions' },
        { stat: 'Reduce', description: 'unnecessary sensitive-data exposure' },
        { stat: 'Record', description: 'execution evidence for review' },
      ],
    },
  },

  contact: {
    title: 'AI Safety Assessment',
    metaDescription:
      'Request a Buckleson AI safety assessment for a bounded workflow.',
    ogTitle: 'Request an AI Safety Assessment | Buckleson',
    heading: 'Request an AI safety assessment',
    subTitle:
      'Tell us which AI workflow you want to assess, what data it touches, and what tools or decisions it can affect.',
    formTitle: 'Share the workflow context',
    formSubTitle:
      "This template form is not connected yet. We'll wire it only after backend and privacy handling are approved.",
    firstName: 'First Name',
    lastName: 'Last Name',
    details: 'Workflow details',
    send: 'Request Assessment',
    demoMessage:
      'Thanks! (Demo only - wire a form endpoint before receiving real assessment requests.)',
    knowledgeHeading: 'Knowledgebase',
    knowledgeContent:
      'Browse AI safety notes, platform boundaries, and implementation guidance.',
    knowledgeLink: 'Visit guides & tutorials',
    faqHeading: 'FAQ',
    faqContent: 'Explore quick answers about Hyper-0x and safer AI adoption.',
    faqLink: 'Visit FAQ',
    officeHeading: 'Buckleson',
    officeContent: 'AI safety and trust infrastructure',
    emailHeading: 'Contact us by email',
    emailContent: 'Prefer the written word? Email Buckleson at',
  },

  blogIndex: {
    title: 'Insights',
    metaDescription:
      'AI safety notes from Buckleson on agentic workflows, secure inference, verifiable execution, and conservative deployment boundaries.',
    ogTitle: 'AI Safety Insights | Buckleson',
    heading: 'AI Safety Insights',
    subTitle:
      'Read practical notes about control boundaries, data exposure, execution evidence, OWASP-aligned risk framing, and safer AI adoption.',
    insightsHeading: 'Field Notes',
    insightsSubTitle:
      'Short explainers for teams evaluating where AI should be allowed to act and what proof should remain afterward.',
    noPosts: 'No posts yet. Check back soon.',
    noInsights: 'No field notes yet. Check back soon.',
  },

  productsIndex: {
    title: 'Platform',
    metaDescription:
      'Explore Buckleson platform modules for controlled AI routing, privacy-aware abstraction, and verifiable execution records.',
    ogTitle: 'Buckleson Platform',
    heading: 'Platform',
    subTitle:
      'Buckleson combines Hyper Tern, Hyper-ABS, Hyper-0x, and Hyper Wallet concepts into a trust layer for safer AI workflows.',
    customerStories: 'Control Stories',
    testimonials: {
      title: 'What the Platform Is For',
      quotes: [
        {
          content:
            'Hyper Tern helps make routes explicit before a model or tool is used.',
          author: 'Buckleson',
          role: 'Routing and permissions',
          avatarAlt: 'Template avatar placeholder',
        },
        {
          content:
            'Hyper-ABS is designed to reduce unnecessary raw-data exposure before inference.',
          author: 'Buckleson',
          role: 'Data abstraction',
          avatarAlt: 'Template avatar placeholder',
        },
        {
          content:
            'Hyper-0x preserves execution records for review; it does not guarantee that every AI output is correct.',
          author: 'Buckleson',
          role: 'Verification layer',
          avatarAlt: 'Template avatar placeholder',
        },
      ],
    },
    stats: {
      title: 'Why Use Buckleson?',
      subTitle:
        'Teams need more than model access. They need boundaries, privacy-aware handling, evidence, and clarity about what remains outside the control layer.',
      benefits: [
        'Make AI routes and tool permissions explicit.',
        'Reduce unnecessary sensitive-data exposure before inference.',
        'Keep attributable records for operational review.',
      ],
    },
  },

  data: { faqs, features, pricing },
};
