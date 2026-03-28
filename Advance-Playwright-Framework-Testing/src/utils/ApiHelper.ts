import type { APIRequestContext, APIResponse } from '@playwright/test';

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export class ApiHelper {
  constructor(private readonly request: APIRequestContext, private readonly baseUrl: string) {}

  async get<T>(path: string, headers: Record<string, string> = {}) {
    const response = await this.request.get(this.resolve(path), { headers });
    return this.parse<T>(response);
  }

  async post<T>(path: string, body: JsonValue, headers: Record<string, string> = {}) {
    const response = await this.request.post(this.resolve(path), {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return this.parse<T>(response);
  }

  private resolve(path: string) {
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }

  private async parse<T>(response: APIResponse): Promise<T> {
    const text = await response.text();
    if (!response.ok()) {
      throw new Error(text || `API request failed with status ${response.status()}`);
    }
    return text ? (JSON.parse(text) as T) : ({} as T);
  }
}
