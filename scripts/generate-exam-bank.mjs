/**
 * AIF-C01 exam-style question bank
 * - Enterprise scenarios, no course/PDF meta-references
 * - Exactly 4 options A–D, balanced length/tone
 * - Complete sentences only (no ellipsis)
 * - Grounded in Maarek AIF-C01 course PDF concepts
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const TARGET = 368;

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) {
    h ^= String(s).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleSeeded(arr, seed) {
  const a = [...arr];
  let s = hash(seed) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isComplete(text) {
  if (!text || typeof text !== "string") return false;
  if (text.includes("...")) return false;
  if (text.includes("…")) return false;
  if (/\b(the|a|an|your|with|to|for|of|and|or|from|into)$/i.test(text.trim())) return false;
  if (text.trim().length < 12) return false;
  return true;
}

function lengthsOk(options) {
  const lens = Object.values(options).map((o) => o.length);
  const min = Math.min(...lens);
  const max = Math.max(...lens);
  return max <= min * 2.1 && max - min <= 70;
}

function packOptions(correct, distractors, seed) {
  if (distractors.length !== 3) return null;
  if (![correct, ...distractors].every(isComplete)) return null;
  const values = shuffleSeeded([correct, ...distractors], seed);
  const letters = ["A", "B", "C", "D"];
  const options = {};
  let correct_answer = "A";
  values.forEach((v, i) => {
    options[letters[i]] = v;
    if (v === correct) correct_answer = letters[i];
  });
  if (!lengthsOk(options)) return null;
  return { options, correct_answer };
}

function pickBalanced(correct, pool, seed) {
  const candidates = pool.filter((x) => x !== correct && isComplete(x));
  const ranked = candidates
    .map((x) => ({ x, d: Math.abs(x.length - correct.length) }))
    .sort((a, b) => a.d - b.d || hash(seed + a.x) - hash(seed + b.x));
  const out = [];
  const seen = new Set();
  for (const { x } of ranked) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length === 3) break;
  }
  return out.length === 3 ? out : null;
}

/** Curated enterprise scenarios grounded in PDF-taught AWS AI concepts */
const GOLD = [
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 59,
    question:
      "A media company wants to build generative AI applications on AWS without managing servers, using a pay-per-use model and a unified API across foundation models. Which service should they choose?",
    correct: "Amazon Bedrock",
    distractors: ["Amazon SageMaker Canvas", "Amazon Personalize", "Amazon Comprehend"],
    explanation:
      "Amazon Bedrock is a fully managed service for building GenAI applications with foundation models through unified APIs, without provisioning servers.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 60,
    question:
      "An enterprise needs API access to many foundation models and wants a private copy it can fine-tune with proprietary data, without that data being used to train the base model. Which capability addresses this?",
    correct: "Amazon Bedrock foundation model customization",
    distractors: ["Amazon Rekognition Custom Labels", "Amazon Translate Active Custom Translation", "Amazon Lex automated chatbots"],
    explanation:
      "Bedrock provides access to foundation models and can create a customer-specific copy for fine-tuning so customer data is not used to train the base FM.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 64,
    question:
      "A bank wants to adapt a foundation model using labeled internal examples so model weights change for its domain. Training data will be stored in Amazon S3. Which approach should they use?",
    correct: "Fine-tune a foundation model in Amazon Bedrock",
    distractors: ["Increase temperature during Bedrock inference", "Enable Amazon Macie on the S3 bucket", "Replace Bedrock with Amazon Polly"],
    explanation:
      "Fine-tuning adapts a copy of a foundation model with your data and updates weights; Bedrock expects training data in a required format in Amazon S3.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 78,
    question:
      "A retailer needs an assistant that answers using current product catalogs stored outside the model’s original training data, with embeddings managed for retrieval. Which approach best fits?",
    correct: "Retrieval Augmented Generation with Bedrock Knowledge Bases",
    distractors: ["Training a new foundation model from scratch", "Using only zero-shot prompting with no retrieval", "Disabling Guardrails to allow longer answers"],
    explanation:
      "RAG lets a foundation model reference external data sources; Bedrock Knowledge Bases help create embeddings and retrieve relevant context at inference time.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 88,
    question:
      "A healthcare provider using Amazon Bedrock must block harmful topics, filter undesirable content, and remove personally identifiable information from prompts and responses. Which feature should they configure?",
    correct: "Amazon Bedrock Guardrails",
    distractors: ["Amazon SageMaker JumpStart", "Amazon Personalize recipes", "Amazon Forecast predictors"],
    explanation:
      "Bedrock Guardrails control user–model interactions by filtering harmful content, blocking topics, redacting PII, and helping reduce unsafe outputs.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 89,
    question:
      "An operations team wants a generative AI component that can run multi-step tasks, call internal APIs through action groups, and retrieve knowledge with RAG when needed. Which Bedrock capability fits?",
    correct: "Amazon Bedrock Agents",
    distractors: ["Amazon Textract Queries", "Amazon Transcribe Call Analytics", "Amazon Inspector findings"],
    explanation:
      "Bedrock Agents coordinate multi-step tasks, use predefined action groups, integrate with systems and APIs, and can leverage RAG for information retrieval.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 100,
    question:
      "A product team wants more reliable foundation model outputs by structuring prompts with instructions, context, input data, and a clear output format. What practice are they applying?",
    correct: "Prompt engineering",
    distractors: ["Model distillation only", "VPC endpoint peering", "S3 lifecycle transition"],
    explanation:
      "Prompt engineering designs and optimizes prompts—typically with instructions, context, input, and an output indicator—to improve foundation model results.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 107,
    question:
      "A developer asks a foundation model to complete a new task without providing any worked examples, relying only on the model’s existing knowledge. Which technique is this?",
    correct: "Zero-shot prompting",
    distractors: ["Few-shot prompting", "Continued pre-training", "Batch transform inference"],
    explanation:
      "Zero-shot prompting presents a task without examples and relies on the model’s general knowledge.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 108,
    question:
      "A marketing team includes two polished product-description examples in the prompt before asking for a new description. Which technique are they using?",
    correct: "Few-shot prompting",
    distractors: ["Zero-shot prompting", "Model quantization", "Provisioned throughput only"],
    explanation:
      "Few-shot prompting guides the model by providing a small number of examples in the prompt.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 109,
    question:
      "An analyst asks a model to solve a multi-step business problem and includes the instruction to think step by step before answering. Which prompting technique is this?",
    correct: "Chain-of-thought prompting",
    distractors: ["Negative prompting only", "Prompt caching only", "Spearman rank correlation"],
    explanation:
      "Chain-of-thought prompting structures reasoning into steps and often uses cues such as thinking step by step.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 102,
    question:
      "A brand safety team wants the model to avoid generating competitor names and prohibited claims in marketing copy. Which technique explicitly tells the model what not to do?",
    correct: "Negative prompting",
    distractors: ["Temperature scaling only", "Batch inference discounts", "SageMaker Debugger rules"],
    explanation:
      "Negative prompting explicitly instructs the model about content or behaviors to exclude from the response.",
  },
  {
    topic: "Amazon Q",
    sourcePage: 116,
    question:
      "Employees need a fully managed generative AI assistant that answers from company knowledge, summarizes content, and automates routine workplace tasks. Which service should the company deploy?",
    correct: "Amazon Q Business",
    distractors: ["Amazon Q Developer", "Amazon Macie", "Amazon Inspector"],
    explanation:
      "Amazon Q Business is a fully managed GenAI assistant for employees grounded in company knowledge and workflows.",
  },
  {
    topic: "Amazon Q",
    sourcePage: 122,
    question:
      "Software engineers need assistance answering AWS documentation questions, suggesting CLI commands, and troubleshooting resources in their AWS account from their IDE. Which service fits best?",
    correct: "Amazon Q Developer",
    distractors: ["Amazon Q Business", "Amazon Personalize", "AWS Artifact"],
    explanation:
      "Amazon Q Developer helps builders with AWS guidance, account resources, CLI suggestions, and troubleshooting for development workflows.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 196,
    question:
      "A support organization wants a managed NLP service to extract entities and key phrases from emails and measure whether customer sentiment is positive or negative. Which service should they use?",
    correct: "Amazon Comprehend",
    distractors: ["Amazon Polly", "Amazon Transcribe", "Amazon Rekognition"],
    explanation:
      "Amazon Comprehend provides NLP insights such as entities, key phrases, language, and sentiment analysis on text.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 200,
    question:
      "A global ecommerce site must localize large volumes of website and application text into multiple languages with managed translation. Which service should they choose?",
    correct: "Amazon Translate",
    distractors: ["Amazon Transcribe", "Amazon Polly", "Amazon Textract"],
    explanation:
      "Amazon Translate provides natural language translation for localizing content and efficiently translating large text volumes.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 201,
    question:
      "A contact center needs automatic speech recognition to convert call recordings into text, with options to redact PII. Which service meets this need?",
    correct: "Amazon Transcribe",
    distractors: ["Amazon Translate", "Amazon Polly", "Amazon Comprehend"],
    explanation:
      "Amazon Transcribe converts speech to text using ASR and supports capabilities such as PII redaction for audio workflows.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 204,
    question:
      "A learning platform needs lifelike spoken audio generated from lesson scripts for accessibility. Which AWS service should they use?",
    correct: "Amazon Polly",
    distractors: ["Amazon Transcribe", "Amazon Lex", "Amazon Rekognition"],
    explanation:
      "Amazon Polly turns text into lifelike speech using deep learning for applications that need spoken output.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 206,
    question:
      "A security team wants to detect objects, people, and text in uploaded images and videos, including facial analysis for verification workflows. Which service should they select?",
    correct: "Amazon Rekognition",
    distractors: ["Amazon Textract", "Amazon Comprehend", "Amazon Translate"],
    explanation:
      "Amazon Rekognition analyzes images and videos to find objects, people, text, and scenes, and supports facial analysis and search.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 208,
    question:
      "A social platform must automatically detect inappropriate or offensive images to reduce manual review workload. Which Rekognition capability should they use?",
    correct: "Amazon Rekognition content moderation",
    distractors: ["Amazon SageMaker Model Cards", "Amazon Forecast predictors", "AWS Trusted Advisor checks"],
    explanation:
      "Rekognition content moderation automatically detects inappropriate, unwanted, or offensive visual content.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 210,
    question:
      "A pizza chain wants conversational bots that understand intents, collect slot values, and invoke backend fulfillment for orders by voice or text. Which service fits?",
    correct: "Amazon Lex",
    distractors: ["Amazon Polly alone", "Amazon Macie", "Amazon Personalize"],
    explanation:
      "Amazon Lex builds chatbots for voice and text that understand intents, collect slots, and can invoke fulfillment logic such as AWS Lambda.",
  },
  {
    topic: "AWS Managed AI Services",
    sourcePage: 211,
    question:
      "An online store wants real-time personalized product recommendations using a fully managed ML service similar to Amazon.com recommendation technology. Which service should they adopt?",
    correct: "Amazon Personalize",
    distractors: ["Amazon Comprehend", "Amazon Textract", "Amazon Inspector"],
    explanation:
      "Amazon Personalize is a fully managed service for real-time personalized recommendations without building custom ML infrastructure from scratch.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 226,
    question:
      "Data scientists need a fully managed environment to build, train, tune, and deploy custom machine learning models end to end. Which service is designed for this?",
    correct: "Amazon SageMaker",
    distractors: ["Amazon Bedrock Guardrails", "Amazon Q Business", "Amazon Macie"],
    explanation:
      "Amazon SageMaker is a fully managed service for developers and data scientists to build, train, tune, and deploy ML models.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 243,
    question:
      "Before launching a credit model, a bank must detect bias and generate explanations of model predictions for auditors. Which SageMaker feature should they use?",
    correct: "Amazon SageMaker Clarify",
    distractors: ["Amazon SageMaker Model Monitor", "Amazon Polly lexicons", "Amazon Translate custom terminology"],
    explanation:
      "SageMaker Clarify helps detect bias and explain model outputs, supporting responsible evaluation before and after training.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 250,
    question:
      "A lender hosts a model on a real-time endpoint and must continuously detect quality drift in production so the team can retrain when performance degrades. Which feature fits?",
    correct: "Amazon SageMaker Model Monitor",
    distractors: ["Amazon SageMaker JumpStart", "Amazon Rekognition Custom Labels", "AWS Artifact reports"],
    explanation:
      "SageMaker Model Monitor tracks model quality in production on a continuous or scheduled basis and alerts on deviations such as drift.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 248,
    question:
      "Model owners must document intended uses, risk ratings, training details, and evaluation results in a standardized record. Which SageMaker governance feature should they create?",
    correct: "Amazon SageMaker Model Cards",
    distractors: ["Amazon SageMaker Feature Store", "Amazon EC2 Auto Scaling groups", "Amazon S3 Glacier vaults"],
    explanation:
      "SageMaker Model Cards capture essential model information such as intended uses, risk ratings, training details, and evaluation results.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 254,
    question:
      "A team with ML skills wants a hub of pretrained foundation and vision models they can customize and deploy on SageMaker with full control of hosting options. Which feature should they use?",
    correct: "Amazon SageMaker JumpStart",
    distractors: ["Amazon Bedrock Guardrails", "Amazon Q Apps", "AWS CloudTrail Insights"],
    explanation:
      "SageMaker JumpStart provides a model hub of pretrained models that can be customized and deployed on SageMaker with flexible deployment control.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 256,
    question:
      "Business analysts want to build ML models through a visual interface without writing code, including access to ready-to-use models. Which SageMaker capability fits?",
    correct: "Amazon SageMaker Canvas",
    distractors: ["Amazon SageMaker Neo", "Amazon Inspector", "Amazon Macie"],
    explanation:
      "SageMaker Canvas provides a no-code visual interface to prepare data and build models, including ready-to-use and AutoML options.",
  },
  {
    topic: "Amazon SageMaker",
    sourcePage: 247,
    question:
      "A GenAI team needs human labeling and reinforcement learning from human feedback workflows, using employees or vendors to annotate and review model outputs. Which service supports this?",
    correct: "Amazon SageMaker Ground Truth",
    distractors: ["Amazon Personalize", "Amazon Forecast", "AWS Snowball"],
    explanation:
      "SageMaker Ground Truth supports human labeling, review, and RLHF-style feedback using workforce options such as employees or vendors.",
  },
  {
    topic: "Responsible AI, Security, Compliance and Governance",
    sourcePage: 265,
    question:
      "A responsible AI review board asks which dimension focuses on promoting inclusion and preventing discrimination in AI systems. Which dimension matches that goal?",
    correct: "Fairness",
    distractors: ["Latency optimization", "Reserved Instance coverage", "Object lifecycle tiering"],
    explanation:
      "Fairness is a core responsible AI dimension that promotes inclusion and helps prevent discriminatory outcomes.",
  },
  {
    topic: "Responsible AI, Security, Compliance and Governance",
    sourcePage: 266,
    question:
      "A company wants humans to review low-confidence ML predictions before customer-facing actions are taken. Which AWS approach supports this human review pattern?",
    correct: "Amazon Augmented AI (A2I)",
    distractors: ["Amazon S3 Intelligent-Tiering", "Amazon EC2 Spot Advisors", "AWS Snowcone"],
    explanation:
      "Amazon Augmented AI (A2I) enables human review of machine learning predictions for higher-risk or low-confidence decisions.",
  },
  {
    topic: "Security, Compliance, and Governance",
    sourcePage: 351,
    question:
      "An enterprise must control which identities can invoke Amazon Bedrock APIs and which model resources they can access. Which service should define these permissions?",
    correct: "AWS Identity and Access Management (IAM)",
    distractors: ["Amazon Rekognition", "Amazon Personalize", "Amazon Polly"],
    explanation:
      "IAM provides identity verification and resource-level permissions to control access to AWS services such as Amazon Bedrock.",
  },
  {
    topic: "Security, Compliance, and Governance",
    sourcePage: 355,
    question:
      "For compliance, a company must record who called Amazon Bedrock APIs, which API was called, and when the call occurred. Which service should they use?",
    correct: "AWS CloudTrail",
    distractors: ["Amazon Personalize", "Amazon Translate", "Amazon Lex"],
    explanation:
      "AWS CloudTrail records API activity including the caller identity, API action, and timestamp for auditing and compliance.",
  },
  {
    topic: "AWS Security Services & More",
    sourcePage: 350,
    question:
      "A privacy team needs to discover sensitive data such as personally identifiable information stored in Amazon S3 buckets. Which service should they use?",
    correct: "Amazon Macie",
    distractors: ["Amazon Polly", "Amazon Personalize", "Amazon Forecast"],
    explanation:
      "Amazon Macie discovers and helps protect sensitive data, including PII, in Amazon S3.",
  },
  {
    topic: "AWS Security Services & More",
    sourcePage: 336,
    question:
      "A security engineer wants continuous vulnerability findings for Amazon EC2 instances, container images, and AWS Lambda functions. Which service evaluates these resources?",
    correct: "Amazon Inspector",
    distractors: ["Amazon Comprehend", "Amazon Textract", "Amazon Translate"],
    explanation:
      "Amazon Inspector scans EC2, container images, and Lambda for software vulnerabilities and related risks.",
  },
  {
    topic: "Fundamentals of Generative AI",
    sourcePage: 50,
    question:
      "Which statement best describes a foundation model used for generative AI workloads?",
    correct: "A model trained on a wide variety of data that can generate new content",
    distractors: [
      "A networking appliance that routes packets between VPCs",
      "A billing report that tracks only EC2 Reserved Instances",
      "A storage class designed only for Glacier Deep Archive",
    ],
    explanation:
      "Foundation models are trained on broad datasets and are used to generate new content across many downstream tasks.",
  },
  {
    topic: "AI and Machine Learning (ML)",
    sourcePage: 150,
    question:
      "A team has labeled historical examples and wants a model that predicts a continuous numeric value such as price. Which learning problem type is this?",
    correct: "Supervised learning regression",
    distractors: ["Unsupervised clustering only", "Reinforcement learning in a maze only", "DNS load balancing"],
    explanation:
      "Supervised regression learns a mapping from labeled inputs to continuous outputs for new unseen examples.",
  },
  {
    topic: "AI and Machine Learning (ML)",
    sourcePage: 174,
    question:
      "A model scores very highly on training data but performs poorly on unseen test data. What problem does this pattern indicate?",
    correct: "Overfitting",
    distractors: ["Underfitting only", "Perfect generalization", "Deterministic closed-form probability"],
    explanation:
      "High training performance with poor test performance is the classic sign of overfitting, often associated with high variance.",
  },
  {
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 80,
    question:
      "A knowledge base pipeline embeds document chunks and stores vectors for semantic retrieval. Which AWS data store options are commonly used with Bedrock RAG patterns?",
    correct: "Amazon OpenSearch Service, Amazon Aurora, or Neptune Analytics",
    distractors: [
      "Amazon SQS standard queues only",
      "Amazon CloudFront edge caches only",
      "AWS Snowball Edge devices only",
    ],
    explanation:
      "Bedrock RAG patterns commonly store embeddings in vector-capable stores such as OpenSearch Service, Aurora, and Neptune Analytics.",
  },
  {
    topic: "Prompt Engineering",
    sourcePage: 105,
    question:
      "A team lowers the temperature parameter so the foundation model returns more conservative and focused completions. What are they adjusting?",
    correct: "An inference parameter that controls randomness of outputs",
    distractors: [
      "An S3 lifecycle rule that moves objects to Glacier",
      "An IAM password policy rotation interval",
      "A Route 53 health check failure threshold",
    ],
    explanation:
      "Temperature is an inference parameter; lower values produce more conservative, less random model outputs.",
  },
  {
    topic: "Responsible AI, Security, Compliance and Governance",
    sourcePage: 266,
    question:
      "A company using Amazon Bedrock wants a managed control to block restricted topics and redact PII without writing custom filter code. Which capability should they enable?",
    correct: "Guardrails for Amazon Bedrock",
    distractors: ["Amazon EC2 placement groups", "Amazon S3 Transfer Acceleration", "AWS Snowmobile"],
    explanation:
      "Guardrails for Amazon Bedrock provide managed content controls including topic restrictions, harmful content filters, and PII redaction.",
  },
];

/** Additional scenario templates: correct service + balanced peer distractors */
const SERVICE_POOLS = {
  genai: [
    "Amazon Bedrock",
    "Amazon Bedrock Guardrails",
    "Amazon Bedrock Knowledge Bases",
    "Amazon Bedrock Agents",
    "Amazon SageMaker JumpStart",
    "Amazon Q Business",
    "Amazon Q Developer",
  ],
  managedAi: [
    "Amazon Comprehend",
    "Amazon Translate",
    "Amazon Transcribe",
    "Amazon Polly",
    "Amazon Rekognition",
    "Amazon Textract",
    "Amazon Lex",
    "Amazon Personalize",
  ],
  sagemaker: [
    "Amazon SageMaker",
    "Amazon SageMaker Clarify",
    "Amazon SageMaker Model Monitor",
    "Amazon SageMaker Canvas",
    "Amazon SageMaker JumpStart",
    "Amazon SageMaker Ground Truth",
    "Amazon SageMaker Model Cards",
    "Amazon SageMaker Feature Store",
  ],
  security: [
    "AWS Identity and Access Management (IAM)",
    "AWS CloudTrail",
    "Amazon Macie",
    "Amazon Inspector",
    "AWS Config",
    "AWS Artifact",
    "Amazon Bedrock Guardrails",
  ],
};

const TEMPLATES = [
  {
    pool: "genai",
    correct: "Amazon Bedrock",
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 59,
    stem: (c) =>
      `${c} wants to prototype generative AI apps on AWS using foundation models through a managed API without operating training clusters. Which service should they choose?`,
    explanation:
      "Amazon Bedrock provides managed access to foundation models for GenAI applications without requiring you to manage model-hosting servers.",
  },
  {
    pool: "genai",
    correct: "Amazon Bedrock Guardrails",
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 88,
    stem: (c) =>
      `${c} must prevent a Bedrock chatbot from discussing banned topics and from returning personally identifiable information. Which feature should they configure?`,
    explanation:
      "Amazon Bedrock Guardrails filters harmful content, can block topics, and supports PII redaction for safer GenAI applications.",
  },
  {
    pool: "genai",
    correct: "Amazon Bedrock Knowledge Bases",
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 78,
    stem: (c) =>
      `${c} needs answers grounded in private policy documents that change weekly, without fine-tuning a new model each week. Which capability should they use?`,
    explanation:
      "Bedrock Knowledge Bases support retrieval-augmented generation so responses can use up-to-date external documents.",
  },
  {
    pool: "genai",
    correct: "Amazon Bedrock Agents",
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 89,
    stem: (c) =>
      `${c} wants an AI workflow that plans multi-step actions and calls internal booking APIs in sequence. Which Bedrock feature should they use?`,
    explanation:
      "Amazon Bedrock Agents orchestrate multi-step tasks and can invoke action groups integrated with enterprise systems and APIs.",
  },
  {
    pool: "genai",
    correct: "Amazon Q Business",
    topic: "Amazon Q",
    sourcePage: 116,
    stem: (c) =>
      `${c} wants employees to ask questions against internal wikis and generate summaries without building a custom RAG stack. Which service fits?`,
    explanation:
      "Amazon Q Business is a managed workplace assistant that uses company knowledge to answer questions and generate content.",
  },
  {
    pool: "genai",
    correct: "Amazon Q Developer",
    topic: "Amazon Q",
    sourcePage: 122,
    stem: (c) =>
      `${c} wants developers to get coding and AWS troubleshooting help inside their IDE. Which service should they enable?`,
    explanation:
      "Amazon Q Developer assists builders with AWS guidance, coding help, and account-oriented troubleshooting workflows.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Comprehend",
    topic: "AWS Managed AI Services",
    sourcePage: 196,
    stem: (c) =>
      `${c} needs sentiment analysis and entity extraction on large volumes of customer email text. Which managed service should they use?`,
    explanation:
      "Amazon Comprehend is the managed NLP service for insights such as sentiment, entities, and key phrases in text.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Transcribe",
    topic: "AWS Managed AI Services",
    sourcePage: 201,
    stem: (c) =>
      `${c} must convert recorded support calls into searchable text transcripts at scale. Which service should they choose?`,
    explanation:
      "Amazon Transcribe provides automatic speech recognition to convert audio into text.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Translate",
    topic: "AWS Managed AI Services",
    sourcePage: 200,
    stem: (c) =>
      `${c} needs to localize product catalog text into multiple languages for international storefronts. Which service should they use?`,
    explanation:
      "Amazon Translate localizes and translates large volumes of text for multilingual applications.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Polly",
    topic: "AWS Managed AI Services",
    sourcePage: 204,
    stem: (c) =>
      `${c} wants to generate natural spoken audio from written training manuals. Which service should they select?`,
    explanation:
      "Amazon Polly converts text into lifelike speech for applications that need audio output.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Rekognition",
    topic: "AWS Managed AI Services",
    sourcePage: 206,
    stem: (c) =>
      `${c} needs to detect people and objects in warehouse camera images without building a custom vision model. Which service fits?`,
    explanation:
      "Amazon Rekognition provides managed computer vision for objects, people, text, and scenes in images and videos.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Textract",
    topic: "AWS Managed AI Services",
    sourcePage: 206,
    stem: (c) =>
      `${c} must extract text and structured fields from scanned PDF invoices. Which service should they use?`,
    explanation:
      "Amazon Textract extracts text and data from documents such as scanned PDFs and forms.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Lex",
    topic: "AWS Managed AI Services",
    sourcePage: 210,
    stem: (c) =>
      `${c} wants a voice and text chatbot that captures order details as slots and fulfills requests through backend APIs. Which service should they choose?`,
    explanation:
      "Amazon Lex builds conversational interfaces that understand intents, collect slots, and fulfill requests.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Personalize",
    topic: "AWS Managed AI Services",
    sourcePage: 211,
    stem: (c) =>
      `${c} wants real-time personalized product rankings on its homepage without training custom recommenders from scratch. Which service fits?`,
    explanation:
      "Amazon Personalize delivers managed real-time personalized recommendations for applications.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Clarify",
    topic: "Amazon SageMaker",
    sourcePage: 243,
    stem: (c) =>
      `${c} must measure bias and explain predictions for a regulated lending model before release. Which SageMaker feature should they use?`,
    explanation:
      "SageMaker Clarify supports bias detection and explainability for machine learning models.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Model Monitor",
    topic: "Amazon SageMaker",
    sourcePage: 250,
    stem: (c) =>
      `${c} needs alerts when live inference data drifts from the training baseline on a production endpoint. Which feature should they enable?`,
    explanation:
      "SageMaker Model Monitor detects data and quality issues such as drift for models in production.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Canvas",
    topic: "Amazon SageMaker",
    sourcePage: 256,
    stem: (c) =>
      `${c} wants business users to create ML models with a visual no-code interface. Which SageMaker capability should they use?`,
    explanation:
      "SageMaker Canvas provides a visual no-code experience for building machine learning models.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker JumpStart",
    topic: "Amazon SageMaker",
    sourcePage: 254,
    stem: (c) =>
      `${c} wants to start from pretrained models in a hub and deploy them on SageMaker with customization options. Which feature fits?`,
    explanation:
      "SageMaker JumpStart offers a hub of pretrained models that can be customized and deployed on SageMaker.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Model Cards",
    topic: "Amazon SageMaker",
    sourcePage: 248,
    stem: (c) =>
      `${c} requires documented intended use, training details, and risk information for each production model. Which feature should they create?`,
    explanation:
      "SageMaker Model Cards store governance documentation such as intended uses, training details, and risk ratings.",
  },
  {
    pool: "security",
    correct: "AWS Identity and Access Management (IAM)",
    topic: "Security, Compliance, and Governance",
    sourcePage: 351,
    stem: (c) =>
      `${c} must grant least-privilege permissions for applications that call Amazon Bedrock. Which service manages these permissions?`,
    explanation:
      "IAM controls authentication and authorization for AWS API access, including Amazon Bedrock.",
  },
  {
    pool: "security",
    correct: "AWS CloudTrail",
    topic: "Security, Compliance, and Governance",
    sourcePage: 355,
    stem: (c) =>
      `${c} needs an audit trail of Bedrock API calls including caller identity and event time. Which service should they use?`,
    explanation:
      "CloudTrail records API calls with identity and timing details for compliance and forensics.",
  },
  {
    pool: "security",
    correct: "Amazon Macie",
    topic: "AWS Security Services & More",
    sourcePage: 350,
    stem: (c) =>
      `${c} wants automated discovery of sensitive personally identifiable information in Amazon S3. Which service should they use?`,
    explanation:
      "Amazon Macie discovers sensitive data such as PII in Amazon S3 buckets.",
  },
  {
    pool: "security",
    correct: "Amazon Inspector",
    topic: "AWS Security Services & More",
    sourcePage: 336,
    stem: (c) =>
      `${c} needs vulnerability scanning for EC2 instances, container images, and Lambda functions. Which service should they enable?`,
    explanation:
      "Amazon Inspector evaluates EC2, container images, and Lambda for software vulnerabilities.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Feature Store",
    topic: "Amazon SageMaker",
    sourcePage: 242,
    stem: (c) =>
      `${c} wants a centralized store for ML feature metadata that teams can reuse across training and inference. Which feature should they use?`,
    explanation:
      "SageMaker Feature Store centrally stores feature data and metadata for reuse across machine learning workflows.",
  },
  {
    pool: "sagemaker",
    correct: "Amazon SageMaker Ground Truth",
    topic: "Amazon SageMaker",
    sourcePage: 247,
    stem: (c) =>
      `${c} needs human labeling workflows to create high-quality training datasets for supervised learning. Which SageMaker capability should they use?`,
    explanation:
      "SageMaker Ground Truth provides managed data labeling workflows with human reviewers.",
  },
  {
    pool: "genai",
    correct: "Amazon SageMaker JumpStart",
    topic: "Amazon SageMaker",
    sourcePage: 254,
    stem: (c) =>
      `${c} wants open-source foundation models they can fully customize and host on managed ML infrastructure. Which option should they choose?`,
    explanation:
      "SageMaker JumpStart provides pretrained models, including foundation models, that can be customized and deployed on SageMaker.",
  },
  {
    pool: "managedAi",
    correct: "Amazon Textract",
    topic: "AWS Managed AI Services",
    sourcePage: 206,
    stem: (c) =>
      `${c} must digitize paper forms by extracting printed text and key-value pairs from scanned documents. Which service should they select?`,
    explanation:
      "Amazon Textract extracts text and structured data from scanned documents and forms.",
  },
  {
    pool: "security",
    correct: "AWS Config",
    topic: "AWS Security Services & More",
    sourcePage: 350,
    stem: (c) =>
      `${c} needs continuous tracking of AWS resource configuration changes against compliance rules. Which service should they use?`,
    explanation:
      "AWS Config tracks configuration changes and evaluates resources against compliance rules.",
  },
  {
    pool: "security",
    correct: "AWS Artifact",
    topic: "AWS Security Services & More",
    sourcePage: 350,
    stem: (c) =>
      `${c} needs on-demand access to AWS compliance reports such as ISO and PCI documents. Which service should they use?`,
    explanation:
      "AWS Artifact provides access to AWS compliance reports and related agreements.",
  },
  {
    pool: "genai",
    correct: "Amazon Bedrock",
    topic: "Amazon Bedrock and GenAI",
    sourcePage: 59,
    stem: (c) =>
      `${c} wants a single managed API to try multiple foundation model providers without standing up GPU servers. Which service fits best?`,
    explanation:
      "Amazon Bedrock exposes multiple foundation models through a managed unified API without server management.",
  },
];

const COMPANIES = [
  "A retail enterprise",
  "A financial services company",
  "A healthcare provider",
  "A media streaming business",
  "A manufacturing firm",
  "A global software vendor",
  "A customer support organization",
  "An insurance carrier",
];

const questions = [];
const seen = new Set();

function addItem({ question, correct, distractors, explanation, topic, sourcePage, seed }) {
  if (questions.length >= TARGET) return false;
  if (!isComplete(question) || question.includes("...")) return false;
  if (/\b(course|pdf|slide|module|taught|page\s*\d)\b/i.test(question + explanation)) return false;
  const dist = distractors || null;
  if (!dist || dist.length !== 3) return false;
  const packed = packOptions(correct, dist, seed);
  if (!packed) return false;
  const key = question.toLowerCase().replace(/\s+/g, " ");
  if (seen.has(key)) return false;
  seen.add(key);
  questions.push({
    question,
    options: packed.options,
    correct_answer: packed.correct_answer,
    explanation,
    // app metadata (not shown in stems)
    id: `aif-${String(questions.length + 1).padStart(3, "0")}`,
    topic,
    sourcePage,
    source: "course-pdf",
    status: "ok",
    selectCount: 1,
    tags: ["exam-style", "aif-c01"],
  });
  return true;
}

// Gold set
GOLD.forEach((g, i) => {
  addItem({
    question: g.question,
    correct: g.correct,
    distractors: g.distractors,
    explanation: g.explanation,
    topic: g.topic,
    sourcePage: g.sourcePage,
    seed: `gold-${i}`,
  });
});

// Template expansions with company variants
let t = 0;
while (questions.length < TARGET && t < 5000) {
  const tmpl = TEMPLATES[t % TEMPLATES.length];
  const company = COMPANIES[hash(`co-${t}`) % COMPANIES.length];
  const pool = SERVICE_POOLS[tmpl.pool];
  const distractors = pickBalanced(tmpl.correct, pool, `d-${t}`);
  if (!distractors) {
    t++;
    continue;
  }
  // slight stem variation to avoid exact duplicates while staying enterprise
  const variant = t % 3;
  let question = tmpl.stem(company);
  if (variant === 1) question = question.replace("should they choose?", "is the best fit?");
  if (variant === 2) question = question.replace("should they use?", "should they select?");
  addItem({
    question,
    correct: tmpl.correct,
    distractors,
    explanation: tmpl.explanation,
    topic: tmpl.topic,
    sourcePage: tmpl.sourcePage,
    seed: `tmpl-${t}`,
  });
  t++;
}

// Conceptual statement items from clean PDF concepts (service-name options only)
try {
  const concepts = JSON.parse(readFileSync(join(root, "scripts", "output", "concepts.json"), "utf8"));
  const serviceConcepts = concepts.filter((c) =>
    /Amazon |SageMaker|Bedrock|Guardrail|Comprehend|Transcribe|Translate|Polly|Rekognition|Textract|Lex|Personalize|Macie|Inspector|CloudTrail|IAM|Q Business|Q Developer|Clarify|Canvas|JumpStart|Model Monitor|Model Cards|Ground Truth|Feature Store/i.test(
      c.title,
    ),
  );
  let i = 0;
  while (questions.length < TARGET && i < serviceConcepts.length * 3) {
    const c = serviceConcepts[i % serviceConcepts.length];
    const correct = c.title.replace(/\s*[–—-]\s*/g, " ").replace(/\s+/g, " ").trim();
    if (!isComplete(correct) || correct.length > 70) {
      i++;
      continue;
    }
    const pool = [
      ...SERVICE_POOLS.genai,
      ...SERVICE_POOLS.managedAi,
      ...SERVICE_POOLS.sagemaker,
      ...SERVICE_POOLS.security,
    ];
    const distractors = pickBalanced(correct, pool, `c-${i}`);
    if (!distractors) {
      i++;
      continue;
    }
    const def = String(c.definition || "").replace(/\s+/g, " ").trim();
    if (!isComplete(def) || def.length > 140 || def.includes("...")) {
      i++;
      continue;
    }
    const company = COMPANIES[hash(`cc-${i}`) % COMPANIES.length];
    addItem({
      question: `${company} needs this capability: "${def}" Which AWS service or feature should they use?`,
      correct,
      distractors,
      explanation: `${correct} matches the required capability. The other options provide different AWS AI, ML, or security functions.`,
      topic: c.section,
      sourcePage: c.page,
      seed: `concept-${i}`,
    });
    i++;
  }
} catch {
  /* concepts optional */
}

if (questions.length < TARGET) {
  console.error(`Only generated ${questions.length}/${TARGET}`);
  process.exit(1);
}

const finalQuestions = questions.slice(0, TARGET);

// Validate
const errors = [];
for (const q of finalQuestions) {
  const opts = ["A", "B", "C", "D"].map((l) => q.options[l]);
  if (opts.some((o) => !isComplete(o))) errors.push(`${q.id} incomplete option`);
  if (opts.some((o) => o.includes("...") || o.includes("…"))) errors.push(`${q.id} ellipsis`);
  if (!q.options[q.correct_answer]) errors.push(`${q.id} bad correct_answer`);
  if (!lengthsOk(q.options)) errors.push(`${q.id} unbalanced lengths`);
  if (/\b(course|pdf|slide|module|taught)\b/i.test(q.question + q.explanation)) {
    errors.push(`${q.id} meta wording`);
  }
}

// App-facing shape: keep A-D object + derived array fields for current UI
const appQuestions = finalQuestions.map((q) => ({
  ...q,
  optionsArray: ["A", "B", "C", "D"].map((l) => q.options[l]),
  correctAnswer: q.options[q.correct_answer],
}));

const dataDir = join(root, "app", "src", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "questions.json"), JSON.stringify(appQuestions, null, 2));
writeFileSync(
  join(root, "scripts", "output", "exam-questions-abcd.json"),
  JSON.stringify(
    finalQuestions.map(({ question, options, correct_answer, explanation }) => ({
      question,
      options,
      correct_answer,
      explanation,
    })),
    null,
    2,
  ),
);

const byTopic = {};
for (const q of finalQuestions) byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;

const report = {
  generatedAt: new Date().toISOString(),
  total: finalQuestions.length,
  errors,
  byTopic,
  sample: finalQuestions.slice(0, 3),
};

writeFileSync(join(root, "scripts", "output", "extraction-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ total: report.total, errors: errors.length, byTopic }, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 20));
  process.exit(1);
}
