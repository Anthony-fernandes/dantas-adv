import { api, getAccessToken, getActiveTenantId } from '@/integrations/api/client';
import type { DocumentFile } from '@/types/models';

export type DocumentKind = 'pdf' | 'image' | 'video' | 'audio' | 'doc' | 'sheet' | 'text' | 'archive' | 'other';

export type DocumentGroup = {
  key: string;
  latest: DocumentFile;
  versions: DocumentFile[];
};

export type UploadQueueItem = {
  id: string;
  file: File;
  title: string;
  category: string;
  processId?: string;
  clientId?: string;
  accessLevel: 'TENANT' | 'ROLES';
  allowedRoles: string[];
  progress: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  error?: string;
};

export const DOCUMENT_CATEGORY_OPTIONS = [
  { value: 'peticao', label: 'Petições' },
  { value: 'contrato', label: 'Contratos' },
  { value: 'prova', label: 'Provas' },
  { value: 'cliente', label: 'Documentos do cliente' },
  { value: 'interno', label: 'Interno' },
  { value: 'laudo', label: 'Laudos' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'geral', label: 'Geral' },
];

export function getDocumentUrl(document: Pick<DocumentFile, 'file_url' | 'file_download_url'>) {
  return document.file_download_url || document.file_url || '';
}

export function getDocumentExtension(document: Pick<DocumentFile, 'filename' | 'title' | 'file_url' | 'file_download_url'>) {
  const source = [document.filename, document.title, document.file_url, document.file_download_url].find(Boolean) || '';
  const match = String(source).toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return match?.[1] || '';
}

export function getDocumentKind(document: Pick<DocumentFile, 'content_type' | 'filename' | 'title' | 'file_url' | 'file_download_url'>): DocumentKind {
  const contentType = String(document.content_type || '').toLowerCase();
  const extension = getDocumentExtension(document);

  if (contentType.includes('pdf') || extension === 'pdf') return 'pdf';
  if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (contentType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(extension)) return 'video';
  if (contentType.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'sheet';
  if (contentType.startsWith('text/') || ['txt', 'md'].includes(extension)) return 'text';
  if (['zip', 'rar', '7z'].includes(extension)) return 'archive';
  return 'other';
}

export function canPreviewInline(document: DocumentFile) {
  return ['pdf', 'image', 'video', 'audio', 'text'].includes(getDocumentKind(document));
}

export function formatFileSize(value?: number | null) {
  if (!value || value <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDocumentDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export function groupDocuments(documents: DocumentFile[]) {
  const map = new Map<string, DocumentFile[]>();

  documents.forEach((document) => {
    const key = document.group_id || document.id;
    const current = map.get(key) ?? [];
    current.push(document);
    map.set(key, current);
  });

  return Array.from(map.entries())
    .map(([key, versions]) => {
      const ordered = [...versions].sort((left, right) => {
        const versionCompare = Number(right.version || 0) - Number(left.version || 0);
        if (versionCompare !== 0) return versionCompare;
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
      const latest = ordered.find((item) => item.is_latest) || ordered[0];
      return { key, latest, versions: ordered } satisfies DocumentGroup;
    })
    .sort((left, right) => new Date(right.latest.created_at).getTime() - new Date(left.latest.created_at).getTime());
}

export function normalizeSearch(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterDocumentGroups(
  groups: DocumentGroup[],
  options: {
    search: string;
    fileType: string;
    category: string;
    responsible: string;
    dateRange: string;
    sortBy: string;
    processNumber?: string | null;
    clientName?: string | null;
    resolveProcessLabel?: (document: DocumentFile) => string | null | undefined;
    resolveClientLabel?: (document: DocumentFile) => string | null | undefined;
  },
) {
  const search = normalizeSearch(options.search);
  const now = Date.now();

  const filtered = groups.filter((group) => {
    const latest = group.latest;
    const kind = getDocumentKind(latest);

    if (options.fileType !== 'all' && kind !== options.fileType) return false;
    if (options.category !== 'all' && String(latest.category || 'geral') !== options.category) return false;
    if (options.responsible !== 'all' && String(latest.uploaded_by || 'escritorio') !== options.responsible) return false;

    if (options.dateRange !== 'all') {
      const createdAt = new Date(latest.created_at).getTime();
      const diffDays = Math.floor((now - createdAt) / 86400000);
      if (options.dateRange === 'today' && diffDays !== 0) return false;
      if (options.dateRange === '7d' && diffDays > 7) return false;
      if (options.dateRange === '30d' && diffDays > 30) return false;
    }

    if (!search) return true;

    const haystack = normalizeSearch(
      [
        latest.title,
        latest.filename,
        latest.category,
        latest.uploaded_by,
        options.resolveProcessLabel?.(latest) ?? options.processNumber,
        options.resolveClientLabel?.(latest) ?? options.clientName,
      ].join(' '),
    );

    return haystack.includes(search);
  });

  return [...filtered].sort((left, right) => {
    if (options.sortBy === 'name') {
      return String(left.latest.title || left.latest.filename || '').localeCompare(String(right.latest.title || right.latest.filename || ''));
    }
    if (options.sortBy === 'size') {
      return Number(right.latest.file_size || 0) - Number(left.latest.file_size || 0);
    }
    if (options.sortBy === 'type') {
      return getDocumentKind(left.latest).localeCompare(getDocumentKind(right.latest));
    }
    return new Date(right.latest.created_at).getTime() - new Date(left.latest.created_at).getTime();
  });
}

function buildApiUrl(path: string) {
  const rawBase = String((import.meta as any).env?.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  return rawBase ? `${rawBase}/api${path.startsWith('/') ? path : `/${path}`}` : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function buildAuthHeaders() {
  const headers: Record<string, string> = {};
  const access = getAccessToken();
  const tenantId = getActiveTenantId();
  if (access) headers.Authorization = `Bearer ${access}`;
  if (access && tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
}

async function uploadDocumentWithProgress(
  path: string,
  formData: FormData,
  onProgress: (progress: number) => void,
) {
  return await new Promise<DocumentFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildApiUrl(path), true);

    Object.entries(buildAuthHeaders()).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const content = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(content as DocumentFile);
        return;
      }
      reject(new Error(content?.detail || 'Falha ao enviar arquivo.'));
    };

    xhr.onerror = () => reject(new Error('Falha de rede durante o upload.'));
    xhr.send(formData);
  });
}

export async function uploadProcessDocumentWithProgress(
  processId: string,
  formData: FormData,
  onProgress: (progress: number) => void,
) {
  return await uploadDocumentWithProgress(`/processes/${processId}/documents/`, formData, onProgress);
}

export async function uploadGlobalDocumentWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void,
) {
  return await uploadDocumentWithProgress('/documents/', formData, onProgress);
}

export async function fetchDocumentAsFile(document: DocumentFile, fallbackName?: string) {
  const url = getDocumentUrl(document);
  if (!url) throw new Error('Documento sem arquivo disponivel.');

  const response = await fetch(url, {
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Não foi possível acessar o arquivo para duplicação.');
  }

  const blob = await response.blob();
  const filename = document.filename || document.title || fallbackName || 'documento';
  return new File([blob], filename, { type: blob.type || document.content_type || 'application/octet-stream' });
}

export async function patchDocument(documentId: string, payload: Record<string, any>) {
  return await api.patch(`/documents/${documentId}/`, payload);
}

export async function deleteDocument(documentId: string) {
  return await api.delete(`/documents/${documentId}/`);
}
