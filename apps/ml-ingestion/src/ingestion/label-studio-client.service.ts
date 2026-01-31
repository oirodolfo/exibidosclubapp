import { Injectable } from "@nestjs/common";

export interface LabelStudioConfig {
  baseUrl: string;
  apiToken: string;
  projectId: string;
}

@Injectable()
export class LabelStudioClientService {
  async fetchExport(config: LabelStudioConfig): Promise<unknown> {
    const url = `${config.baseUrl.replace(/\/$/, "")}/api/projects/${config.projectId}/export?format=JSON`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${config.apiToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Label Studio export failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  hasNewOrUpdatedAnnotations(
    export_: { tasks?: Array<{ updated_at?: string; annotations?: unknown[] }> },
    lastSeenUpdatedAt: string | null
  ): boolean {
    if (!lastSeenUpdatedAt) return true;
    const tasks = export_.tasks ?? [];
    for (const task of tasks) {
      const updated = task.updated_at ?? null;
      if (updated && updated > lastSeenUpdatedAt) return true;
      for (const ann of task.annotations ?? []) {
        const a = ann as { updated_at?: string };
        if (a.updated_at && a.updated_at > lastSeenUpdatedAt) return true;
      }
    }
    return false;
  }
}
