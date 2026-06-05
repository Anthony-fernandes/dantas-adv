import { api, apiRequest } from "@/integrations/api/client";

export type WorkspaceNamespace =
  | "office_settings"
  | "practice_area_ui"
  | "process_ui"
  | "process_movement_ui"
  | "agenda_meta"
  | "hearings_workspace";

export type WorkspaceStateRecord<TPayload = Record<string, unknown>> = {
  id: string;
  namespace: string;
  scope_key: string;
  item_key: string;
  payload: TPayload;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
};

function normalizeScopeKey(scopeKey?: string | null) {
  return String(scopeKey || "").trim();
}

export async function listWorkspaceStateItems<TPayload>(
  namespace: WorkspaceNamespace | string,
  scopeKey?: string | null,
) {
  return await api.get<WorkspaceStateRecord<TPayload>[]>("/workspace-state/", {
    namespace,
    scope_key: normalizeScopeKey(scopeKey) || undefined,
  });
}

export async function loadWorkspaceStateMap<TPayload>(
  namespace: WorkspaceNamespace | string,
  scopeKey?: string | null,
) {
  const records = await listWorkspaceStateItems<TPayload>(namespace, scopeKey);
  return Object.fromEntries(records.map((record) => [record.item_key, record.payload] as const)) as Record<string, TPayload>;
}

export async function loadWorkspaceStateSingleton<TPayload>(
  namespace: WorkspaceNamespace | string,
  itemKey = "tenant",
  scopeKey?: string | null,
) {
  const map = await loadWorkspaceStateMap<TPayload>(namespace, scopeKey);
  return map[itemKey] ?? null;
}

export async function saveWorkspaceStateItem<TPayload>(
  namespace: WorkspaceNamespace | string,
  itemKey: string,
  payload: TPayload,
  scopeKey?: string | null,
) {
  return await api.put<WorkspaceStateRecord<TPayload>>("/workspace-state/record/", {
    namespace,
    scope_key: normalizeScopeKey(scopeKey),
    item_key: itemKey,
    payload,
  });
}

export async function saveWorkspaceStateSingleton<TPayload>(
  namespace: WorkspaceNamespace | string,
  payload: TPayload,
  itemKey = "tenant",
  scopeKey?: string | null,
) {
  return await saveWorkspaceStateItem(namespace, itemKey, payload, scopeKey);
}

export async function deleteWorkspaceStateItem(
  namespace: WorkspaceNamespace | string,
  itemKey: string,
  scopeKey?: string | null,
) {
  await apiRequest<void>("/workspace-state/record/", {
    method: "DELETE",
    body: {
      namespace,
      scope_key: normalizeScopeKey(scopeKey),
      item_key: itemKey,
    },
  });
}
