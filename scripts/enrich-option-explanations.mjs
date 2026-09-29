/**
 * Enrich stub optionExplanations so distractors teach the concept,
 * not just "does not fit".
 *
 * Usage: node scripts/enrich-option-explanations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const targets = [
  path.join(root, 'aif_c01_300_question_bank_2026.json'),
  path.join(root, 'app/src/data/aif_c01_300_question_bank_2026.json'),
]

const STUB_RE =
  /does not directly satisfy the requirement described in this scenario\.?$/i
const WEAK_INCORRECT_RE =
  /^(incorrect\.\s*)?(this does not match the concept or requirement being tested\.?)$/i
const WEAK_CORRECT_RE =
  /^(correct\.\s*)?(this directly matches the concept or requirement being tested\.?)$/i

function isStub(text) {
  const t = String(text ?? '').trim()
  if (!t) return true
  return STUB_RE.test(t) || WEAK_INCORRECT_RE.test(t)
}

function isWeakCorrect(text) {
  const t = String(text ?? '').trim()
  if (!t) return true
  return WEAK_CORRECT_RE.test(t)
}
const GLOSSARY = {
  'SageMaker Ground Truth':
    'SageMaker Ground Truth helps create and manage labeled datasets with human and automated labeling workflows.',
  'AWS Budgets':
    'AWS Budgets lets you set custom cost or usage budgets and trigger alerts when thresholds are approached or exceeded.',
  PCA: 'Principal component analysis (PCA) is a dimensionality-reduction technique that projects data onto fewer components that capture most variance.',
  'Principal component analysis':
    'Principal component analysis (PCA) reduces dimensionality by projecting data onto components that capture the most variance.',
  'Learning rate':
    'Learning rate controls how large each parameter update is during training; too high can diverge, too low can train slowly.',
  Accuracy:
    'Accuracy is the share of all predictions that are correct; it can be misleading on imbalanced classes.',
  'Amazon S3 Glacier':
    'Amazon S3 Glacier storage classes are for low-cost archival storage where retrieval can take minutes to hours.',
  'K-Nearest Neighbors':
    'K-Nearest Neighbors predicts a label or value from the labels/values of the K closest training examples.',
  'Linear regression':
    'Linear regression predicts a continuous numeric target as a weighted combination of input features.',
  'Logistic regression':
    'Logistic regression is a supervised model commonly used for binary (or multinomial) classification with probabilistic outputs.',
  'Epoch count':
    'Epoch count is how many full passes the trainer makes over the training dataset.',
  Epochs: 'Epochs are complete passes through the training dataset during model training.',
  'Batch size':
    'Batch size is how many training examples are processed together before each parameter update.',
  Availability:
    'Availability is the ability of a system to remain reachable and usable when users need it.',
  Elasticity:
    'Elasticity is the ability to scale capacity up or down automatically as demand changes.',
  Scalability:
    'Scalability is the ability to handle growing workload by adding resources without redesigning the system.',
  RMSE: 'Root mean squared error (RMSE) measures average magnitude of regression prediction errors, penalizing large errors more.',
  'R-squared':
    'R-squared measures how much variance in the target a regression model explains (closer to 1 is usually better).',
  MAE: 'Mean absolute error (MAE) is the average absolute difference between predicted and actual continuous values.',
  'K-Means':
    'K-Means is an unsupervised clustering algorithm that partitions records into K groups around centroids.',
  'K-Means clustering':
    'K-Means clustering groups unlabeled records into K clusters by minimizing distance to cluster centroids.',
  'K-Means model':
    'A K-Means model learns cluster centroids from unlabeled data and assigns new points to the nearest centroid.',
  Autoscaling:
    'Autoscaling automatically adds or removes compute capacity based on load metrics or schedules.',
  'SageMaker Model Monitor':
    'SageMaker Model Monitor detects data and prediction quality drift on deployed endpoints.',
  'Amazon Inspector':
    'Amazon Inspector automatically scans AWS workloads for software vulnerabilities and network exposure.',
  'High bias':
    'High bias usually means the model is too simple (underfitting) and systematically misses patterns in the data.',
  'Low variance':
    'Low variance means predictions change little across training sets; combined with high bias it often signals underfitting.',
  'Increase temperature':
    'Increasing temperature makes generative sampling more random and diverse, which can reduce factual consistency.',
  'Raise temperature':
    'Raising temperature increases randomness in next-token sampling for generative models.',
  'Increased temperature':
    'Higher temperature increases output randomness and can hurt precision on factual tasks.',
  'Prompt caching':
    'Prompt caching reuses previously processed prompt prefixes to reduce latency and cost on repeated prompt segments.',
  'Cost optimization':
    'Cost optimization means choosing architectures and services that meet requirements at the lowest sustainable spend.',
  Throughput:
    'Throughput is how much work a system completes per unit time (for example requests or tokens per second).',
  'Cost allocation':
    'Cost allocation tags and reports attribute cloud spend to teams, products, or environments for accountability.',
  'Transfer learning':
    'Transfer learning reuses knowledge from a model trained on one task to improve learning on a related task.',
  'Single-purpose rules engine':
    'A rules engine applies fixed if-then logic; it does not learn patterns from data the way ML models do.',
  'Relational database':
    'A relational database stores structured rows and tables with SQL access; it is not an ML training approach by itself.',
  'Computer vision model':
    'A computer vision model analyzes images or video (for example classification, detection, or segmentation).',
  'Time-series database':
    'A time-series database is optimized for timestamped measurements; it stores data rather than learning predictive models by itself.',
  'Gradient clipping':
    'Gradient clipping limits gradient magnitude during training to stabilize updates and reduce exploding gradients.',
  'Object detection':
    'Object detection locates and classifies objects in images, typically returning bounding boxes and labels.',
  'Availability Zones':
    'Availability Zones are isolated locations within a Region used to design resilient multi-AZ architectures.',
  'Availability Zone':
    'An Availability Zone is an isolated data-center location within an AWS Region.',
  Clusters:
    'Clusters are groups of similar records discovered without labels, commonly produced by unsupervised algorithms.',
  'Security groups':
    'Security groups are virtual firewalls that control inbound and outbound traffic for AWS resources.',
  'Security group':
    'A security group is a stateful virtual firewall controlling network access to associated resources.',
  'One-hot IAM policies':
    'IAM policies grant permissions to identities; “one-hot” style sprawling policies are not an ML technique.',
  'CloudTrail events':
    'CloudTrail events are records of API activity used for auditing who did what in an AWS account.',
  'Encryption at rest':
    'Encryption at rest protects stored data so it is unreadable without the correct keys.',
  Regularization:
    'Regularization techniques (for example L1/L2, dropout) reduce overfitting by constraining model complexity.',
  'Increase batch size':
    'Increasing batch size processes more examples per update; it can speed training but may change convergence behavior.',
  'Amazon EMR':
    'Amazon EMR runs big-data frameworks such as Spark and Hadoop on managed clusters for large-scale processing.',
  'SageMaker JumpStart':
    'SageMaker JumpStart provides pretrained models and solution templates to accelerate ML experimentation.',
  'Amazon Route 53':
    'Amazon Route 53 is AWS’s DNS and domain routing service, not an ML or GenAI model service.',
  'Disable authentication':
    'Disabling authentication removes identity checks and is a security anti-pattern, not a valid solution.',
  'Data encryption':
    'Data encryption protects confidentiality of data in transit or at rest using cryptographic keys.',
  'Data leakage':
    'Data leakage occurs when information unavailable at prediction time improperly influences training or evaluation.',
  'AUC-ROC':
    'AUC-ROC summarizes classification ranking quality across thresholds; higher is generally better.',
  'Data warehousing':
    'Data warehousing aggregates structured analytics data for BI/SQL workloads, not foundation-model hosting by itself.',
  'Model retraining from scratch':
    'Retraining from scratch rebuilds a model without reusing prior weights; it is usually slower and costlier than fine-tuning or transfer.',
  RLHF: 'Reinforcement Learning from Human Feedback tunes a model using human preference signals as a reward.',
  'Zero-shot classification':
    'Zero-shot classification assigns labels without task-specific labeled training examples, often using prompts or pretrained models.',
  'Train a new FM from scratch':
    'Training a foundation model from scratch requires massive data and compute; organizations usually adapt existing FMs instead.',
  'Use PCA':
    'Using PCA reduces feature dimensionality; it is not a substitute for supervised learning when labeled prediction is required.',
  'RAG only':
    'Retrieval-augmented generation (RAG) grounds answers in retrieved documents; alone it may not cover every GenAI design need.',
  'Batch transform':
    'SageMaker batch transform runs offline inference on a dataset without keeping a persistent real-time endpoint.',
  'Unsupervised clustering':
    'Unsupervised clustering groups unlabeled examples by similarity rather than predicting a provided target label.',
  'KMS alias':
    'A KMS alias is a friendly name pointing to a KMS key; aliases help manage keys but are not the encryption operation itself.',
  'SageMaker Studio':
    'SageMaker Studio is an IDE for building, training, tuning, and deploying ML models on SageMaker.',
  'Fault tolerance':
    'Fault tolerance is the ability to continue operating correctly despite component failures.',
  'Cost efficiency':
    'Cost efficiency means delivering required outcomes with minimal unnecessary spend.',
  'High availability':
    'High availability designs minimize downtime through redundancy, health checks, and failover.',
  Portability:
    'Portability is how easily a workload can move across environments or platforms.',
  'Grant AdministratorAccess to all users':
    'Granting AdministratorAccess to everyone violates least privilege and creates severe security risk.',
  'Store credentials in source code':
    'Storing credentials in source code exposes secrets and is an insecure anti-pattern.',
  'Make every S3 bucket public':
    'Making buckets public exposes data broadly and is almost never appropriate for sensitive content.',
  'Share the root user password':
    'Sharing the root user password breaks accountability and is a critical security anti-pattern.',
  'Hard-code an access key in the application':
    'Hard-coding access keys embeds long-lived secrets in code and risks credential leakage.',
  'Bedrock Guardrails':
    'Amazon Bedrock Guardrails apply safety filters and policies to generative AI inputs and outputs.',
  'AWS Glue':
    'AWS Glue is a serverless data integration service for ETL, cataloging, and preparing data.',
  'Amazon Rekognition labels':
    'Rekognition labels identify objects and scenes in images/video; they are vision outputs, not a general search or NLP answer.',
  'AWS Config rules':
    'AWS Config rules continuously evaluate resource configurations against desired policies.',
  'Always choose the model with the largest parameter count':
    'Largest models are not automatically best; fit quality, latency, cost, and evaluation results matter more.',
  'Choose randomly and tune temperature later':
    'Random model choice skips requirements analysis; selection should be driven by use case, evals, and constraints.',
  'Always choose the newest model regardless of cost':
    'Newest models may not be optimal on cost, latency, or task fit; evaluate against requirements.',
  'Cluster centroid':
    'A cluster centroid is the center point representing a cluster in algorithms such as K-Means.',
  'Move logs to Glacier':
    'Moving logs to Glacier archives them cheaply but can delay investigations if frequent retrieval is needed.',
  'Increase the number of IAM users':
    'Creating more IAM users does not by itself improve security posture or model quality.',
  'Increase the number of K-Means clusters':
    'Increasing K changes how finely data is partitioned; it does not create labeled supervised learning.',
  'S3 lifecycle rule':
    'S3 lifecycle rules automatically transition or expire objects based on age or other criteria.',
  'Disable logging':
    'Disabling logging removes audit visibility and weakens security and compliance posture.',
  'Semantic search':
    'Semantic search retrieves content by meaning/embeddings rather than exact keyword match alone.',
  'AWS Lambda':
    'AWS Lambda runs event-driven code without managing servers; it is compute, not an FM training service by itself.',
  'AWS Glue DataBrew':
    'Glue DataBrew provides visual data preparation and cleansing for analytics and ML datasets.',
  'Offline preprocessing':
    'Offline preprocessing transforms data in batch before training or inference rather than at request time.',
  'Model training job':
    'A model training job fits model parameters on a training dataset using compute resources.',
  'Real-time provisioned endpoint':
    'A provisioned real-time endpoint keeps inference capacity ready for low-latency synchronous requests.',
  'Data compression':
    'Data compression reduces storage/transfer size; it is not a modeling technique by itself.',
  Latency: 'Latency is the time delay before a response is returned to the requester.',
  'Hide the subgroup metrics':
    'Hiding subgroup metrics conceals fairness/performance disparities and weakens responsible AI oversight.',
  'Disable model monitoring':
    'Disabling model monitoring removes drift and quality checks after deployment.',
  'Use the cheapest storage class':
    'Cheapest storage can increase retrieval delay or operational risk if access patterns need frequent reads.',
  'Remove all audit logging':
    'Removing audit logging eliminates accountability trails needed for security and compliance.',
  'AWS Cost Explorer':
    'AWS Cost Explorer visualizes and analyzes historical AWS spend and usage.',
  'Internet gateway only':
    'An internet gateway enables VPC internet connectivity; it is not an AI service or model control.',
  'Amazon Route 53 public hosted zone':
    'A Route 53 public hosted zone publishes DNS records on the internet; it is unrelated to model quality.',
  'Disable TLS':
    'Disabling TLS exposes data in transit and is a security anti-pattern.',
  'Store all data unencrypted':
    'Storing data unencrypted increases breach impact and usually violates security best practices.',
  'Use public buckets for convenience':
    'Public buckets trade convenience for exposure risk and are inappropriate for sensitive data.',
  'Maximum retention':
    'Maximum retention keeps data longer; longer retention can increase risk and cost if not required.',
  'Unlimited logging':
    'Unlimited logging can explode cost and noise; logging should be purposeful and retained appropriately.',
  Overprovisioning:
    'Overprovisioning allocates more capacity than needed, raising cost without necessarily improving outcomes.',
  'Token sampling':
    'Token sampling chooses the next token from a probability distribution (for example temperature, top-k, top-p).',
  'Lower ownership always requires more controls':
    'Responsibility and controls depend on the shared-responsibility boundary of the service model, not a blanket rule.',
  'Only model size determines security scope':
    'Security scope depends on architecture, data handling, and service responsibilities — not model size alone.',
  'All scopes have identical responsibility':
    'AWS shared responsibility differs across IaaS, managed AI services, and SaaS-like offerings.',
  'All scopes have identical responsibilities':
    'Shared responsibility varies by service type; customers and AWS own different controls in each model.',
  'Binary classification':
    'Binary classification predicts one of two classes (for example fraud vs not fraud).',
  'Supervised linear regression':
    'Supervised linear regression predicts a continuous target from labeled examples using a linear model.',
  'K-Nearest Neighbors with labeled data':
    'KNN with labeled data is a supervised approach that predicts from nearby labeled neighbors.',
  'It requires choosing the number of clusters':
    'Some clustering methods (like K-Means) require selecting K; that detail alone does not define every ML approach.',
  'It is primarily an anomaly detector':
    'Anomaly detection flags unusual points; it is a distinct problem type from general supervised prediction.',
  'It is always unsupervised':
    'Not all ML methods are unsupervised; supervised and reinforcement learning use different learning signals.',
  'It never uses a target variable':
    'Some learning paradigms do use target variables (supervised learning); this statement is not universally true.',
  'It is limited to clustering':
    'Clustering is only one unsupervised technique; unsupervised learning also includes dimensionality reduction and more.',
  'It requires all data to be unlabeled':
    'Unsupervised methods use unlabeled data, but that requirement does not describe every learning approach.',
  'Poor training and poor test performance only':
    'Underfitting often shows weak performance on both train and test sets, but wording here is incomplete for the tested concept.',
  'The model cannot fit the training data':
    'Failure to fit training data often indicates underfitting/high bias, which may not be the concept asked for here.',
  'High bias is always the primary symptom':
    'High bias is associated with underfitting, but not every ML issue is primarily a bias problem.',
  'Fewer IAM users':
    'Reducing IAM users may help governance in some cases, but it is not the ML/AI concept being tested.',
  'Lower account spend':
    'Lower spend is a cost outcome, not the AI/ML technique or control the question targets.',
  'More S3 lifecycle rules':
    'Lifecycle rules manage object storage transitions; they do not solve the AI problem described.',
  'Replacing all data with rules':
    'Replacing data-driven learning with only hard-coded rules removes the benefit of ML pattern learning.',
  'Removing all monitoring after deployment':
    'Removing monitoring after deployment increases risk of undetected drift and quality regressions.',
  'Skipping validation entirely':
    'Skipping validation means you cannot confirm the model meets quality, safety, or business requirements.',
  'Both are identical to accuracy':
    'Precision and recall are not the same as accuracy; they focus on different aspects of classification errors.',
  'Recall measures squared error':
    'Recall is a classification metric (true positives / actual positives), not a squared-error regression measure.',
  'Precision is a regression metric':
    'Precision is a classification metric (true positives / predicted positives), not a regression error metric.',
  'S3 bucket versioning':
    'S3 versioning keeps multiple object versions for recovery; it is not an ML algorithm.',
  'VPC route propagation':
    'Route propagation shares network routes into route tables; it is networking, not AI modeling.',
  'IAM password rotation':
    'Password rotation improves credential hygiene; it is not the AI concept under test.',
  'They are IAM permission documents':
    'IAM policies are permission documents; that description does not match the concept asked about here.',
  'They are S3 storage classes':
    'S3 storage classes define cost/retrieval characteristics of objects, not the concept being tested.',
  'They are always human-readable text':
    'Not all model artifacts or credentials are human-readable text; this statement is inaccurate here.',
  'Remove source context':
    'Removing source context weakens grounding and can increase hallucinations in GenAI answers.',
  'Increase randomness without validation':
    'Increasing randomness without evaluation can degrade answer quality and reliability.',
  'Disable evaluation':
    'Disabling evaluation removes the evidence needed to trust model quality and safety.',
  'It is the same as K-Means':
    'Different algorithms solve different problems; this option incorrectly equates distinct techniques.',
  'It always requires training a new FM from scratch':
    'Most teams adapt existing foundation models; training a new FM from scratch is rarely required.',
  'It removes the need for any retrieval system':
    'Fine-tuning or prompting does not automatically eliminate the need for retrieval when fresh/private knowledge is required.',
  'It is identical to zero-shot prompting':
    'Few-shot and zero-shot prompting differ: few-shot includes examples, zero-shot does not.',
  'It cannot alter model behavior':
    'Prompting, fine-tuning, and guardrails can all change model behavior; this claim is false.',
  'It is only an S3 storage operation':
    'This reduces the concept to storage mechanics and misses the AI/ML meaning being tested.',
  'S3 lifecycle policy':
    'An S3 lifecycle policy automates transitions/expirations of objects over time.',
  'IAM group name':
    'An IAM group name identifies a group of users for permission management; it is not an AI technique.',
  'EBS snapshotting':
    'EBS snapshots back up block volumes; they are backup operations, not ML methods.',
  'VPC peering':
    'VPC peering connects two VPCs for private routing; it is networking, not generative AI.',
  'S3 replication':
    'S3 replication copies objects across buckets/Regions for durability or locality.',
  'It is only model monitoring':
    'Model monitoring is valuable but is not the full concept described in the question.',
  'It is unsupervised K-Means':
    'K-Means is one unsupervised algorithm; the question may be testing a different concept.',
  'It requires no human judgments':
    'Many AI workflows still need human review, labeling, or preference feedback.',
  'AWS Artifact only':
    'AWS Artifact provides compliance reports/agreements; alone it does not solve the broader requirement.',
  'Amazon Route 53 only':
    'Route 53 handles DNS; it does not address the AI capability described.',
  'Amazon S3 Glacier only':
    'Glacier is archival storage and does not provide the AI/ML capability asked for.',
  'Amazon Polly voice generation':
    'Amazon Polly synthesizes speech from text; that capability may not match this scenario.',
  'Amazon Macie alone':
    'Amazon Macie discovers sensitive data in S3; alone it may not cover the full control needed here.',
  'Disable all output checks':
    'Disabling output checks removes safety/quality filters on model responses.',
  'Grant broad administrator permissions':
    'Broad admin permissions violate least privilege and increase blast radius.',
  'Trust all retrieved text as system instructions':
    'Blindly trusting retrieved text enables prompt-injection style risks; retrieved content should be treated carefully.',
  'Amazon Kendra — image generation':
    'Amazon Kendra is enterprise search, not an image generation service.',
  'Amazon Textract — recommendation engine':
    'Amazon Textract extracts text/structure from documents; it is not a recommendation engine.',
  'Amazon Rekognition — relational database':
    'Amazon Rekognition analyzes images/video; it is not a relational database.',
  'Amazon Lex — encryption key management':
    'Amazon Lex builds conversational bots; it does not manage encryption keys.',
  'Amazon Comprehend — object storage':
    'Amazon Comprehend provides NLP insights; it is not object storage.',
  'Amazon Personalize — speech transcription':
    'Amazon Personalize builds recommendations; speech-to-text is handled by services like Transcribe.',
  'Real-time inference only':
    'Real-time inference serves low-latency requests; batch or other patterns may better fit some workloads.',
  'Running SQL queries':
    'SQL queries retrieve/transform structured data; they are not the ML approach described.',
  'Training K-Means clusters':
    'Training K-Means finds clusters in unlabeled data; that may not match a supervised or GenAI requirement.',
  'Creating IAM users':
    'Creating IAM users is identity administration, not the AI technique under test.',
  'Hide known limitations':
    'Hiding limitations reduces transparency and undermines responsible AI communication.',
  'Avoid stakeholder communication':
    'Avoiding stakeholder communication weakens governance, trust, and adoption.',
  'Remove audit documentation':
    'Removing audit documentation harms compliance evidence and accountability.',
  'Only increase model size':
    'Larger models are not a universal fix; data quality, prompts, retrieval, and evaluation often matter more.',
  'Use public S3 buckets':
    'Public S3 buckets expose objects broadly and are inappropriate for sensitive AI data.',
  'Delete evaluation results':
    'Deleting evaluation results removes the evidence needed to justify model decisions.',
  'Ignore subgroup metrics':
    'Ignoring subgroup metrics can hide unfair or uneven performance across populations.',
  'Disable validation':
    'Disabling validation skips quality checks needed before trusting a model in production.',
  'Reserved Instances':
    'Reserved Instances discount steady-state compute; they are a pricing construct, not an AI algorithm.',
  'DNS routing':
    'DNS routing resolves names to endpoints; it is networking, not the AI concept tested.',
  'Route tables':
    'Route tables direct network traffic in a VPC; they are not ML services.',
  'S3 Intelligent-Tiering':
    'S3 Intelligent-Tiering automatically moves objects between access tiers to optimize storage cost.',
  'Amazon Polly voices':
    'Polly voices are text-to-speech voice options; they do not address this question’s core requirement.',
  'Hide failure modes':
    'Hiding failure modes reduces transparency and makes safe operations harder.',
  'Deploy without validation':
    'Deploying without validation risks releasing untested, unsafe, or low-quality models.',
  'Remove all logging':
    'Removing all logging eliminates operational and security visibility.',
  'Lower storage cost':
    'Lower storage cost can be desirable but is not the AI/ML concept this item is testing.',
  'Faster DNS resolution':
    'Faster DNS resolution improves name lookup speed; unrelated to the AI requirement here.',
  'Higher S3 durability':
    'S3 durability protects against object loss; durability alone does not create ML capability.',
  'Share credentials broadly':
    'Broad credential sharing destroys least privilege and auditability.',
  'Collect unnecessary PII':
    'Collecting unnecessary PII increases privacy risk and conflicts with data minimization.',
  'Disabled authentication':
    'Disabled authentication leaves systems open to unauthorized access.',
  'Shared root credentials':
    'Shared root credentials are a critical security failure with no individual accountability.',
  'Public write access':
    'Public write access lets anyone modify data and is generally an unsafe configuration.',
  'Amazon Rekognition — IAM authorization':
    'Rekognition is vision analysis; IAM authorization is a separate identity and access control concern.',
  'Amazon Polly — encryption key management':
    'Polly is text-to-speech; encryption key management is handled by services like KMS.',
  'Amazon Personalize — audit evidence collection':
    'Personalize creates recommendations; audit evidence is typically gathered via logging and compliance tooling.',
  'Share the root account':
    'Sharing the root account is a severe security anti-pattern.',
  'Embed long-term access keys':
    'Embedding long-term access keys in apps risks leakage; prefer roles and temporary credentials.',
  'Grant AdministratorAccess by default':
    'Default AdministratorAccess violates least privilege.',
  'Unlimited retention':
    'Unlimited retention can increase privacy, compliance, and cost risk when not required.',
  'Public bucket access':
    'Public bucket access exposes object data to the internet unless carefully justified and controlled.',
  'Plaintext secrets':
    'Plaintext secrets are unprotected credentials/config that can be stolen if the host is compromised.',
  'K-Means centroids':
    'K-Means centroids are the learned centers of clusters used to assign nearby points.',
  'GPU clock speed':
    'GPU clock speed is a hardware performance attribute, not the ML concept being tested.',
  'It is a pricing calculator':
    'A pricing calculator estimates cost; that is not the AI/security concept described here.',
  'It only applies to image models':
    'Many AI concepts apply across modalities, not only image models.',
  'Disable encryption':
    'Disabling encryption leaves data readable if storage or traffic is compromised.',
  'Collect every possible field':
    'Collecting every possible field contradicts data minimization and increases privacy risk.',
  'Use public endpoints for all sensitive traffic':
    'Sending sensitive traffic over unnecessary public paths increases exposure risk.',
  'Amazon Polly':
    'Amazon Polly converts text into lifelike speech using deep-learning voices.',
  'AWS CloudTrail':
    'AWS CloudTrail records account API activity for auditing, governance, and investigation.',
  'AWS Artifact':
    'AWS Artifact provides on-demand AWS compliance reports and select agreements.',
  'Random Cut Forest':
    'Random Cut Forest is an unsupervised algorithm commonly used for anomaly detection.',
  'Batch inference':
    'Batch inference scores large datasets offline when immediate per-request responses are not required.',
  'Amazon Textract':
    'Amazon Textract extracts printed/handwritten text and document structure (forms, tables) from files.',
  'Amazon Rekognition':
    'Amazon Rekognition provides managed image and video analysis such as labels, faces, and unsafe content detection.',
  'Amazon Kendra':
    'Amazon Kendra is an intelligent enterprise search service that indexes and retrieves organizational content.',
  'Reinforcement learning':
    'Reinforcement learning trains an agent through trial and error using rewards and penalties.',
  'Amazon Macie':
    'Amazon Macie uses ML and pattern matching to discover and protect sensitive data in Amazon S3.',
  'SageMaker Feature Store':
    'SageMaker Feature Store is a purpose-built repository to store, share, and serve ML features.',
  'Supervised learning':
    'Supervised learning trains on labeled examples to learn a mapping from inputs to known targets.',
  'Unsupervised learning':
    'Unsupervised learning finds structure in unlabeled data, such as clusters or compressed representations.',
  'Amazon Comprehend':
    'Amazon Comprehend provides NLP features such as sentiment, entities, key phrases, and language detection.',
  'AWS Config':
    'AWS Config tracks resource configurations and evaluates them against desired configuration rules.',
  'Amazon Personalize':
    'Amazon Personalize builds personalized recommendation systems from interaction and item data.',
  Underfitting:
    'Underfitting happens when a model is too simple or under-trained to capture the true patterns in the data.',
  'Serverless inference':
    'Serverless inference hosts models with automatic scaling suited to intermittent or spiky traffic.',
  'Amazon Transcribe':
    'Amazon Transcribe converts speech audio into text.',
  'Real-time inference':
    'Real-time inference serves synchronous, low-latency predictions from a live endpoint.',
  'Top P':
    'Top P (nucleus sampling) samples from the smallest set of tokens whose cumulative probability exceeds P.',
  'Few-shot prompting':
    'Few-shot prompting includes a few worked examples in the prompt to steer the desired response format.',
  'Amazon Translate':
    'Amazon Translate provides neural machine translation between supported languages.',
  Transparency:
    'Transparency means being open about system capabilities, limitations, data use, and decision factors.',
  'Top K':
    'Top K sampling restricts next-token choices to the K highest-probability tokens.',
  Recall:
    'Recall is the fraction of actual positive cases that the model successfully identifies.',
}

function harvestDefinitions(questions) {
  const harvested = new Map()
  for (const q of questions) {
    for (const opt of q.correctAnswers ?? []) {
      const ex = q.optionExplanations?.[opt]
      if (!ex || isStub(ex) || isWeakCorrect(ex)) continue
      const cleaned = String(ex).replace(/^Correct\.\s*/i, '').trim()
      if (cleaned.length < 40) continue
      const prev = harvested.get(opt) ?? ''
      if (cleaned.length > prev.length) harvested.set(opt, cleaned)
    }
  }
  return harvested
}

function definitionFor(opt, harvested) {
  if (GLOSSARY[opt]) return GLOSSARY[opt]
  if (harvested.has(opt)) return harvested.get(opt)
  return null
}

function whyNotFit(q) {
  const correct = (q.correctAnswers ?? []).join(' / ')
  if (correct) {
    return `It is not the best fit here — this item is looking for: ${correct}.`
  }
  return 'It is not the best fit for the requirement in this scenario.'
}

function describeOptionClaim(opt) {
  // Statement-style distractors: explain the claim itself.
  if (/^it\b/i.test(opt) || /^(both|they|poor|the model|high bias|fewer|lower|more|replacing|removing|skipping)\b/i.test(opt)) {
    return `This option claims: "${opt}".`
  }
  return null
}

function enrichQuestion(q, harvested) {
  const nextExplanations = { ...(q.optionExplanations ?? {}) }
  let changed = 0

  for (const opt of q.options ?? []) {
    const current = nextExplanations[opt] ?? ''
    const isCorrect = (q.correctAnswers ?? []).includes(opt)

    if (isCorrect) {
      if (!current?.trim() || isWeakCorrect(current)) {
        const def = definitionFor(opt, harvested)
        nextExplanations[opt] = def
          ? `Correct. ${def}`
          : `Correct. ${q.explanation || `"${opt}" matches the requirement being tested.`}`
        changed++
      }
      continue
    }

    if (!isStub(current)) continue

    const def = definitionFor(opt, harvested)
    const claim = describeOptionClaim(opt)
    if (def) {
      nextExplanations[opt] = `${def} ${whyNotFit(q)}`
    } else if (claim) {
      nextExplanations[opt] = `${claim} That claim does not correctly describe the tested concept. ${whyNotFit(q)}`
    } else {
      nextExplanations[opt] =
        `"${opt}" is a different concept/approach from what this question asks. ${whyNotFit(q)}`
    }
    changed++
  }

  return { question: { ...q, optionExplanations: nextExplanations }, changed }
}

function processFile(filePath, harvestedSeed) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const harvested = harvestedSeed ?? harvestDefinitions(raw.questions)
  let changed = 0
  const questions = raw.questions.map((q) => {
    const result = enrichQuestion(q, harvested)
    changed += result.changed
    return result.question
  })
  fs.writeFileSync(filePath, JSON.stringify({ ...raw, questions }, null, 2) + '\n')
  return { changed, count: questions.length, harvested }
}

const first = processFile(targets[0])
console.log(`Updated ${targets[0]} — ${first.changed} option explanations across ${first.count} questions`)
for (const t of targets.slice(1)) {
  const r = processFile(t, first.harvested)
  console.log(`Updated ${t} — ${r.changed} option explanations across ${r.count} questions`)
}

// Report remaining stubs
const check = JSON.parse(fs.readFileSync(targets[0], 'utf8'))
let remaining = 0
for (const q of check.questions) {
  for (const [opt, ex] of Object.entries(q.optionExplanations ?? {})) {
    if (!(q.correctAnswers ?? []).includes(opt) && isStub(ex)) remaining++
  }
}
console.log(`Remaining stub distractors: ${remaining}`)
