import { ExecutionMethod, Functions } from 'appwrite';
import { appwriteClient } from './appwrite';
const functions = new Functions(appwriteClient);
export async function adminRequest<T = unknown>(body: Record<string, unknown>): Promise<{ result: T; warning?: string; users?: AdminUser[]; total?: number }> {
  const execution = await functions.createExecution({ functionId: 'unispora-admin', body: JSON.stringify(body), async: false, method: ExecutionMethod.POST });
  let data; try { data = JSON.parse(execution.responseBody); } catch { throw new Error('The admin service did not respond. Please try again.'); }
  if (execution.responseStatusCode >= 400 || data.message) throw new Error(data.message || 'Admin request failed.');
  return data;
}
export type AdminUser = { $id: string; name: string; email: string; status: boolean; emailVerification: boolean; role: string; country: string; createdAt: string };
