import type { CareerRole, RoadmapMilestone } from "../types";

const coreSections = [
  "DSA",
  "OS",
  "DBMS",
  "CN",
  "Projects",
  "Aptitude",
  "Mock Interviews",
] as const;

type RoadmapTemplateDefinition = Record<
  (typeof coreSections)[number],
  {
    focus: string;
    tasks: string[];
  }
>;

function createMilestones(definition: RoadmapTemplateDefinition) {
  return coreSections.map<RoadmapMilestone>((title) => ({
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    focus: definition[title].focus,
    tasks: definition[title].tasks.map((task, index) => ({
      id: `${title.toLowerCase().replace(/\s+/g, "-")}-task-${index + 1}`,
      title: task,
      completed: false,
      deadline: "",
    })),
  }));
}

type CustomRoadmapDefinition = Array<{
  title: string;
  focus: string;
  tasks: string[];
}>;

function createCustomMilestones(definition: CustomRoadmapDefinition) {
  return definition.map<RoadmapMilestone>((section) => ({
    id: section.title.toLowerCase().replace(/\s+/g, "-"),
    title: section.title,
    focus: section.focus,
    tasks: section.tasks.map((task, index) => ({
      id: `${section.title.toLowerCase().replace(/\s+/g, "-")}-task-${index + 1}`,
      title: task,
      completed: false,
      deadline: "",
    })),
  }));
}

export const roadmapTemplates: Record<CareerRole, RoadmapMilestone[]> = {
  SDE: createMilestones({
    DSA: {
      focus:
        "Master arrays, strings, trees, graphs, dynamic programming, and problem-solving speed.",
      tasks: [
        "Finish core array, string, and hashing practice",
        "Solve tree, graph, and recursion patterns",
        "Run timed mixed-set interview practice",
      ],
    },
    OS: {
      focus:
        "Understand processes, threads, scheduling, memory management, and concurrency basics.",
      tasks: [
        "Revise processes, threads, and CPU scheduling",
        "Cover deadlocks, synchronization, and paging",
        "Prepare OS interview question answers",
      ],
    },
    DBMS: {
      focus:
        "Cover SQL, normalization, indexing, transactions, and relational design.",
      tasks: [
        "Practice joins, subqueries, and aggregate SQL",
        "Review normalization, keys, and indexing",
        "Prepare DBMS interview theory answers",
      ],
    },
    CN: {
      focus:
        "Learn HTTP, TCP/IP, DNS, latency, and distributed systems communication basics.",
      tasks: [
        "Revise OSI/TCP-IP model and HTTP basics",
        "Understand DNS, TCP handshake, and latency",
        "Prepare networking viva-style explanations",
      ],
    },
    Projects: {
      focus:
        "Build full-stack or backend-heavy projects with APIs, auth, and deployment.",
      tasks: [
        "Ship one full-stack production-ready project",
        "Add auth, CRUD flows, and deployment",
        "Document architecture and resume bullets",
      ],
    },
    Aptitude: {
      focus:
        "Practice quantitative aptitude, reasoning, and coding OA-style questions.",
      tasks: [
        "Cover quantitative aptitude basics",
        "Practice logical reasoning question sets",
        "Attempt a complete OA simulation",
      ],
    },
    "Mock Interviews": {
      focus:
        "Run DSA, CS fundamentals, and behavioral mock interviews consistently.",
      tasks: [
        "Schedule a DSA mock interview",
        "Run CS fundamentals mock discussion",
        "Refine behavioral answers with feedback",
      ],
    },
  }),
  "Data Engineer": createMilestones({
    DSA: {
      focus:
        "Focus on problem solving, data manipulation, hashing, heaps, and scalable logic.",
      tasks: [
        "Practice arrays, heaps, and hash-based problems",
        "Solve data transformation coding exercises",
        "Run timed coding practice for pipeline roles",
      ],
    },
    OS: {
      focus:
        "Understand Linux basics, process handling, memory, and system-level reliability concepts.",
      tasks: [
        "Revise Linux, processes, and scheduling basics",
        "Study memory and job execution concepts",
        "Prepare OS questions relevant to data systems",
      ],
    },
    DBMS: {
      focus:
        "Go deep on SQL, warehousing concepts, indexing, transactions, and schema design.",
      tasks: [
        "Master advanced SQL and analytical queries",
        "Study warehousing, partitioning, and indexing",
        "Design schemas for fact and dimension models",
      ],
    },
    CN: {
      focus:
        "Cover APIs, networking basics, distributed systems communication, and data flow reliability.",
      tasks: [
        "Review networking basics for distributed data jobs",
        "Understand API ingestion and retries",
        "Prepare reliable data transfer explanations",
      ],
    },
    Projects: {
      focus:
        "Build ETL pipelines, streaming jobs, warehousing workflows, and data quality projects.",
      tasks: [
        "Build one ETL batch pipeline project",
        "Build one streaming or event-driven pipeline",
        "Add monitoring and data quality checks",
      ],
    },
    Aptitude: {
      focus:
        "Practice test-style reasoning and numerical aptitude for hiring screens.",
      tasks: [
        "Practice quant question banks",
        "Solve logical reasoning sets",
        "Attempt a timed data-role aptitude mock",
      ],
    },
    "Mock Interviews": {
      focus:
        "Prepare for SQL, data modeling, pipeline design, and resume walkthroughs.",
      tasks: [
        "Run an advanced SQL mock round",
        "Practice pipeline and schema design interview",
        "Refine project walkthrough storytelling",
      ],
    },
  }),
  "AI Engineer": createMilestones({
    DSA: {
      focus:
        "Strengthen Python-based problem solving, arrays, recursion, graphs, and optimization thinking.",
      tasks: [
        "Practice Python coding interview patterns",
        "Solve graph and recursion-heavy problems",
        "Run timed mixed AI-role coding practice",
      ],
    },
    OS: {
      focus:
        "Learn system behavior, resource management, parallelism, and deployment-relevant fundamentals.",
      tasks: [
        "Study compute and process management basics",
        "Understand memory constraints for inference workloads",
        "Prepare deployment-focused OS interview answers",
      ],
    },
    DBMS: {
      focus:
        "Cover SQL, embeddings storage patterns, vector-aware retrieval workflows, and schema design.",
      tasks: [
        "Practice SQL and retrieval-friendly data modeling",
        "Study vector storage and metadata indexing basics",
        "Prepare data-access patterns for AI apps",
      ],
    },
    CN: {
      focus:
        "Understand APIs, latency, inference serving, and cloud-based communication basics.",
      tasks: [
        "Review API/network fundamentals for AI systems",
        "Understand latency and serving constraints",
        "Prepare inference architecture explanations",
      ],
    },
    Projects: {
      focus:
        "Build LLM, RAG, chatbot, and AI product prototypes with evaluation workflows.",
      tasks: [
        "Build one RAG or chatbot application",
        "Add evaluation and prompt iteration workflow",
        "Deploy and document the AI system",
      ],
    },
    Aptitude: {
      focus:
        "Practice reasoning and test-style quantitative problems for hiring rounds.",
      tasks: [
        "Cover quant basics and ratios",
        "Solve reasoning question sets",
        "Attempt a timed aptitude mock",
      ],
    },
    "Mock Interviews": {
      focus:
        "Prepare for AI system design, product tradeoffs, and implementation discussions.",
      tasks: [
        "Run an AI architecture mock",
        "Practice model/prompt tradeoff discussions",
        "Refine project demos and Q&A answers",
      ],
    },
  }),
  "ML Engineer": createMilestones({
    DSA: {
      focus:
        "Focus on coding fluency, arrays, trees, graphs, and performance-aware implementations.",
      tasks: [
        "Practice core coding interview patterns",
        "Solve graph/tree problems with performance focus",
        "Run a timed ML-role coding set",
      ],
    },
    OS: {
      focus:
        "Understand compute resources, scheduling, memory, and deployment infrastructure concepts.",
      tasks: [
        "Review processes, memory, and parallel execution",
        "Study resource planning for training/inference",
        "Prepare deployment-focused OS fundamentals",
      ],
    },
    DBMS: {
      focus:
        "Learn SQL, feature storage, experiment tracking data flows, and schema discipline.",
      tasks: [
        "Practice SQL and experiment-data querying",
        "Study feature store and schema design patterns",
        "Prepare ML data pipeline explanations",
      ],
    },
    CN: {
      focus:
        "Cover APIs, model serving, distributed systems basics, and infrastructure communication.",
      tasks: [
        "Review networking basics for model serving",
        "Understand APIs and service reliability",
        "Prepare distributed ML communication concepts",
      ],
    },
    Projects: {
      focus:
        "Ship end-to-end ML pipelines with training, evaluation, serving, and monitoring.",
      tasks: [
        "Build an end-to-end training pipeline",
        "Deploy a model inference endpoint",
        "Add monitoring and evaluation reporting",
      ],
    },
    Aptitude: {
      focus:
        "Practice reasoning and screening-test quantitative patterns.",
      tasks: [
        "Practice quantitative aptitude sets",
        "Work through reasoning problem banks",
        "Complete one timed aptitude simulation",
      ],
    },
    "Mock Interviews": {
      focus:
        "Prepare for ML system design, experiments, tradeoffs, and coding interviews.",
      tasks: [
        "Run ML system design mock interviews",
        "Practice experiment tradeoff discussions",
        "Do a combined coding and project mock",
      ],
    },
  }),
  "Data Scientist": createMilestones({
    DSA: {
      focus:
        "Build coding confidence with arrays, hashing, statistics-friendly data handling, and logic.",
      tasks: [
        "Practice Python problem solving and arrays",
        "Work through hashing and data manipulation problems",
        "Run timed coding practice for DS roles",
      ],
    },
    OS: {
      focus:
        "Learn practical compute fundamentals relevant to notebooks, jobs, and large-scale experiments.",
      tasks: [
        "Review compute and memory fundamentals",
        "Study practical execution for experiments",
        "Prepare systems basics for DS interviews",
      ],
    },
    DBMS: {
      focus:
        "Go deep on SQL, exploratory analysis queries, warehousing, and business-friendly schemas.",
      tasks: [
        "Master analytical SQL and joins",
        "Practice warehousing and reporting queries",
        "Prepare business-facing data model explanations",
      ],
    },
    CN: {
      focus:
        "Understand APIs, data access patterns, and collaboration with production systems.",
      tasks: [
        "Review APIs and service data flows",
        "Understand communication with analytics systems",
        "Prepare production collaboration examples",
      ],
    },
    Projects: {
      focus:
        "Build analytics, forecasting, experimentation, and storytelling-driven portfolio projects.",
      tasks: [
        "Build one analytics case-study project",
        "Build one forecasting/ML case study",
        "Prepare storytelling-focused presentation output",
      ],
    },
    Aptitude: {
      focus:
        "Practice quantitative aptitude, probability-style thinking, and business reasoning.",
      tasks: [
        "Practice quant and probability basics",
        "Solve reasoning and business logic sets",
        "Complete one timed aptitude mock",
      ],
    },
    "Mock Interviews": {
      focus:
        "Train for case discussions, statistics questions, SQL rounds, and project walkthroughs.",
      tasks: [
        "Run SQL and analytics mock rounds",
        "Practice statistics and experimentation Q&A",
        "Refine project storytelling and case answers",
      ],
    },
  }),
};

export const roadmapRoles = Object.keys(roadmapTemplates) as CareerRole[];

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function createKeywordTemplate(role: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole.includes("marketing")) {
    return createCustomMilestones([
      {
        title: "Market Research",
        focus:
          "Build a clear understanding of audience segments, competitors, market positioning, and consumer behavior for the role.",
        tasks: [
          "Analyze your target market and create audience personas",
          "Study competitor messaging, campaigns, and positioning",
          "Summarize key market insights for strategic decisions",
        ],
      },
      {
        title: "Brand & Communication",
        focus:
          "Strengthen messaging, storytelling, content planning, and brand consistency across channels.",
        tasks: [
          "Draft a clear brand positioning statement",
          "Create a messaging framework for one campaign",
          "Review high-performing brand communication examples",
        ],
      },
      {
        title: "Campaign Planning",
        focus:
          "Learn how to design, execute, and optimize campaigns across digital and offline marketing channels.",
        tasks: [
          "Plan one campaign with goals, audience, and budget",
          "Map channel strategy across social, email, and paid media",
          "Define KPIs and a reporting cadence for campaign success",
        ],
      },
      {
        title: "Analytics & Reporting",
        focus:
          "Develop skill in marketing analytics, conversion funnels, attribution, and ROI reporting.",
        tasks: [
          "Learn core metrics like CTR, CAC, ROAS, and conversion rate",
          "Build a sample reporting dashboard or campaign tracker",
          "Practice turning performance numbers into recommendations",
        ],
      },
      {
        title: "Tools & Platforms",
        focus:
          "Get hands-on with the tools commonly used in marketing roles and campaign execution.",
        tasks: [
          "Practice with one analytics platform and one CRM tool",
          "Explore ad manager, email automation, or social scheduling tools",
          "Document tool usage examples for interviews and resumes",
        ],
      },
      {
        title: "Portfolio & Case Studies",
        focus:
          "Create proof of work that shows campaign thinking, marketing strategy, and measurable business impact.",
        tasks: [
          "Build one portfolio-ready campaign case study",
          "Highlight metrics, learnings, and business outcomes",
          "Prepare portfolio stories for interviews and networking",
        ],
      },
      {
        title: "Mock Interviews",
        focus:
          "Prepare for role-specific interviews, strategic discussions, and communication-heavy evaluation rounds.",
        tasks: [
          "Practice interview answers on campaign strategy and execution",
          "Prepare STAR stories for leadership and collaboration",
          "Run one mock interview focused on marketing problem-solving",
        ],
      },
    ]);
  }

  if (normalizedRole.includes("product")) {
    return createCustomMilestones([
      {
        title: "Product Sense",
        focus:
          "Strengthen product thinking, user empathy, prioritization, and problem framing.",
        tasks: [
          "Break down one product using user pain points and outcomes",
          "Practice prioritization frameworks on a sample backlog",
          "Write product improvement recommendations with tradeoffs",
        ],
      },
      {
        title: "Market & User Research",
        focus:
          "Understand market signals, user research inputs, competitive positioning, and product opportunities.",
        tasks: [
          "Study one target segment and its user problems",
          "Compare competitors and identify whitespace opportunities",
          "Translate research findings into product hypotheses",
        ],
      },
      {
        title: "Metrics & Analytics",
        focus:
          "Develop fluency in north star metrics, funnels, experimentation, and product performance analysis.",
        tasks: [
          "Define activation, retention, and engagement metrics",
          "Analyze one product funnel and identify drop-off points",
          "Practice framing A/B test ideas with success criteria",
        ],
      },
      {
        title: "Execution & Planning",
        focus:
          "Build clarity in roadmap planning, stakeholder alignment, and feature delivery.",
        tasks: [
          "Draft one feature PRD or spec document",
          "Map dependencies, risks, and launch checklist items",
          "Practice communicating scope decisions to stakeholders",
        ],
      },
      {
        title: "Case Studies",
        focus:
          "Create portfolio-quality case studies that demonstrate product judgment and business impact.",
        tasks: [
          "Write one end-to-end product case study",
          "Include goals, tradeoffs, success metrics, and results",
          "Prepare concise product walkthroughs for interviews",
        ],
      },
      {
        title: "Communication & Leadership",
        focus:
          "Prepare for collaboration-heavy environments with clear writing and confident decision-making.",
        tasks: [
          "Practice leadership and conflict-resolution stories",
          "Refine written summaries for product recommendations",
          "Run one mock stakeholder communication exercise",
        ],
      },
      {
        title: "Mock Interviews",
        focus:
          "Prepare for product sense, execution, analytics, and behavioral interview loops.",
        tasks: [
          "Run one product sense mock interview",
          "Practice one metrics and execution round",
          "Refine behavioral answers with structured examples",
        ],
      },
    ]);
  }

  return createCustomMilestones([
    {
      title: "Core Knowledge",
      focus:
        `Build strong domain understanding and fundamentals required for a ${role} role.`,
      tasks: [
        `List the top skills and knowledge areas needed for ${role}`,
        "Study the core concepts and day-to-day expectations for the role",
        "Summarize what great performance looks like in this position",
      ],
    },
    {
      title: "Role-Specific Skills",
      focus:
        `Develop the practical skills, tools, and workflows most relevant to becoming a ${role}.`,
      tasks: [
        `Identify the most important hard skills for ${role}`,
        "Practice those skills through guided exercises or coursework",
        "Track progress on the top role-specific competencies",
      ],
    },
    {
      title: "Tools & Platforms",
      focus:
        "Get hands-on with the software, systems, and platforms commonly used in the target role.",
      tasks: [
        "Pick the top tools used in the role and learn their basics",
        "Complete one practical task in each key tool",
        "Document tool proficiency for interviews and resume use",
      ],
    },
    {
      title: "Projects & Proof of Work",
      focus:
        "Create evidence of skill through projects, case studies, campaigns, or portfolio-ready work.",
      tasks: [
        "Build one portfolio-quality piece of work",
        "Quantify outcomes, impact, or learning from that work",
        "Write resume bullets and talking points from the project",
      ],
    },
    {
      title: "Communication & Strategy",
      focus:
        "Strengthen how you present ideas, explain decisions, and work across teams.",
      tasks: [
        "Practice written summaries and role-specific communication",
        "Prepare examples showing teamwork and problem solving",
        "Refine structured answers for scenario-based questions",
      ],
    },
    {
      title: "Industry Awareness",
      focus:
        "Stay informed about trends, standards, and expectations shaping this career path.",
      tasks: [
        "Follow industry leaders, companies, and relevant updates",
        "Track trends affecting hiring and role expectations",
        "Prepare informed opinions on current industry topics",
      ],
    },
    {
      title: "Mock Interviews",
      focus:
        "Prepare for interviews with role-specific questions, examples, and confidence under pressure.",
      tasks: [
        `Practice interview questions tailored to ${role}`,
        "Refine stories that show strengths and achievements",
        "Run one full mock interview and capture feedback",
      ],
    },
  ]);
}

export function createRoadmapFromRole(role: CareerRole) {
  const trimmedRole = role.trim();

  if (!trimmedRole) {
    return createKeywordTemplate("General Career Goal");
  }

  return roadmapTemplates[trimmedRole] ?? createKeywordTemplate(trimmedRole);
}
