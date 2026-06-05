export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: any;
    request_id?: string | null;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: any;
  requestId?: string | null;

  constructor(opts: { status: number; code: string; message: string; details?: any; requestId?: string | null }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.requestId = opts.requestId;
  }
}

const RESERVED_DETAIL_KEYS = new Set(["code", "status", "request_id", "requestId", "type", "title"]);
const UNLABELED_DETAIL_KEYS = new Set(["non_field_errors", "__all__", "detail", "message"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function humanizeDetailKey(path?: string) {
  const normalized = String(path || "")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !UNLABELED_DETAIL_KEYS.has(segment));

  if (!normalized.length) return "";

  return normalized.join(" ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function flattenApiErrorDetails(details: unknown, parentKey = ""): string[] {
  if (details === undefined || details === null) return [];

  if (Array.isArray(details)) {
    return details.flatMap((item) => flattenApiErrorDetails(item, parentKey));
  }

  if (isRecord(details)) {
    return Object.entries(details).flatMap(([key, value]) => {
      if (RESERVED_DETAIL_KEYS.has(key)) return [];
      const nextParent = UNLABELED_DETAIL_KEYS.has(key)
        ? parentKey
        : parentKey
          ? `${parentKey}.${key}`
          : key;
      return flattenApiErrorDetails(value, nextParent);
    });
  }

  const message = String(details).trim();
  if (!message) return [];

  const label = humanizeDetailKey(parentKey);
  return label ? [`${label}: ${message}`] : [message];
}

function extractStructuredDetails(payload: any) {
  const explicitDetails = payload?.error?.details ?? payload?.details;
  if (explicitDetails !== undefined && explicitDetails !== null) return explicitDetails;
  if (!isRecord(payload)) return null;

  const entries = Object.entries(payload).filter(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (RESERVED_DETAIL_KEYS.has(key)) return false;
    if (key === "error") return false;
    return true;
  });

  if (!entries.length) return null;

  const onlyDirectMessageKeys = entries.every(([key]) =>
    key === "detail" || key === "message" || key === "error_description",
  );

  if (onlyDirectMessageKeys) return null;

  return Object.fromEntries(entries);
}

function defaultApiErrorMessage(status: number) {
  if (status === 0) return "Nao foi possivel concluir a solicitacao.";
  if (status === 400) return "Confira os dados informados e tente novamente.";
  if (status === 401) return "Sua autenticacao nao foi aceita. Faca login novamente.";
  if (status === 403) return "Voce nao tem permissao para realizar esta acao.";
  if (status === 404) return "O recurso solicitado nao foi encontrado.";
  if (status === 409) return "Nao foi possivel concluir a acao por conflito de dados.";
  if (status === 422) return "Os dados informados sao invalidos.";
  if (status === 429) return "Muitas tentativas. Aguarde e tente novamente.";
  if (status >= 500) return "O servidor encontrou um problema ao processar a solicitacao.";
  return "Nao foi possivel concluir a solicitacao.";
}

export function parseApiError(status: number, payload: any): ApiError {
  const code = payload?.error?.code || payload?.code || "ERROR";
  const details = extractStructuredDetails(payload);
  const detailMessages = flattenApiErrorDetails(details);
  const directMessages = [
    payload?.error?.message,
    payload?.error?.detail,
    payload?.detail,
    payload?.message,
    payload?.error_description,
    typeof payload?.error === "string" ? payload.error : null,
    typeof payload === "string" ? payload : null,
  ]
    .map(asMessage)
    .filter((value): value is string => Boolean(value));
  const message = detailMessages[0] || directMessages[0] || defaultApiErrorMessage(status);
  const requestId = payload?.error?.request_id ?? payload?.request_id ?? null;
  return new ApiError({ status, code, message, details, requestId });
}

function isAbortError(error: unknown): error is Error {
  return typeof error === "object" && error !== null && "name" in error && (error as { name?: string }).name === "AbortError";
}

export function parseTransportError(error: unknown): Error {
  if (error instanceof ApiError) return error;
  if (isAbortError(error)) return error;

  const originalMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message || "").trim()
      : "";

  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: isOffline
      ? "Voce esta sem conexao com a internet. Verifique a rede e tente novamente."
      : "Nao foi possivel conectar ao servidor. Verifique a conexao e tente novamente.",
    details: originalMessage ? { original_message: originalMessage } : null,
    requestId: null,
  });
}

export function emitApiError(err: ApiError) {
  window.dispatchEvent(
    new CustomEvent("lawflow:api-error", {
      detail: {
        status: err.status,
        code: err.code,
        message: err.message,
        requestId: err.requestId,
      },
    })
  );
}
