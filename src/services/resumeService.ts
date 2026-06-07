import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import mammoth from "mammoth";
import type {
  ResumeAnalysisRecord,
  TailoredResumeRecord,
  UserProfileRecord,
} from "../types";
import { db } from "./firebase";

interface GeminiCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface GeminiApiErrorPayload {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

type GeminiPart =
  | {
      text: string;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

type ResumeInputKind = "pdf" | "image" | "text" | "docx";

const supportedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const supportedTextMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/html",
  "text/xml",
  "application/rtf",
]);

const extensionToMimeType: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  html: "text/html",
  htm: "text/html",
  xml: "text/xml",
  rtf: "application/rtf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const resumeAnalysisSystemInstruction = `
You are KeepUP Resume Analyzer.
Analyze student resumes for internships and entry-level placement roles.
Evaluate projects, skills, ATS readiness, and missing sections.
Be specific, practical, and hiring-oriented.
Return balanced analysis, not generic praise.
`.trim();

const resumeAnalysisSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A short summary of the resume's current quality.",
    },
    atsScore: {
      type: "integer",
      description: "An ATS readiness score from 0 to 100.",
    },
    projects: {
      type: "array",
      description: "A list of notable project observations from the resume.",
      items: { type: "string" },
    },
    skills: {
      type: "array",
      description: "A list of important skills detected in the resume.",
      items: { type: "string" },
    },
    missingSections: {
      type: "array",
      description: "Important missing or weak resume sections.",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      description: "Specific recommendations to improve the resume.",
      items: { type: "string" },
    },
    strengths: {
      type: "array",
      description: "Strong points already present in the resume.",
      items: { type: "string" },
    },
  },
  required: [
    "summary",
    "atsScore",
    "projects",
    "skills",
    "missingSections",
    "recommendations",
    "strengths",
  ],
} as const;

const tailoredResumeSchema = {
  type: "object",
  properties: {
    matchSummary: { type: "string" },
    tailoredProfessionalSummary: { type: "string" },
    tailoredSkills: {
      type: "array",
      items: { type: "string" },
    },
    rewrittenProjectBullets: {
      type: "array",
      items: { type: "string" },
    },
    missingKeywords: {
      type: "array",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "matchSummary",
    "tailoredProfessionalSummary",
    "tailoredSkills",
    "rewrittenProjectBullets",
    "missingKeywords",
    "recommendations",
  ],
} as const;

function normalizeTimestamp(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }

  return null;
}

function getNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeTailoredResume(value: unknown): TailoredResumeRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    targetJobTitle:
      typeof record.targetJobTitle === "string" ? record.targetJobTitle : "",
    jobDescription:
      typeof record.jobDescription === "string" ? record.jobDescription : "",
    matchSummary:
      typeof record.matchSummary === "string" ? record.matchSummary : "",
    tailoredProfessionalSummary:
      typeof record.tailoredProfessionalSummary === "string"
        ? record.tailoredProfessionalSummary
        : "",
    tailoredSkills: getStringArray(record.tailoredSkills),
    rewrittenProjectBullets: getStringArray(record.rewrittenProjectBullets),
    missingKeywords: getStringArray(record.missingKeywords),
    recommendations: getStringArray(record.recommendations),
    updatedAt: normalizeTimestamp(record.updatedAt),
  };
}

function extractGeminiText(response: GeminiResponse) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || ""
  );
}

function getResumeModelCandidates() {
  const preferredModel = import.meta.env.VITE_GEMINI_MODEL;

  return Array.from(
    new Set(
      [
        preferredModel,
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
      ].filter((model): model is string => Boolean(model?.trim())),
    ),
  );
}

function isRetryableGeminiStatus(status: number) {
  return status === 429 || status === 500 || status === 503 || status === 504;
}

function parseGeminiError(
  status: number,
  errorText: string,
): { code: number; message: string; statusText: string } {
  try {
    const parsed = JSON.parse(errorText) as GeminiApiErrorPayload;
    return {
      code: parsed.error?.code ?? status,
      message: parsed.error?.message || "Unknown Gemini API error.",
      statusText: parsed.error?.status || "UNKNOWN",
    };
  } catch {
    return {
      code: status,
      message: errorText || "Unknown Gemini API error.",
      statusText: "UNKNOWN",
    };
  }
}

function formatResumeGeminiError(error: {
  code: number;
  message: string;
  statusText: string;
}) {
  if (error.code === 401 || error.code === 403) {
    return "Gemini access failed. Please verify your API key and model permissions.";
  }

  if (error.code === 404) {
    return "The configured Gemini model was not found. Update VITE_GEMINI_MODEL or use a supported model.";
  }

  if (error.code === 429 || error.code === 503) {
    return "Gemini is temporarily under heavy load. We retried automatically, but the service is still busy. Please try again in a minute.";
  }

  if (error.code >= 500) {
    return "Gemini is temporarily unavailable right now. Please try the resume analysis again shortly.";
  }

  return `Gemini resume analysis failed: ${error.message}`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function requestResumeAnalysisFromGemini(
  apiKey: string,
  parts: GeminiPart[],
) {
  const models = getResumeModelCandidates();
  let lastError: { code: number; message: string; statusText: string } | null = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: resumeAnalysisSystemInstruction,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: resumeAnalysisSchema,
            },
          }),
        },
      );

      if (response.ok) {
        return (await response.json()) as GeminiResponse;
      }

      const errorText = await response.text();
      const parsedError = parseGeminiError(response.status, errorText);
      lastError = parsedError;

      if (!isRetryableGeminiStatus(response.status)) {
        throw new Error(formatResumeGeminiError(parsedError));
      }

      const hasMoreRetries = attempt < 2 || model !== models[models.length - 1];

      if (!hasMoreRetries) {
        break;
      }

      await wait(attempt * 900);
    }
  }

  throw new Error(
    formatResumeGeminiError(
      lastError ?? {
        code: 503,
        message: "Gemini did not return a response.",
        statusText: "UNAVAILABLE",
      },
    ),
  );
}

function normalizeResumeAnalysis(
  documentId: string,
  data: Record<string, unknown>,
): ResumeAnalysisRecord {
  const atsScore = getNumber(data.atsScore ?? data.score);

  return {
    id: documentId,
    fileName: typeof data.fileName === "string" ? data.fileName : "Resume.pdf",
    targetRole: typeof data.targetRole === "string" ? data.targetRole : "",
    summary: typeof data.summary === "string" ? data.summary : "",
    atsScore,
    score: atsScore,
    projects: getStringArray(data.projects),
    skills: getStringArray(data.skills),
    missingSections: getStringArray(data.missingSections),
    recommendations: getStringArray(data.recommendations),
    strengths: getStringArray(data.strengths),
    tailoredResume: normalizeTailoredResume(data.tailoredResume),
    analyzedAt: normalizeTimestamp(data.analyzedAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function getFileExtension(fileName: string) {
  const lastSegment = fileName.toLowerCase().split(".").pop();
  return lastSegment ?? "";
}

function getResumeFileMimeType(file: File) {
  if (file.type) {
    return file.type.toLowerCase();
  }

  const extension = getFileExtension(file.name);
  return extensionToMimeType[extension] ?? "";
}

function getResumeInputKind(file: File): ResumeInputKind | null {
  const mimeType = getResumeFileMimeType(file);
  const extension = getFileExtension(file.name);

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    supportedImageMimeTypes.has(mimeType) ||
    ["jpg", "jpeg", "png", "webp"].includes(extension)
  ) {
    return "image";
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return "docx";
  }

  if (
    supportedTextMimeTypes.has(mimeType) ||
    ["txt", "md", "markdown", "html", "htm", "xml", "rtf"].includes(extension)
  ) {
    return "text";
  }

  return null;
}

async function buildResumeAnalysisParts(
  file: File,
  prompt: string,
): Promise<{ parts: GeminiPart[]; source: string }> {
  const inputKind = getResumeInputKind(file);
  const mimeType = getResumeFileMimeType(file);

  if (!inputKind) {
    throw new Error(
      "Unsupported file type. Upload a PDF, DOCX, JPG, JPEG, PNG, WEBP, TXT, MD, HTML, XML, or RTF resume.",
    );
  }

  if (inputKind === "pdf" || inputKind === "image") {
    const arrayBuffer = await file.arrayBuffer();

    return {
      parts: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType,
            data: arrayBufferToBase64(arrayBuffer),
          },
        },
      ],
      source: inputKind === "pdf" ? "gemini-pdf" : "gemini-image",
    };
  }

  if (inputKind === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extractedText = result.value.trim();

    if (!extractedText) {
      throw new Error(
        "We couldn't extract readable text from this DOCX file. Try saving it again as DOCX or upload a PDF version.",
      );
    }

    return {
      parts: [
        {
          text: `${prompt}

Resume file name: ${file.name}
Resume format: DOCX

Resume content:
${extractedText}`,
        },
      ],
      source: "gemini-docx",
    };
  }

  const extractedText = (await file.text()).trim();

  if (!extractedText) {
    throw new Error("This file looks empty. Please upload a resume with readable content.");
  }

  return {
    parts: [
      {
        text: `${prompt}

Resume file name: ${file.name}
Resume format: text

Resume content:
${extractedText}`,
      },
    ],
    source: "gemini-text",
  };
}

async function getProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfileRecord;
}

function buildResumePrompt(targetRole: string, profile: UserProfileRecord | null) {
  return `
Analyze this resume for a college student preparing for placements.

Context:
- Target role: ${targetRole || profile?.targetRole || "Not provided"}
- Student name: ${profile?.name || "Not provided"}
- Degree: ${profile?.degree || "Not provided"}
- University: ${profile?.university || "Not provided"}
- Graduation year: ${profile?.graduationYear || "Not provided"}

Tasks:
- Extract and evaluate the projects.
- Extract and evaluate the skills.
- Identify missing or weak sections.
- Give an ATS score from 0 to 100.
- Provide specific recommendations to improve the resume for the target role.
- Highlight current strengths.
`.trim();
}

function buildTailoredResumePrompt(
  analysis: ResumeAnalysisRecord,
  jobDescription: string,
  targetJobTitle: string,
  profile: UserProfileRecord | null,
) {
  return `
Tailor this student's resume for a specific job description.

Student context:
- Name: ${profile?.name || "Not provided"}
- Degree: ${profile?.degree || "Not provided"}
- University: ${profile?.university || "Not provided"}
- Base target role: ${analysis.targetRole || profile?.targetRole || "Not provided"}

Current resume analysis:
- Summary: ${analysis.summary}
- ATS score: ${analysis.atsScore}
- Projects: ${analysis.projects.join(" | ") || "None provided"}
- Skills: ${analysis.skills.join(" | ") || "None provided"}
- Strengths: ${analysis.strengths.join(" | ") || "None provided"}
- Current recommendations: ${analysis.recommendations.join(" | ") || "None provided"}

Target job title: ${targetJobTitle || "Not provided"}

Job description:
${jobDescription}

Tasks:
- Explain the overall resume-to-job match briefly.
- Rewrite a professional summary tailored to the job description.
- List the skills that should be emphasized.
- Rewrite project bullets to align better with the job description.
- Identify important missing keywords from the job description.
- Give concrete tailoring recommendations before the student applies.

Do not invent fake experience or achievements. Reframe only what is realistically supported by the current resume analysis.
`.trim();
}

async function requestTailoredResumeFromGemini(
  apiKey: string,
  prompt: string,
) {
  const models = getResumeModelCandidates();
  let lastError: { code: number; message: string; statusText: string } | null = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: resumeAnalysisSystemInstruction,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: tailoredResumeSchema,
            },
          }),
        },
      );

      if (response.ok) {
        return (await response.json()) as GeminiResponse;
      }

      const errorText = await response.text();
      const parsedError = parseGeminiError(response.status, errorText);
      lastError = parsedError;

      if (!isRetryableGeminiStatus(response.status)) {
        throw new Error(formatResumeGeminiError(parsedError));
      }

      const hasMoreRetries = attempt < 2 || model !== models[models.length - 1];

      if (!hasMoreRetries) {
        break;
      }

      await wait(attempt * 900);
    }
  }

  throw new Error(
    formatResumeGeminiError(
      lastError ?? {
        code: 503,
        message: "Gemini did not return a tailored resume response.",
        statusText: "UNAVAILABLE",
      },
    ),
  );
}

export function subscribeToResumeAnalysis(
  uid: string,
  onData: (analysis: ResumeAnalysisRecord | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "users", uid, "resume", "current"),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(
        normalizeResumeAnalysis(
          snapshot.id,
          snapshot.data() as Record<string, unknown>,
        ),
      );
    },
    (error) => onError(error),
  );
}

export async function analyzeResume(
  uid: string,
  file: File,
  targetRole = "",
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add your Gemini API key before using Resume Analyzer.",
    );
  }

  const inputKind = getResumeInputKind(file);

  if (!inputKind) {
    throw new Error(
      "Please upload a PDF, DOCX, JPG, JPEG, PNG, WEBP, TXT, MD, HTML, XML, or RTF resume.",
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Please upload a resume smaller than 10 MB.");
  }

  const profile = await getProfile(uid);
  const { parts, source } = await buildResumeAnalysisParts(
    file,
    buildResumePrompt(targetRole, profile),
  );
  const data = await requestResumeAnalysisFromGemini(
    apiKey,
    parts,
  );
  const rawText = extractGeminiText(data);

  if (!rawText) {
    throw new Error("Gemini did not return a resume analysis.");
  }

  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const analysis = normalizeResumeAnalysis("current", {
    ...parsed,
    fileName: file.name,
    targetRole: targetRole || profile?.targetRole || "",
    analyzedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await setDoc(
    doc(db, "users", uid, "resume", "current"),
    {
      fileName: analysis.fileName,
      targetRole: analysis.targetRole,
      summary: analysis.summary,
      atsScore: analysis.atsScore,
      score: analysis.score,
      projects: analysis.projects,
      skills: analysis.skills,
      missingSections: analysis.missingSections,
      recommendations: analysis.recommendations,
      strengths: analysis.strengths,
      analyzedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source,
    },
    { merge: true },
  );

  return analysis;
}

export async function tailorResumeToJobDescription(
  uid: string,
  jobDescription: string,
  targetJobTitle = "",
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add your Gemini API key before tailoring the resume.",
    );
  }

  if (!jobDescription.trim()) {
    throw new Error("Paste a job description first so KeepUP can tailor your resume.");
  }

  const [profile, analysisSnapshot] = await Promise.all([
    getProfile(uid),
    getDoc(doc(db, "users", uid, "resume", "current")),
  ]);

  if (!analysisSnapshot.exists()) {
    throw new Error(
      "Analyze your resume first before generating a job-specific tailored version.",
    );
  }

  const analysis = normalizeResumeAnalysis(
    analysisSnapshot.id,
    analysisSnapshot.data() as Record<string, unknown>,
  );

  const data = await requestTailoredResumeFromGemini(
    apiKey,
    buildTailoredResumePrompt(analysis, jobDescription, targetJobTitle, profile),
  );
  const rawText = extractGeminiText(data);

  if (!rawText) {
    throw new Error("Gemini did not return a tailored resume result.");
  }

  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const tailoredResume = normalizeTailoredResume({
    ...parsed,
    targetJobTitle,
    jobDescription,
    updatedAt: new Date().toISOString(),
  });

  if (!tailoredResume) {
    throw new Error("Unable to normalize the tailored resume output.");
  }

  await setDoc(
    doc(db, "users", uid, "resume", "current"),
    {
      tailoredResume: {
        targetJobTitle: tailoredResume.targetJobTitle,
        jobDescription: tailoredResume.jobDescription,
        matchSummary: tailoredResume.matchSummary,
        tailoredProfessionalSummary: tailoredResume.tailoredProfessionalSummary,
        tailoredSkills: tailoredResume.tailoredSkills,
        rewrittenProjectBullets: tailoredResume.rewrittenProjectBullets,
        missingKeywords: tailoredResume.missingKeywords,
        recommendations: tailoredResume.recommendations,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return tailoredResume;
}
