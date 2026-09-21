/**
 * Builds the AIF-C01 question bank from:
 * 1) Course PDF slide facts (source: course-pdf)
 * 2) AWS Official Practice Question Set samples (source: aws-official-practice)
 * 3) High-likelihood exam-style items aligned to exam guide + common confusion pairs (source: exam-likely)
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pages = JSON.parse(readFileSync(join(root, "scripts", "output", "all-pages.json"), "utf8"));

function pageFlat(n) {
  const p = pages.find((x) => x.page === n);
  return p ? p.flat : "";
}

/** @typedef {{
 *  id: string
 *  question: string
 *  options: string[]
 *  correctAnswer: string | string[]
 *  explanation?: string
 *  topic: string
 *  subtopic?: string
 *  sourcePage?: number
 *  sourceSection?: string
 *  source: 'course-pdf' | 'aws-official-practice' | 'exam-likely'
 *  difficulty?: 'easy' | 'medium' | 'hard'
 *  confusionPoints?: string[]
 *  tags?: string[]
 *  selectCount?: number
 *  status?: 'ok' | 'NEEDS_REVIEW'
 * }} Question */

/** @type {Question[]} */
const questions = [];

function add(q) {
  questions.push({
    status: "ok",
    ...q,
    selectCount: Array.isArray(q.correctAnswer) ? q.correctAnswer.length : 1,
  });
}

// ---------------------------------------------------------------------------
// AWS OFFICIAL PRACTICE QUESTION SET (from AWS TNC203 / Skill Builder samples)
// Answers follow widely published AWS sample-question solutions.
// ---------------------------------------------------------------------------

add({
  id: "aws-off-001",
  source: "aws-official-practice",
  topic: "Fundamentals of AI and ML",
  subtopic: "ML lifecycle",
  question:
    "A data science team wants to improve a model's performance. The team wants to increase the number of variables in the training dataset and modify the behavior of the algorithm. Which combination of ML pipeline steps will meet these requirements? (Select TWO.)",
  options: [
    "Hyperparameter tuning",
    "Model evaluation",
    "Feature engineering",
    "Model monitoring",
    "Data collection",
  ],
  correctAnswer: ["Hyperparameter tuning", "Feature engineering"],
  explanation:
    "Increasing variables relates to feature engineering. Changing algorithm behavior relates to hyperparameter tuning. Evaluation/monitoring/collection do not directly do both.",
  difficulty: "medium",
  tags: ["ml-lifecycle", "feature-engineering", "hyperparameters"],
});

add({
  id: "aws-off-002",
  source: "aws-official-practice",
  topic: "Fundamentals of Generative AI",
  subtopic: "Amazon Bedrock",
  question:
    "A travel company wants to use a pre-trained generative AI model to generate background images for marketing materials. The company does not have ML expertise and does not want to customize and host the ML model. Which AWS service will meet these requirements?",
  options: [
    "Amazon Bedrock",
    "Amazon SageMaker JumpStart",
    "Amazon Rekognition",
    "Amazon Personalize",
  ],
  correctAnswer: "Amazon Bedrock",
  explanation:
    "Bedrock provides serverless access to pre-trained FMs via API without hosting or deep ML expertise. JumpStart still involves deploying on SageMaker.",
  difficulty: "easy",
  confusionPoints: ["Bedrock vs SageMaker"],
  tags: ["bedrock", "genai"],
});

add({
  id: "aws-off-003",
  source: "aws-official-practice",
  topic: "Fundamentals of Generative AI",
  subtopic: "Foundation models",
  question: "What is a foundation model (FM) in the context of generative AI?",
  options: [
    "A task-specific model that is trained on a narrow domain, such as finance or medicine, to serve as a foundation in that area.",
    "A large, general-purpose model that is pre-trained on diverse datasets that can be fine-tuned for downstream tasks.",
    "A theoretical framework to understand how different types of models learn representations.",
    "A basic architecture that serves as a starting point to design more complex neural networks.",
  ],
  correctAnswer:
    "A large, general-purpose model that is pre-trained on diverse datasets that can be fine-tuned for downstream tasks.",
  explanation:
    "FMs are large general-purpose models pre-trained on broad data and adaptable to many downstream tasks.",
  difficulty: "easy",
  tags: ["foundation-model"],
});

add({
  id: "aws-off-004",
  source: "aws-official-practice",
  topic: "Fundamentals of Generative AI",
  subtopic: "SageMaker JumpStart",
  question:
    "A financial company wants to use an open source foundation model (FM) to evaluate if credit contracts adhere to compliance rules. The company wants to reduce human effort on audits. Which AWS service will meet these requirements?",
  options: [
    "Amazon SageMaker JumpStart",
    "Amazon Textract",
    "Amazon Kendra",
    "Amazon Q Business",
  ],
  correctAnswer: "Amazon SageMaker JumpStart",
  explanation:
    "JumpStart provides access to open-source FMs that can be customized/deployed for specialized evaluation tasks.",
  difficulty: "medium",
  confusionPoints: ["Bedrock vs SageMaker", "JumpStart vs Bedrock"],
  tags: ["jumpstart", "open-source-fm"],
});

add({
  id: "aws-off-005",
  source: "aws-official-practice",
  topic: "Applications of Foundation Models",
  subtopic: "Customization tradeoffs",
  question:
    "A company is building a generative AI application by using a foundation model (FM). The company decides to customize its own FM by using proprietary datasets instead of using a pre-trained FM. What are the tradeoffs of customizing the FM? (Select TWO.)",
  options: [
    "Increased risk of hallucination",
    "Reduced accuracy",
    "Higher latency",
    "Higher cost",
    "Higher implementation complexity",
  ],
  correctAnswer: ["Higher cost", "Higher implementation complexity"],
  explanation:
    "Training/customizing your own FM increases cost and implementation complexity versus using a pre-trained FM.",
  difficulty: "medium",
  tags: ["fine-tuning", "tradeoffs"],
});

add({
  id: "aws-off-006",
  source: "aws-official-practice",
  topic: "Applications of Foundation Models",
  subtopic: "Prompt engineering",
  question:
    "A marketing company wants to generate personalized product descriptions for an ecommerce client's website. Which prompt engineering technique will meet these requirements with the LEAST operational effort?",
  options: [
    "Few-shot prompting with examples of well-written product descriptions",
    "Zero-shot prompting without any examples",
    "Fine-tuning to optimize the descriptions based on customer engagement metrics",
    "Continued pre-training on a different domain",
  ],
  correctAnswer: "Few-shot prompting with examples of well-written product descriptions",
  explanation:
    "Few-shot gives quality guidance with low operational effort versus fine-tuning or continued pre-training. Zero-shot may be less reliable for personalized quality.",
  difficulty: "medium",
  confusionPoints: ["zero-shot vs few-shot", "prompting vs fine-tuning"],
  tags: ["prompt-engineering", "few-shot"],
});

add({
  id: "aws-off-007",
  source: "aws-official-practice",
  topic: "Applications of Foundation Models",
  subtopic: "Fine-tuning",
  question: "What is a valid data format for instruction-based fine-tuning?",
  options: [
    "Images that are labeled with categories",
    "Playlists that are curated with recommended music",
    "Prompt-response text pairs",
    "Audio files with transcriptions",
  ],
  correctAnswer: "Prompt-response text pairs",
  explanation: "Instruction fine-tuning uses prompt–response pairs so the model learns to follow instructions.",
  difficulty: "easy",
  tags: ["fine-tuning"],
});

add({
  id: "aws-off-008",
  source: "aws-official-practice",
  topic: "Applications of Foundation Models",
  subtopic: "Evaluation",
  question:
    "A company wants to assess the performance of a foundation model (FM) for text generation. Which technique or metric will meet these requirements?",
  options: [
    "Reinforcement learning",
    "F1 score",
    "Recall-Oriented Understudy for Gisting Evaluation (ROUGE)",
    "Fine-tuning",
  ],
  correctAnswer: "Recall-Oriented Understudy for Gisting Evaluation (ROUGE)",
  explanation: "ROUGE is commonly used to evaluate text generation / summarization quality.",
  difficulty: "medium",
  tags: ["evaluation", "rouge"],
});

add({
  id: "aws-off-009",
  source: "aws-official-practice",
  topic: "Guidelines for Responsible AI",
  subtopic: "Model Cards",
  question:
    "A company uses Amazon SageMaker for its ML models. The company wants model owners to create a record of model information including intended uses, risk ratings, training details, and evaluation results. Which SageMaker feature will meet these requirements?",
  options: [
    "SageMaker Role Manager",
    "SageMaker Model Cards",
    "SageMaker Model Dashboard",
    "SageMaker Model Monitor",
  ],
  correctAnswer: "SageMaker Model Cards",
  explanation:
    "Model Cards document intended use, training details, evaluation results, and risk information.",
  difficulty: "easy",
  confusionPoints: ["Model Cards vs Model Monitor", "Model Cards vs Model Dashboard"],
  tags: ["governance", "model-cards"],
});

add({
  id: "aws-off-010",
  source: "aws-official-practice",
  topic: "Security, Compliance, and Governance",
  subtopic: "IAM",
  question:
    "A company is deploying a solution on AWS to enhance its knowledge base with semantic search capabilities and plans to integrate with Amazon Bedrock. Which AWS service can the company use to secure access to Amazon Bedrock?",
  options: [
    "Amazon Macie",
    "Amazon Rekognition",
    "AWS Identity and Access Management (IAM)",
    "AWS Config",
  ],
  correctAnswer: "AWS Identity and Access Management (IAM)",
  explanation: "IAM controls who can invoke Bedrock APIs and with what permissions.",
  difficulty: "easy",
  tags: ["iam", "bedrock-security"],
});

add({
  id: "aws-off-011",
  source: "aws-official-practice",
  topic: "Security, Compliance, and Governance",
  subtopic: "CloudTrail",
  question:
    "A company wants to record API calls made to Amazon Bedrock for compliance, including the API call, the user who made the call, and the time. Which AWS service will meet these requirements?",
  options: ["Amazon Inspector", "Amazon CloudWatch", "AWS Trusted Advisor", "AWS CloudTrail"],
  correctAnswer: "AWS CloudTrail",
  explanation: "CloudTrail records API calls with caller identity and timestamp for auditing/compliance.",
  difficulty: "easy",
  confusionPoints: ["CloudTrail vs CloudWatch"],
  tags: ["cloudtrail", "compliance"],
});

add({
  id: "aws-off-012",
  source: "aws-official-practice",
  topic: "Fundamentals of AI and ML",
  subtopic: "Overfitting",
  question:
    "A data scientist notices that a model has high accuracy on training data, but has low accuracy on testing data. What is causing these results?",
  options: ["Not enough training time", "Underfitting", "Too much training data", "Overfitting"],
  correctAnswer: "Overfitting",
  explanation:
    "High train / low test accuracy is the classic definition of overfitting (high variance).",
  difficulty: "easy",
  confusionPoints: ["overfitting vs underfitting"],
  tags: ["bias-variance"],
});

add({
  id: "aws-off-013",
  source: "aws-official-practice",
  topic: "Fundamentals of Generative AI",
  subtopic: "Limitations",
  question:
    "A company wants to use generative AI to create product descriptions on its website. What is a limitation of generative AI that the company should be aware of?",
  options: [
    "Generative AI models might produce biased or inappropriate content that requires human review and editing.",
    "Generative AI cannot handle the large volumes of data that is required for product descriptions.",
    "Generative AI cannot generate text in the multiple languages that is required for an ecommerce website.",
    "Generative AI models lack the ability to understand and incorporate product specifications and details.",
  ],
  correctAnswer:
    "Generative AI models might produce biased or inappropriate content that requires human review and editing.",
  explanation:
    "A key GenAI limitation is biased/inappropriate/hallucinated content requiring human review.",
  difficulty: "easy",
  tags: ["limitations", "responsible-ai"],
});

add({
  id: "aws-off-014",
  source: "aws-official-practice",
  topic: "Applications of Foundation Models",
  subtopic: "RAG",
  question:
    "A company wants to increase the consistency and quality of LLM responses by providing the model with access to external sources of knowledge. Which technique will meet the requirement with the LEAST development effort?",
  options: [
    "Fine-tuning",
    "Retrieval augmented generation (RAG)",
    "In-context learning",
    "Prompt engineering",
  ],
  correctAnswer: "Retrieval augmented generation (RAG)",
  explanation:
    "RAG connects the model to external knowledge at inference time, improving grounded answers with less effort than fine-tuning.",
  difficulty: "medium",
  confusionPoints: ["RAG vs fine-tuning"],
  tags: ["rag", "knowledge-bases"],
});

// ---------------------------------------------------------------------------
// COURSE PDF — grounded in Stephane Maarek slides v19
// ---------------------------------------------------------------------------

const pdfQs = [
  {
    id: "pdf-001",
    page: 10,
    topic: "Introduction to AI",
    question: "According to the course, Artificial Intelligence is best described as:",
    options: [
      "A field of computer science dedicated to solving problems commonly associated with human intelligence",
      "Only the study of neural networks for image generation",
      "A cloud billing optimization technique",
      "A replacement for all software engineering",
    ],
    correct: "A field of computer science dedicated to solving problems commonly associated with human intelligence",
    explanation: "Slide: AI solves problems associated with human intelligence (image creation/recognition, speech-to-text, learning).",
  },
  {
    id: "pdf-002",
    page: 50,
    topic: "Fundamentals of Generative AI",
    subtopic: "Foundation models",
    question: "What does the course say about foundation models?",
    options: [
      "They are trained on a wide variety of input data and may cost tens of millions of dollars to train",
      "They only work on structured tabular data",
      "They never require any training data",
      "They can only be hosted on Amazon EC2",
    ],
    correct:
      "They are trained on a wide variety of input data and may cost tens of millions of dollars to train",
    explanation: "Foundation Model slide: trained on wide variety of input data; may cost tens of millions to train.",
  },
  {
    id: "pdf-003",
    page: 61,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Amazon Bedrock",
    question: "Which statement about Amazon Bedrock matches the course material?",
    options: [
      "Bedrock provides a unified API to access foundation models, plus features like Knowledge Bases (RAG) and fine-tuning",
      "Bedrock is only used for training custom CNNs from scratch on EC2",
      "Bedrock replaces IAM for all AWS accounts",
      "Bedrock is an S3 storage class",
    ],
    correct:
      "Bedrock provides a unified API to access foundation models, plus features like Knowledge Bases (RAG) and fine-tuning",
    explanation: "Bedrock slide shows FMs, playground, knowledge bases (RAG), fine-tuning, unified API.",
    confusionPoints: ["Bedrock vs SageMaker"],
  },
  {
    id: "pdf-004",
    page: 64,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Fine-tuning",
    question: "According to the course, fine-tuning a model on Amazon Bedrock:",
    options: [
      "Adapts a copy of a foundation model with your own data and changes the weights of the base FM; training data must be in a specific format in Amazon S3",
      "Only changes the prompt template and never model weights",
      "Requires deploying the model on your laptop",
      "Is available for every foundation model without exception",
    ],
    correct:
      "Adapts a copy of a foundation model with your own data and changes the weights of the base FM; training data must be in a specific format in Amazon S3",
    explanation: "Fine-tuning slide: changes weights; data format + S3; not all models can be fine-tuned.",
    confusionPoints: ["RAG vs fine-tuning"],
  },
  {
    id: "pdf-005",
    page: 78,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "RAG",
    question: "What is Retrieval-Augmented Generation (RAG) as defined in the course?",
    options: [
      "Allowing a foundation model to reference a data source outside of its training data",
      "Deleting all embeddings to reduce cost",
      "Training a model only on unlabeled images",
      "A type of EC2 instance family",
    ],
    correct: "Allowing a foundation model to reference a data source outside of its training data",
    explanation: "RAG slide: FM references external data source; used when real-time/external data is needed.",
    confusionPoints: ["RAG vs fine-tuning", "embeddings vs generated text"],
  },
  {
    id: "pdf-006",
    page: 80,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Vector databases",
    question:
      "Which vector database options does the course list for Amazon Bedrock RAG embeddings?",
    options: [
      "OpenSearch Service, Aurora, Neptune Analytics, and S3 Vectors (with Titan embeddings)",
      "Only DynamoDB Streams",
      "Only Amazon SQS",
      "Only Amazon CloudFront",
    ],
    correct: "OpenSearch Service, Aurora, Neptune Analytics, and S3 Vectors (with Titan embeddings)",
    explanation: "RAG Vector Databases slide lists OpenSearch, Aurora, Neptune Analytics, S3 Vectors, Titan.",
    confusionPoints: ["vector search vs keyword search"],
  },
  {
    id: "pdf-007",
    page: 88,
    topic: "Responsible AI, Security, Compliance and Governance",
    subtopic: "Guardrails",
    question: "Amazon Bedrock Guardrails are used to:",
    options: [
      "Control interactions with FMs by filtering harmful content, removing PII, reducing hallucinations, and blocking topics",
      "Automatically provision EC2 Auto Scaling groups",
      "Replace CloudTrail logging",
      "Train foundation models from scratch",
    ],
    correct:
      "Control interactions with FMs by filtering harmful content, removing PII, reducing hallucinations, and blocking topics",
    explanation: "Guardrails slide: filter harmful content, remove PII, reduce hallucinations, blocked topics.",
    tags: ["guardrails"],
  },
  {
    id: "pdf-008",
    page: 89,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Agents",
    question: "According to the course, Amazon Bedrock Agents:",
    options: [
      "Manage multi-step tasks, use action groups, integrate with systems/APIs, and can leverage RAG when needed",
      "Are only used for billing invoices",
      "Cannot integrate with external APIs",
      "Replace Amazon S3 entirely",
    ],
    correct:
      "Manage multi-step tasks, use action groups, integrate with systems/APIs, and can leverage RAG when needed",
    explanation: "Agents slide: multi-step tasks, action groups, integrations, RAG when necessary.",
  },
  {
    id: "pdf-009",
    page: 100,
    topic: "Prompt Engineering",
    question: "Improved prompting technique in the course consists of which components?",
    options: [
      "Instructions, Context, Input data, and Output Indicator",
      "Only temperature and top-p",
      "Only VPC and security groups",
      "Only batch size and epochs",
    ],
    correct: "Instructions, Context, Input data, and Output Indicator",
    explanation: "Prompt Engineering slide lists Instructions, Context, Input data, Output Indicator.",
  },
  {
    id: "pdf-010",
    page: 107,
    topic: "Prompt Engineering",
    subtopic: "Zero-shot",
    question: "What is zero-shot prompting per the course?",
    options: [
      "Presenting a task without providing examples, relying on the model's general knowledge",
      "Providing dozens of labeled examples before every request",
      "Fine-tuning the model weights on S3 data",
      "Using only reinforcement learning from human feedback",
    ],
    correct: "Presenting a task without providing examples, relying on the model's general knowledge",
    explanation: "Zero-shot slide: no examples; rely on general knowledge.",
    confusionPoints: ["zero-shot vs few-shot"],
  },
  {
    id: "pdf-011",
    page: 108,
    topic: "Prompt Engineering",
    subtopic: "Few-shot",
    question: "Few-shot prompting means:",
    options: [
      "Providing examples of a task to guide the model's output (one example = one-shot)",
      "Never providing any examples",
      "Deleting the system prompt",
      "Only using image embeddings",
    ],
    correct: "Providing examples of a task to guide the model's output (one example = one-shot)",
    explanation: "Few-shots slide: provide examples; one example called one-shot/single-shot.",
    confusionPoints: ["zero-shot vs few-shot"],
  },
  {
    id: "pdf-012",
    page: 109,
    topic: "Prompt Engineering",
    subtopic: "Chain of Thought",
    question: "Chain of Thought prompting is described as:",
    options: [
      "Dividing the task into a sequence of reasoning steps (e.g., “Think step by step”), usable with zero-shot or few-shot",
      "A method to compress model weights",
      "A CloudWatch alarm type",
      "An S3 lifecycle rule",
    ],
    correct:
      "Dividing the task into a sequence of reasoning steps (e.g., “Think step by step”), usable with zero-shot or few-shot",
    explanation: "CoT slide: sequence of reasoning steps; can combine with zero/few-shot.",
  },
  {
    id: "pdf-013",
    page: 116,
    topic: "Amazon Q",
    subtopic: "Q Business",
    question: "Amazon Q Business is described in the course as:",
    options: [
      "A fully managed GenAI assistant for employees based on company knowledge/data to answer questions, summarize, generate content, and automate tasks",
      "A physical hardware appliance sold by AWS",
      "Only an IDE plugin for Python",
      "A replacement for Amazon VPC",
    ],
    correct:
      "A fully managed GenAI assistant for employees based on company knowledge/data to answer questions, summarize, generate content, and automate tasks",
    explanation: "Amazon Q Business slide: employee GenAI assistant on company knowledge.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
  },
  {
    id: "pdf-014",
    page: 122,
    topic: "Amazon Q",
    subtopic: "Q Developer",
    question:
      "Based on the course section structure, Amazon Q Developer is primarily associated with:",
    options: [
      "Developer productivity features such as coding assistance (IDE extensions are covered in the Q Developer section)",
      "Finding PII in S3 buckets",
      "Translating spoken audio to text only",
      "Provisioning Glacier Deep Archive vaults",
    ],
    correct:
      "Developer productivity features such as coding assistance (IDE extensions are covered in the Q Developer section)",
    explanation: "Course covers Amazon Q Developer and IDE extensions separately from Q Business.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
    status: "ok",
  },
  {
    id: "pdf-015",
    page: 135,
    topic: "AI and Machine Learning (ML)",
    question: "Machine Learning, in the course framing, is about models that:",
    options: [
      "Learn patterns from data to make predictions or decisions without being explicitly programmed for every rule",
      "Only run SQL queries",
      "Only store files in S3",
      "Only render HTML pages",
    ],
    correct:
      "Learn patterns from data to make predictions or decisions without being explicitly programmed for every rule",
    explanation: "Course ML section contrasts AI vs ML and describes learning from data.",
    status: "ok",
  },
  {
    id: "pdf-016",
    page: 150,
    topic: "AI and Machine Learning (ML)",
    subtopic: "Supervised learning",
    question: "Supervised learning per the course:",
    options: [
      "Learns a mapping function to predict outputs for new unseen inputs and needs labeled data",
      "Never uses labels",
      "Only works without any training dataset",
      "Is identical to unsupervised clustering with no targets",
    ],
    correct:
      "Learns a mapping function to predict outputs for new unseen inputs and needs labeled data",
    explanation: "Supervised Learning slide: mapping function; needs labeled data; regression/classification examples.",
  },
  {
    id: "pdf-017",
    page: 160,
    topic: "AI and Machine Learning (ML)",
    subtopic: "Anomaly detection",
    question:
      "The course fraud-detection anomaly example aims to:",
    options: [
      "Identify transactions that deviate significantly from typical behavior (e.g., Isolation Forest)",
      "Translate text between languages",
      "Generate marketing images",
      "Provision IAM users",
    ],
    correct:
      "Identify transactions that deviate significantly from typical behavior (e.g., Isolation Forest)",
    explanation: "Unsupervised anomaly detection slide: fraud scenario flags outliers.",
  },
  {
    id: "pdf-018",
    page: 174,
    topic: "AI and Machine Learning (ML)",
    subtopic: "Bias and variance",
    question: "High variance / overfitting in the course means:",
    options: [
      "The model is very sensitive to training data changes and performs well on training but poorly on unseen test data",
      "The model always underfits the training set",
      "The model ignores all features",
      "The model has perfect test accuracy by definition",
    ],
    correct:
      "The model is very sensitive to training data changes and performs well on training but poorly on unseen test data",
    explanation: "Bias and Variance slide defines high variance as overfitting.",
    confusionPoints: ["overfitting vs underfitting"],
  },
  {
    id: "pdf-019",
    page: 196,
    topic: "AWS Managed AI Services",
    subtopic: "Comprehend",
    question: "Amazon Comprehend is used for:",
    options: [
      "NLP insights in text: language, key phrases, entities, sentiment, topics",
      "Real-time video transcoding only",
      "Object storage lifecycle policies",
      "VPN connectivity",
    ],
    correct: "NLP insights in text: language, key phrases, entities, sentiment, topics",
    explanation: "Comprehend slide: NLP — language, entities, sentiment, topic organization.",
    confusionPoints: ["Comprehend vs Translate", "Rekognition vs Textract"],
  },
  {
    id: "pdf-020",
    page: 200,
    topic: "AWS Managed AI Services",
    subtopic: "Translate",
    question: "Amazon Translate is primarily for:",
    options: [
      "Natural and accurate language translation to localize content and translate large volumes of text",
      "Detecting faces in images",
      "Training custom reinforcement learning robots",
      "Issuing SSL certificates",
    ],
    correct:
      "Natural and accurate language translation to localize content and translate large volumes of text",
    explanation: "Translate slide: language translation / localization.",
    confusionPoints: ["Transcribe vs Translate"],
  },
  {
    id: "pdf-021",
    page: 211,
    topic: "AWS Managed AI Services",
    subtopic: "Personalize",
    question: "Amazon Personalize helps you:",
    options: [
      "Build apps with real-time personalized recommendations using the same technology as Amazon.com, without building ML from scratch",
      "Scan EC2 for CVEs only",
      "Store Glacier archives",
      "Create VPC peering connections",
    ],
    correct:
      "Build apps with real-time personalized recommendations using the same technology as Amazon.com, without building ML from scratch",
    explanation: "Personalize slide: real-time recommendations; same tech as Amazon.com.",
  },
  {
    id: "pdf-022",
    page: 226,
    topic: "Amazon SageMaker",
    question: "Amazon SageMaker AI is described as:",
    options: [
      "A fully managed service for developers/data scientists to build, train, tune, and apply ML models",
      "Only a chat UI with no training capability",
      "An email marketing tool",
      "A DNS service",
    ],
    correct:
      "A fully managed service for developers/data scientists to build, train, tune, and apply ML models",
    explanation: "SageMaker AI slide: build/train/tune/apply ML models end-to-end.",
    confusionPoints: ["Bedrock vs SageMaker"],
  },
  {
    id: "pdf-023",
    page: 243,
    topic: "Amazon SageMaker",
    subtopic: "Clarify",
    question: "SageMaker Clarify is used to:",
    options: [
      "Compare models, explain model outputs, and detect bias (including FM evaluation aspects in the course)",
      "Only store model artifacts in S3",
      "Only create VPC endpoints",
      "Only translate documents",
    ],
    correct:
      "Compare models, explain model outputs, and detect bias (including FM evaluation aspects in the course)",
    explanation: "Clarify + summary slides: compare models, explain outputs, detect bias.",
    confusionPoints: ["Clarify vs Model Monitor"],
  },
  {
    id: "pdf-024",
    page: 247,
    topic: "Amazon SageMaker",
    subtopic: "Ground Truth",
    question: "SageMaker Ground Truth supports:",
    options: [
      "RLHF / human feedback, data labeling/annotation, and human review using MTurk, employees, or vendors",
      "Only automatic CloudTrail encryption",
      "Only Route 53 health checks",
      "Only Cost Explorer reports",
    ],
    correct:
      "RLHF / human feedback, data labeling/annotation, and human review using MTurk, employees, or vendors",
    explanation: "Ground Truth slide: RLHF, labeling, human reviewers.",
  },
  {
    id: "pdf-025",
    page: 250,
    topic: "Amazon SageMaker",
    subtopic: "Model Monitor",
    question: "SageMaker Model Monitor is for:",
    options: [
      "Monitoring model quality in production (continuous or scheduled) and alerting on deviations/drift",
      "Writing IAM policy documents",
      "Generating speech from text",
      "Building static websites",
    ],
    correct:
      "Monitoring model quality in production (continuous or scheduled) and alerting on deviations/drift",
    explanation: "Model Monitor slide: production quality monitoring and drift alerts (loan example).",
    confusionPoints: ["Clarify vs Model Monitor", "Model Cards vs Model Monitor"],
  },
  {
    id: "pdf-026",
    page: 254,
    topic: "Amazon SageMaker",
    subtopic: "JumpStart",
    question: "SageMaker JumpStart provides:",
    options: [
      "An ML hub of pre-trained FMs and other models that can be customized and deployed on SageMaker with full deployment control",
      "Only a free public CDN",
      "Only Macie findings",
      "Only Trusted Advisor checks",
    ],
    correct:
      "An ML hub of pre-trained FMs and other models that can be customized and deployed on SageMaker with full deployment control",
    explanation: "JumpStart slide: FM hub, customize, deploy on SageMaker.",
    confusionPoints: ["JumpStart vs Bedrock"],
  },
  {
    id: "pdf-027",
    page: 256,
    topic: "Amazon SageMaker",
    subtopic: "Canvas",
    question: "SageMaker Canvas lets you:",
    options: [
      "Build ML models with a visual no-code interface, including ready-to-use models and AutoML",
      "Only edit CloudFormation YAML by hand",
      "Only manage Route 53 records",
      "Only create KMS keys",
    ],
    correct:
      "Build ML models with a visual no-code interface, including ready-to-use models and AutoML",
    explanation: "Canvas slide: visual interface, no coding, ready-to-use + AutoML.",
  },
  {
    id: "pdf-028",
    page: 265,
    topic: "Responsible AI, Security, Compliance and Governance",
    subtopic: "Dimensions",
    question: "Which are listed as core dimensions of responsible AI in the course?",
    options: [
      "Fairness, explainability, privacy/security, transparency, veracity/robustness, governance, safety, controllability",
      "Only cost optimization and reserved instances",
      "Only Availability Zones and Regions",
      "Only instance families and AMIs",
    ],
    correct:
      "Fairness, explainability, privacy/security, transparency, veracity/robustness, governance, safety, controllability",
    explanation: "Core dimensions slide lists these responsible AI dimensions.",
  },
  {
    id: "pdf-029",
    page: 266,
    topic: "Responsible AI, Security, Compliance and Governance",
    subtopic: "AWS services mapping",
    question:
      "Which mapping matches the course “Responsible AI – AWS Services” slide?",
    options: [
      "Guardrails for content/PII; Clarify for bias/explainability; Model Monitor for production quality; A2I for human review; Model Cards for governance docs",
      "Inspector for generating LLM text",
      "Polly for detecting S3 PII",
      "Personalize for CloudTrail API auditing",
    ],
    correct:
      "Guardrails for content/PII; Clarify for bias/explainability; Model Monitor for production quality; A2I for human review; Model Cards for governance docs",
    explanation: "Responsible AI AWS Services slide maps these tools to responsible AI needs.",
  },
  {
    id: "pdf-030",
    page: 350,
    topic: "AWS Security Services & More",
    question: "Per the security section summary, Macie is used to:",
    options: [
      "Find sensitive data (e.g., PII) in Amazon S3 buckets",
      "Translate documents",
      "Generate product recommendations",
      "Train reinforcement learning robots",
    ],
    correct: "Find sensitive data (e.g., PII) in Amazon S3 buckets",
    explanation: "Security summary: Macie finds sensitive/PII data in S3.",
  },
  {
    id: "pdf-031",
    page: 350,
    topic: "AWS Security Services & More",
    question: "Per the security section summary, Inspector is used to:",
    options: [
      "Find software vulnerabilities in EC2, ECR images, and Lambda functions",
      "Create personalized product rankings",
      "Host static websites",
      "Manage DNS records",
    ],
    correct: "Find software vulnerabilities in EC2, ECR images, and Lambda functions",
    explanation: "Security summary + Inspector slide: EC2, containers/ECR, Lambda CVE scanning.",
  },
  {
    id: "pdf-032",
    page: 349,
    topic: "AWS Security Services & More",
    question: "VPC Endpoints powered by AWS PrivateLink are described as providing:",
    options: [
      "Private access to AWS services within a VPC (e.g., private access paths for services like Bedrock/S3 patterns in the course)",
      "Public internet acceleration only",
      "Automatic model fine-tuning",
      "Speech synthesis",
    ],
    correct:
      "Private access to AWS services within a VPC (e.g., private access paths for services like Bedrock/S3 patterns in the course)",
    explanation: "Security summary: VPC Endpoint / PrivateLink for private access to AWS services.",
  },
  {
    id: "pdf-033",
    page: 68,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Fine-tuning types",
    question: "How does the course contrast Supervised Fine Tuning vs Reinforcement Fine Tuning?",
    options: [
      "Supervised provides input and output prompts; Reinforcement scores generated outputs (reward-style feedback)",
      "They are identical processes with different names",
      "Reinforcement never generates outputs",
      "Supervised only works on audio files",
    ],
    correct:
      "Supervised provides input and output prompts; Reinforcement scores generated outputs (reward-style feedback)",
    explanation: "SFT vs RFT slide: supervised uses provided output; reinforcement uses scored generated outputs.",
  },
  {
    id: "pdf-034",
    page: 72,
    topic: "Amazon Bedrock and GenAI",
    subtopic: "Model evaluation",
    question: "Amazon Bedrock automatic model evaluation can use metrics such as:",
    options: [
      "Statistical methods like BERTScore and F1 on tasks such as summarization, Q&A, classification, and open-ended generation",
      "Only EC2 CPU credit balance",
      "Only S3 storage class transitions",
      "Only IAM password age",
    ],
    correct:
      "Statistical methods like BERTScore and F1 on tasks such as summarization, Q&A, classification, and open-ended generation",
    explanation: "Evaluating a Model slide lists task types and metrics like BERTScore, F1.",
  },
  {
    id: "pdf-035",
    page: 205,
    topic: "AWS Managed AI Services",
    subtopic: "Polly",
    question: "Amazon Polly advanced features in the course include:",
    options: [
      "Lexicons (custom pronunciations), SSML, speech marks for lip-sync/highlighting, and multiple voice engines",
      "Only object detection bounding boxes",
      "Only VPC flow logs",
      "Only Cost Anomaly Detection",
    ],
    correct:
      "Lexicons (custom pronunciations), SSML, speech marks for lip-sync/highlighting, and multiple voice engines",
    explanation: "Polly Advanced Features slide covers lexicons, SSML, speech marks, voice engines.",
    confusionPoints: ["Transcribe vs Translate", "Polly vs Transcribe"],
  },
  {
    id: "pdf-036",
    page: 116,
    topic: "Amazon Q",
    subtopic: "Q Business",
    question: "According to the course, Amazon Q Business is built on:",
    options: [
      "Amazon Bedrock (but you can’t choose the underlying FM)",
      "Only Amazon EC2 GPU clusters you manage yourself",
      "Only Amazon Rekognition Custom Labels",
      "Only AWS Snowball Edge",
    ],
    correct: "Amazon Bedrock (but you can’t choose the underlying FM)",
    explanation: "Q Business slide: built on Bedrock; you can’t choose the underlying FM.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
  },
  {
    id: "pdf-037",
    page: 122,
    topic: "Amazon Q",
    subtopic: "Q Developer",
    question: "Amazon Q Developer can help with:",
    options: [
      "AWS documentation/service selection questions, account resources, CLI suggestions, bill analysis, and troubleshooting",
      "Only Glacier vault lock policies",
      "Only Macie findings export",
      "Only physical data center tours",
    ],
    correct:
      "AWS documentation/service selection questions, account resources, CLI suggestions, bill analysis, and troubleshooting",
    explanation: "Q Developer slide lists AWS docs, account resources, CLI, billing, troubleshooting.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
  },
  {
    id: "pdf-038",
    page: 154,
    topic: "AI and Machine Learning (ML)",
    subtopic: "Feature engineering",
    question: "Feature engineering is defined in the course as:",
    options: [
      "Using domain knowledge to select and transform raw data into meaningful features to enhance model performance",
      "Only encrypting S3 buckets",
      "Only choosing an EC2 instance type",
      "Only writing CloudTrail filters",
    ],
    correct:
      "Using domain knowledge to select and transform raw data into meaningful features to enhance model performance",
    explanation: "Feature Engineering slide: select/transform raw data into meaningful features.",
  },
  {
    id: "pdf-039",
    page: 182,
    topic: "AI and Machine Learning (ML)",
    subtopic: "Regression metrics",
    question: "MAE, MAPE, RMSE, and R² are used in the course for evaluating:",
    options: [
      "Models that predict a continuous value (regressions)",
      "Only multi-label image classification accuracy",
      "Only IAM policy syntax",
      "Only DNS TTL values",
    ],
    correct: "Models that predict a continuous value (regressions)",
    explanation: "Regression Metrics slide: MAE/MAPE/RMSE/R² for continuous predictions.",
  },
  {
    id: "pdf-040",
    page: 193,
    topic: "AI and Machine Learning (ML)",
    question: "When is ML NOT appropriate according to the course?",
    options: [
      "For deterministic problems where the solution can be computed directly with adapted code (e.g., simple probability from a known deck of cards)",
      "Whenever any spreadsheet exists",
      "Whenever S3 is used",
      "Whenever the dataset has more than 10 rows",
    ],
    correct:
      "For deterministic problems where the solution can be computed directly with adapted code (e.g., simple probability from a known deck of cards)",
    explanation: "Course slide: deterministic computable problems are better solved with code than ML.",
  },
  {
    id: "pdf-041",
    page: 201,
    topic: "AWS Managed AI Services",
    subtopic: "Transcribe",
    question: "Amazon Transcribe is primarily used to:",
    options: [
      "Convert speech to text using ASR, with options like PII redaction and automatic language identification",
      "Translate text between languages only",
      "Detect objects in images only",
      "Provision VPCs",
    ],
    correct:
      "Convert speech to text using ASR, with options like PII redaction and automatic language identification",
    explanation: "Transcribe slide: speech-to-text ASR, PII redaction, language ID.",
    confusionPoints: ["Transcribe vs Translate", "Polly vs Transcribe"],
  },
  {
    id: "pdf-042",
    page: 206,
    topic: "AWS Managed AI Services",
    subtopic: "Rekognition",
    question: "Amazon Rekognition helps you:",
    options: [
      "Find objects, people, text, and scenes in images/videos, plus facial analysis/search and content moderation use cases",
      "Only translate PDFs",
      "Only fine-tune Bedrock FMs",
      "Only manage KMS keys",
    ],
    correct:
      "Find objects, people, text, and scenes in images/videos, plus facial analysis/search and content moderation use cases",
    explanation: "Rekognition slide: objects/people/text/scenes; facial analysis; moderation.",
    confusionPoints: ["Rekognition vs Textract"],
  },
  {
    id: "pdf-043",
    page: 210,
    topic: "AWS Managed AI Services",
    subtopic: "Lex",
    question: "Amazon Lex is used to:",
    options: [
      "Build chatbots using voice and text that understand intents, collect slots, and can invoke Lambda to fulfill intents",
      "Store vector embeddings only",
      "Scan ECR for CVEs only",
      "Host static websites only",
    ],
    correct:
      "Build chatbots using voice and text that understand intents, collect slots, and can invoke Lambda to fulfill intents",
    explanation: "Lex slide: chatbots, intents, slots, Lambda fulfillment.",
  },
  {
    id: "pdf-044",
    page: 232,
    topic: "Amazon SageMaker",
    subtopic: "Deployment",
    question: "According to the course deployment comparison, real-time inference is best when you need:",
    options: [
      "Fast near-instant predictions for web/mobile apps with low latency",
      "Only monthly batch scoring with no latency needs",
      "Only offline CSV exports with no endpoint",
      "Only Glacier restores",
    ],
    correct: "Fast near-instant predictions for web/mobile apps with low latency",
    explanation: "Deployment comparison slide: real-time = low latency for web/mobile apps.",
  },
  {
    id: "pdf-045",
    page: 248,
    topic: "Amazon SageMaker",
    subtopic: "Governance",
    question: "SageMaker Role Manager is described as helping you:",
    options: [
      "Define roles for personas such as data scientists and MLOps engineers",
      "Generate speech from text",
      "Translate documents",
      "Detect celebrity faces",
    ],
    correct: "Define roles for personas such as data scientists and MLOps engineers",
    explanation: "ML Governance slide: Role Manager defines persona roles.",
  },
  {
    id: "pdf-046",
    page: 251,
    topic: "Amazon SageMaker",
    subtopic: "Model Registry",
    question: "SageMaker Model Registry provides:",
    options: [
      "A centralized repository to track, manage, version, approve, and share ML models",
      "Only Polly voice lexicons",
      "Only S3 Intelligent-Tiering rules",
      "Only Route 53 latency policies",
    ],
    correct:
      "A centralized repository to track, manage, version, approve, and share ML models",
    explanation: "Model Registry slide: centralized versioning, metadata, approval, sharing.",
  },
  {
    id: "pdf-047",
    page: 252,
    topic: "Amazon SageMaker",
    subtopic: "Pipelines",
    question: "SageMaker Pipelines is described as:",
    options: [
      "A CI/CD workflow service that automates building, training, testing, and deploying ML models",
      "A speech-to-text engine",
      "An image moderation API only",
      "A compliance report download portal",
    ],
    correct:
      "A CI/CD workflow service that automates building, training, testing, and deploying ML models",
    explanation: "Pipelines slide: CI/CD for ML; automate build/train/test/deploy.",
  },
  {
    id: "pdf-048",
    page: 270,
    topic: "Responsible AI, Security, Compliance and Governance",
    subtopic: "Explainability",
    question: "Partial Dependence Plots (PDP) help with:",
    options: [
      "Showing how a single feature influences predictions while holding other features constant (useful for black-box interpretability)",
      "Encrypting EBS volumes",
      "Allocating Elastic IPs",
      "Creating CloudFront distributions",
    ],
    correct:
      "Showing how a single feature influences predictions while holding other features constant (useful for black-box interpretability)",
    explanation: "PDP slide: feature influence; interpretability/explainability for black-box models.",
  },
  {
    id: "pdf-049",
    page: 351,
    topic: "Security, Compliance, and Governance",
    question: "Per the course “AWS Services for Bedrock” slide, Guardrails for Bedrock are used to:",
    options: [
      "Restrict topics, filter harmful content, and help ensure safety-policy compliance by analyzing user inputs",
      "Replace IAM completely",
      "Train custom CNNs on EC2 only",
      "Delete CloudTrail history",
    ],
    correct:
      "Restrict topics, filter harmful content, and help ensure safety-policy compliance by analyzing user inputs",
    explanation: "AWS Services for Bedrock slide maps Guardrails to topic restriction and harmful content filtering.",
  },
  {
    id: "pdf-050",
    page: 198,
    topic: "AWS Managed AI Services",
    subtopic: "NER",
    question: "Named Entity Recognition (NER) as described in the course:",
    options: [
      "Extracts predefined general-purpose entities like people, places, organizations, and dates from text",
      "Converts speech to speech only",
      "Creates VPC peering only",
      "Scans Lambda for CVEs only",
    ],
    correct:
      "Extracts predefined general-purpose entities like people, places, organizations, and dates from text",
    explanation: "NER slide: extract people, places, organizations, dates, etc.",
  },
];

for (const q of pdfQs) {
  add({
    id: q.id,
    source: "course-pdf",
    topic: q.topic,
    subtopic: q.subtopic,
    sourcePage: q.page,
    sourceSection: pages.find((p) => p.page === q.page)?.title,
    question: q.question,
    options: q.options,
    correctAnswer: q.correct,
    explanation: q.explanation,
    difficulty: "medium",
    confusionPoints: q.confusionPoints,
    tags: q.tags,
    status: q.status || "ok",
  });
}

// ---------------------------------------------------------------------------
// EXAM-LIKELY — high-frequency AIF-C01 patterns (exam guide + common scenarios)
// Tagged separately from PDF; explanations kept aligned with course where possible.
// ---------------------------------------------------------------------------

const likely = [
  {
    id: "likely-001",
    topic: "Applications of Foundation Models",
    question:
      "A company stores HR policies in Amazon S3 that change weekly. They want a Bedrock assistant to answer using the latest policies and reduce hallucinations. What approach best meets this need?",
    options: [
      "Use Retrieval-Augmented Generation (RAG) / Knowledge Bases over the S3 documents",
      "Increase temperature to make answers more creative",
      "Disable all logging",
      "Only use Amazon Inspector",
    ],
    correct: "Use Retrieval-Augmented Generation (RAG) / Knowledge Bases over the S3 documents",
    explanation:
      "RAG grounds answers in external up-to-date sources — a top AIF-C01 pattern and covered in the Bedrock RAG slides.",
    confusionPoints: ["RAG vs fine-tuning"],
    tags: ["rag", "hallucinations"],
  },
  {
    id: "likely-002",
    topic: "Responsible AI, Security, Compliance and Governance",
    question:
      "A bank must assess bias and explain credit-approval model predictions before deployment on SageMaker. Which feature should they use?",
    options: [
      "Amazon SageMaker Clarify",
      "Amazon Polly",
      "Amazon Personalize",
      "Amazon Translate",
    ],
    correct: "Amazon SageMaker Clarify",
    explanation: "Clarify detects bias and supports explainability — heavily tested and in the course responsible AI mapping.",
    confusionPoints: ["Clarify vs Model Monitor"],
  },
  {
    id: "likely-003",
    topic: "Responsible AI, Security, Compliance and Governance",
    question:
      "A fraud model on a real-time SageMaker endpoint must continuously detect data drift and performance degradation. Which feature fits?",
    options: [
      "SageMaker Model Monitor",
      "SageMaker JumpStart",
      "Amazon Rekognition",
      "Amazon Comprehend",
    ],
    correct: "SageMaker Model Monitor",
    explanation: "Model Monitor watches production quality/drift — classic exam scenario.",
    confusionPoints: ["Clarify vs Model Monitor"],
  },
  {
    id: "likely-004",
    topic: "Amazon Bedrock and GenAI",
    question:
      "A company needs a managed way to block harmful topics and redact PII in prompts/responses for Bedrock apps without custom filtering code. What should they use?",
    options: [
      "Amazon Bedrock Guardrails",
      "Amazon EC2 Auto Scaling",
      "Amazon S3 Glacier",
      "AWS Snowball",
    ],
    correct: "Amazon Bedrock Guardrails",
    explanation: "Guardrails filter harmful content, blocked topics, and PII — high-frequency exam topic.",
  },
  {
    id: "likely-005",
    topic: "Applications of Foundation Models",
    question:
      "Users try jailbreak-style prompts (“ignore previous instructions”) against a Bedrock assistant. Which Guardrails policy type is designed for this class of threat?",
    options: [
      "Prompt attacks filter",
      "S3 Intelligent-Tiering",
      "EC2 user data",
      "CloudFront signed cookies",
    ],
    correct: "Prompt attacks filter",
    explanation:
      "Common AIF-C01 Guardrails taxonomy: prompt attacks address jailbreak/injection attempts.",
    difficulty: "hard",
    tags: ["guardrails", "prompt-injection"],
  },
  {
    id: "likely-006",
    topic: "Amazon Q",
    question:
      "Employees need a GenAI assistant that answers from internal company knowledge bases. Developers need coding help in an IDE. Which pairing is correct?",
    options: [
      "Amazon Q Business for employees; Amazon Q Developer for developers/IDE",
      "Amazon Macie for both use cases",
      "Amazon Inspector for both use cases",
      "Amazon Personalize for both use cases",
    ],
    correct: "Amazon Q Business for employees; Amazon Q Developer for developers/IDE",
    explanation: "Classic confusion pair covered in the course Amazon Q section.",
    confusionPoints: ["Amazon Q Business vs Amazon Q Developer"],
  },
  {
    id: "likely-007",
    topic: "Amazon Bedrock and GenAI",
    question:
      "A team with little ML expertise wants API access to multiple FMs without managing servers. Another team wants full control deploying open-source FMs on managed ML infrastructure. Best pairing?",
    options: [
      "Amazon Bedrock for serverless FM API; SageMaker JumpStart for deployable open-source FMs with control",
      "Amazon Translate for both",
      "Amazon Polly for both",
      "AWS Artifact for both",
    ],
    correct:
      "Amazon Bedrock for serverless FM API; SageMaker JumpStart for deployable open-source FMs with control",
    explanation: "Core Bedrock vs JumpStart/SageMaker distinction — frequently tested.",
    confusionPoints: ["Bedrock vs SageMaker", "JumpStart vs Bedrock"],
  },
  {
    id: "likely-008",
    topic: "Applications of Foundation Models",
    question:
      "Which customization approach generally has the lowest development effort to give an LLM access to changing external knowledge?",
    options: ["RAG", "Full pre-training from scratch", "Building a new GPU cluster manually", "Replacing the FM every hour by hand"],
    correct: "RAG",
    explanation: "Official sample emphasizes RAG for external knowledge with least development effort vs fine-tuning.",
    confusionPoints: ["RAG vs fine-tuning"],
  },
  {
    id: "likely-009",
    topic: "AWS Managed AI Services",
    question:
      "Match the need: extract text from scanned PDFs; detect objects in images; convert speech to text; convert text to speech.",
    options: [
      "Textract; Rekognition; Transcribe; Polly",
      "Translate; Comprehend; Personalize; Forecast",
      "Inspector; Macie; Config; Artifact",
      "CloudTrail; CloudWatch; Config; Trusted Advisor",
    ],
    correct: "Textract; Rekognition; Transcribe; Polly",
    explanation: "Managed AI service matching — very common on AIF-C01 style questions.",
    confusionPoints: ["Rekognition vs Textract", "Transcribe vs Translate", "Polly vs Transcribe"],
  },
  {
    id: "likely-010",
    topic: "Security, Compliance, and Governance",
    question:
      "For private connectivity from a VPC application to Amazon Bedrock without traversing the public internet, which pattern fits the course security material?",
    options: [
      "VPC endpoint powered by AWS PrivateLink",
      "Public S3 website hosting",
      "Disable IAM entirely",
      "Use only security group egress 0.0.0.0/0 without private endpoints",
    ],
    correct: "VPC endpoint powered by AWS PrivateLink",
    explanation: "Course shows VPC endpoints/PrivateLink patterns for private access to AWS services including Bedrock.",
  },
  {
    id: "likely-011",
    topic: "Fundamentals of AI and ML",
    question: "Labeled house-price data predicting a numeric price is primarily which learning type?",
    options: [
      "Supervised learning (regression)",
      "Unsupervised clustering only",
      "Reinforcement learning in a maze only",
      "DNS load balancing",
    ],
    correct: "Supervised learning (regression)",
    explanation: "Course supervised learning covers regression with labeled numeric targets.",
  },
  {
    id: "likely-012",
    topic: "Fundamentals of AI and ML",
    question: "Predicting whether an email is spam or not spam with labeled examples is:",
    options: [
      "Supervised learning (classification)",
      "Only generative image synthesis",
      "Only anomaly isolation without labels",
      "Only speech synthesis",
    ],
    correct: "Supervised learning (classification)",
    explanation: "Classification is supervised learning with categorical labels.",
  },
  {
    id: "likely-013",
    topic: "Applications of Foundation Models",
    question:
      "Temperature in generative model inference primarily affects:",
    options: [
      "Randomness/creativity of outputs (higher → more random; lower → more deterministic)",
      "The number of Availability Zones",
      "S3 storage class",
      "IAM password rotation period",
    ],
    correct:
      "Randomness/creativity of outputs (higher → more random; lower → more deterministic)",
    explanation: "Exam guide lists inference parameters (e.g., temperature) affecting model responses.",
    difficulty: "easy",
    tags: ["inference-parameters"],
  },
  {
    id: "likely-014",
    topic: "Responsible AI, Security, Compliance and Governance",
    question:
      "Customer-support drafts from Bedrock must be reviewed by a human before sending, with escalation for high-risk topics. Which approach fits?",
    options: [
      "Human review workflow (e.g., Amazon Augmented AI / human-in-the-loop)",
      "Disable all guardrails and ship automatically",
      "Only use Amazon Personalize",
      "Only change the S3 storage class",
    ],
    correct: "Human review workflow (e.g., Amazon Augmented AI / human-in-the-loop)",
    explanation: "Course lists A2I for human review of ML predictions — common responsible AI pattern.",
  },
  {
    id: "likely-015",
    topic: "Applications of Foundation Models",
    question:
      "Embeddings in a RAG pipeline are primarily used to:",
    options: [
      "Represent text chunks as vectors for similarity/semantic search in a vector store",
      "Encrypt EBS volumes",
      "Allocate Elastic IPs",
      "Create CloudFormation stacks",
    ],
    correct:
      "Represent text chunks as vectors for similarity/semantic search in a vector store",
    explanation: "Course RAG slides show chunking → embeddings model → vector database search.",
    confusionPoints: ["embeddings vs generated text", "vector search vs keyword search"],
  },
  {
    id: "likely-016",
    topic: "Amazon SageMaker",
    question:
      "A business analyst wants to build an ML model with a visual interface and no coding. Which SageMaker capability fits?",
    options: ["SageMaker Canvas", "Amazon Inspector", "AWS Artifact", "Amazon Macie"],
    correct: "SageMaker Canvas",
    explanation: "Canvas is the no-code visual interface in the course.",
  },
  {
    id: "likely-017",
    topic: "Amazon SageMaker",
    question: "Centralized storage of ML feature metadata for reuse across teams is best associated with:",
    options: [
      "SageMaker Feature Store",
      "Amazon Polly lexicons only",
      "Amazon Translate custom terminology only",
      "AWS Trusted Advisor",
    ],
    correct: "SageMaker Feature Store",
    explanation: "Course summary: Feature Store stores features metadata centrally.",
  },
  {
    id: "likely-018",
    topic: "Security, Compliance, and Governance",
    question:
      "Which service provides access to compliance reports such as PCI and ISO according to the course security summary?",
    options: ["AWS Artifact", "Amazon Personalize", "Amazon Comprehend", "Amazon Forecast"],
    correct: "AWS Artifact",
    explanation: "Security summary: Artifact → compliance reports (PCI, ISO, etc.).",
  },
  {
    id: "likely-019",
    topic: "Prompt Engineering",
    question:
      "You need structured multi-step reasoning for a math word problem with minimal examples. A strong first technique is:",
    options: [
      "Chain-of-thought prompting (e.g., “think step by step”)",
      "Disabling the model",
      "Only using Amazon Inspector",
      "Only changing AMI IDs",
    ],
    correct: 'Chain-of-thought prompting (e.g., “think step by step”)',
    explanation: "Course CoT technique for multi-step reasoning.",
  },
  {
    id: "likely-020",
    topic: "Fundamentals of Generative AI",
    question:
      "Training a foundation model from scratch for a company use case typically means:",
    options: [
      "Very high cost and complexity compared with using/adapting an existing FM",
      "Always the cheapest option",
      "No data requirements",
      "Identical effort to a single zero-shot prompt",
    ],
    correct:
      "Very high cost and complexity compared with using/adapting an existing FM",
    explanation: "Course notes FMs may cost tens of millions to train; exam stresses customization tradeoffs.",
  },
  {
    id: "likely-021",
    topic: "AWS Managed AI Services",
    question: "Analyzing customer emails for sentiment and key entities is a primary fit for:",
    options: ["Amazon Comprehend", "Amazon Polly", "Amazon Transcribe", "Amazon Rekognition"],
    correct: "Amazon Comprehend",
    explanation: "Comprehend NLP: sentiment, entities, key phrases — course use case.",
  },
  {
    id: "likely-022",
    topic: "AWS Managed AI Services",
    question: "Localizing a website into multiple languages at scale is a primary fit for:",
    options: ["Amazon Translate", "Amazon Rekognition", "Amazon Personalize", "Amazon Inspector"],
    correct: "Amazon Translate",
    explanation: "Translate slide: localize websites/apps; large volumes of text.",
    confusionPoints: ["Transcribe vs Translate"],
  },
  {
    id: "likely-023",
    topic: "Applications of Foundation Models",
    question:
      "A Bedrock agent must call internal APIs in sequence to book travel and pull CRM data. This aligns with:",
    options: [
      "Bedrock Agents with action groups integrating systems/APIs (and RAG if needed)",
      "Only S3 Glacier Deep Archive",
      "Only Amazon Macie findings",
      "Only EC2 Spot pricing",
    ],
    correct:
      "Bedrock Agents with action groups integrating systems/APIs (and RAG if needed)",
    explanation: "Agents slide: multi-step tasks, action groups, integrations, optional RAG.",
  },
  {
    id: "likely-024",
    topic: "Responsible AI, Security, Compliance and Governance",
    question:
      "Which statement best reflects a responsible AI practice called out in exam/course materials?",
    options: [
      "Evaluate bias/fairness, protect privacy, use guardrails, and keep humans in the loop for high-risk outputs",
      "Ship models with no monitoring because accuracy never changes",
      "Ignore PII because GenAI cannot leak data",
      "Prefer undocumented models with no intended-use records",
    ],
    correct:
      "Evaluate bias/fairness, protect privacy, use guardrails, and keep humans in the loop for high-risk outputs",
    explanation: "Combines responsible AI dimensions + AWS tooling from the course.",
  },
  {
    id: "likely-025",
    topic: "Security, Compliance, and Governance",
    question: "Tracking configuration changes and compliance against rules maps to:",
    options: ["AWS Config", "Amazon Polly", "Amazon Translate", "Amazon Personalize"],
    correct: "AWS Config",
    explanation: "Security summary: Config tracks config changes and compliance rules.",
  },
];

for (const q of likely) {
  add({
    id: q.id,
    source: "exam-likely",
    topic: q.topic,
    question: q.question,
    options: q.options,
    correctAnswer: q.correct,
    explanation: q.explanation,
    difficulty: q.difficulty || "medium",
    confusionPoints: q.confusionPoints,
    tags: q.tags,
  });
}

// Validate
const errors = [];
const ids = new Set();
for (const q of questions) {
  if (ids.has(q.id)) errors.push(`Duplicate id ${q.id}`);
  ids.add(q.id);
  if (!q.question || q.options.length < 2) errors.push(`${q.id}: bad question/options`);
  const corrects = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
  for (const c of corrects) {
    if (!q.options.includes(c)) errors.push(`${q.id}: correctAnswer not in options: ${c}`);
  }
}

const bySource = {};
const byTopic = {};
for (const q of questions) {
  bySource[q.source] = (bySource[q.source] || 0) + 1;
  byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  pdfFile: "AWS Certified AI Practitioner Slides v19.pdf",
  pdfPages: pages.length,
  questionsTotal: questions.length,
  bySource,
  byTopic,
  withExplanations: questions.filter((q) => q.explanation).length,
  multiSelect: questions.filter((q) => Array.isArray(q.correctAnswer)).length,
  confusionTagged: questions.filter((q) => q.confusionPoints?.length).length,
  needsReview: questions.filter((q) => q.status === "NEEDS_REVIEW").map((q) => q.id),
  validationErrors: errors,
  notes: [
    "course-pdf: generated from Maarek slides facts (not original MCQs in PDF — PDF had none).",
    "aws-official-practice: from AWS Official Practice Question Set samples (TNC203).",
    "exam-likely: high-frequency AIF-C01 patterns from exam guide + common scenarios; not live exam dumps.",
  ],
};

const dataDir = join(root, "app", "src", "data");
mkdirSync(dataDir, { recursive: true });
mkdirSync(join(root, "scripts", "output"), { recursive: true });
writeFileSync(join(dataDir, "questions.json"), JSON.stringify(questions, null, 2));
writeFileSync(join(root, "scripts", "output", "extraction-report.json"), JSON.stringify(report, null, 2));
writeFileSync(
  join(root, "scripts", "output", "EXTRACTION_REPORT.md"),
  `# PDF / Question Extraction Report

- PDF: AWS Certified AI Practitioner Slides v19.pdf
- Pages: ${pages.length}
- Questions total: ${questions.length}

## By source
${Object.entries(bySource)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

## By topic
${Object.entries(byTopic)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

## Validation errors
${errors.length ? errors.map((e) => `- ${e}`).join("\n") : "- none"}

## Notes
${report.notes.map((n) => `- ${n}`).join("\n")}
`
);

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
