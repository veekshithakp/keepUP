import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  updateDoc,
} from "firebase/firestore";
import type {
  AnalyzedJobApplicationLinkResult,
  ApplicationStatus,
  CreateJobApplicationInput,
  JobApplication,
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

const applicationLinkAnalysisSchema = {
  type: "object",
  properties: {
    company: { type: "string" },
    role: { type: "string" },
    location: { type: "string" },
  },
  required: ["company", "role", "location"],
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

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    value === "Applied" ||
    value === "OA" ||
    value === "Interview" ||
    value === "HR Round" ||
    value === "Rejected" ||
    value === "Offer"
  );
}

function mapApplication(
  documentId: string,
  data: Record<string, unknown>,
): JobApplication {
  return {
    id: documentId,
    company: typeof data.company === "string" ? data.company : "Unknown Company",
    role: typeof data.role === "string" ? data.role : "Unknown Role",
    location: typeof data.location === "string" ? data.location : "Unknown Location",
    dateApplied:
      typeof data.dateApplied === "string" ? data.dateApplied : new Date().toISOString(),
    status: isApplicationStatus(data.status) ? data.status : "Applied",
    applicationUrl:
      typeof data.applicationUrl === "string" ? data.applicationUrl : null,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function titleCaseFromSlug(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function guessCompanyFromUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  const hostParts = host.split(".");
  const pathParts = url.pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (host.includes("greenhouse.io") && pathParts[0]) {
    return titleCaseFromSlug(pathParts[0]);
  }

  if (host.includes("lever.co") && pathParts[0]) {
    return titleCaseFromSlug(pathParts[0]);
  }

  if (host.includes("ashbyhq.com") && pathParts[0]) {
    return titleCaseFromSlug(pathParts[0]);
  }

  if (host.includes("myworkdayjobs.com")) {
    if (hostParts[0] && hostParts[0] !== "www") {
      return titleCaseFromSlug(hostParts[0]);
    }

    if (pathParts[0]) {
      return titleCaseFromSlug(pathParts[0]);
    }
  }

  if (hostParts.length >= 2) {
    return titleCaseFromSlug(hostParts[hostParts.length - 2]);
  }

  return "Unknown Company";
}

function guessRoleFromUrl(url: URL) {
  const pathParts = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean);
  const lastUsefulSegment = [...pathParts]
    .reverse()
    .find((part) => !/^\d+$/.test(part) && part.length > 2);

  if (!lastUsefulSegment) {
    return "Unknown Role";
  }

  const cleaned = lastUsefulSegment
    .replace(/\.(html|htm)$/i, "")
    .replace(/jobs?/gi, "")
    .replace(/apply/gi, "")
    .trim();

  return cleaned ? titleCaseFromSlug(cleaned) : "Unknown Role";
}

function guessLocationFromText(value: string) {
  const match = value.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z][a-z]+|Remote|Hybrid|Bengaluru|Bangalore|Hyderabad|Pune|Chennai|Mumbai|Delhi|Noida|Gurugram)\b/,
  );

  return match?.[0] ?? "Unknown Location";
}

async function fetchApplicationMetadata(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = (await response.text()).slice(0, 160000);
    const title =
      html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ??
      html.match(/property=["']og:title["'][^>]*content=["'](.*?)["']/i)?.[1]?.trim() ??
      "";
    const description =
      html
        .match(/name=["']description["'][^>]*content=["'](.*?)["']/i)?.[1]
        ?.trim() ??
      html
        .match(/property=["']og:description["'][^>]*content=["'](.*?)["']/i)?.[1]
        ?.trim() ??
      "";

    return { title, description };
  } catch {
    return null;
  }
}

function extractGeminiText(response: GeminiResponse) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || ""
  );
}

function getApplicationAnalysisModelCandidates() {
  const preferredModel = import.meta.env.VITE_GEMINI_MODEL;

  return Array.from(
    new Set(
      [preferredModel, "gemini-2.5-flash-lite", "gemini-2.5-flash"].filter(
        (model): model is string => Boolean(model?.trim()),
      ),
    ),
  );
}

async function requestApplicationLinkAnalysisFromGemini(
  applicationUrl: string,
  metadata: { title: string; description: string } | null,
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const models = getApplicationAnalysisModelCandidates();
  const prompt = `
You are analyzing a job application link for KeepUP.
Infer the most likely company, role, and location from the URL and any provided page metadata.
If location is not visible, return "Unknown Location".
Keep values concise and human-readable.

Application URL: ${applicationUrl}
Page title: ${metadata?.title || "Not available"}
Page description: ${metadata?.description || "Not available"}
`.trim();

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: applicationLinkAnalysisSchema,
          },
        }),
      },
    );

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = extractGeminiText(payload);

    if (!text) {
      continue;
    }

    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return {
        company:
          typeof parsed.company === "string" && parsed.company.trim()
            ? parsed.company.trim()
            : null,
        role:
          typeof parsed.role === "string" && parsed.role.trim()
            ? parsed.role.trim()
            : null,
        location:
          typeof parsed.location === "string" && parsed.location.trim()
            ? parsed.location.trim()
            : null,
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function analyzeJobApplicationLink(
  applicationUrl: string,
): Promise<AnalyzedJobApplicationLinkResult> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(applicationUrl.trim());
  } catch {
    throw new Error("Enter a valid application link starting with http or https.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Only http and https application links are supported.");
  }

  const metadata = await fetchApplicationMetadata(parsedUrl.toString());
  const geminiResult = await requestApplicationLinkAnalysisFromGemini(
    parsedUrl.toString(),
    metadata,
  );

  if (geminiResult?.company && geminiResult.role && geminiResult.location) {
    return {
      company: geminiResult.company,
      role: geminiResult.role,
      location: geminiResult.location,
      applicationUrl: parsedUrl.toString(),
      analysisSource: "gemini",
    };
  }

  const combinedText = [metadata?.title, metadata?.description]
    .filter(Boolean)
    .join(" ");

  return {
    company: guessCompanyFromUrl(parsedUrl),
    role: guessRoleFromUrl(parsedUrl),
    location: combinedText ? guessLocationFromText(combinedText) : "Unknown Location",
    applicationUrl: parsedUrl.toString(),
    analysisSource: "heuristic",
  };
}

function getReferenceDate(application: JobApplication) {
  const candidates = [
    application.dateApplied,
    application.updatedAt,
    application.createdAt,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const nextDate = new Date(candidate as string);

    if (!Number.isNaN(nextDate.getTime())) {
      return nextDate.getTime();
    }
  }

  return 0;
}

export function subscribeToApplications(
  uid: string,
  onData: (applications: JobApplication[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "applications"),
    (snapshot) => {
      const applications = snapshot.docs
        .map((document) =>
          mapApplication(document.id, document.data() as Record<string, unknown>),
        )
        .sort((left, right) => getReferenceDate(right) - getReferenceDate(left));

      onData(applications);
    },
    (error) => onError(error),
  );
}

export async function createJobApplication(
  uid: string,
  input: CreateJobApplicationInput,
) {
  await addDoc(collection(db, "users", uid, "applications"), {
    company: input.company.trim(),
    role: input.role.trim(),
    location: input.location.trim(),
    dateApplied: input.dateApplied,
    status: input.status,
    applicationUrl: input.applicationUrl?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateJobApplicationStatus(
  uid: string,
  applicationId: string,
  status: ApplicationStatus,
) {
  await updateDoc(doc(db, "users", uid, "applications", applicationId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
