// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Uebungen, Workouts, Ziele, Ernaehrung, Koerperdaten, WorkoutLogs } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- UEBUNGEN ---
  static async getUebungen(): Promise<Uebungen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.UEBUNGEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getUebungenEntry(id: string): Promise<Uebungen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.UEBUNGEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createUebungenEntry(fields: Uebungen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.UEBUNGEN}/records`, { fields });
  }
  static async updateUebungenEntry(id: string, fields: Partial<Uebungen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.UEBUNGEN}/records/${id}`, { fields });
  }
  static async deleteUebungenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.UEBUNGEN}/records/${id}`);
  }

  // --- WORKOUTS ---
  static async getWorkouts(): Promise<Workouts[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WORKOUTS}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWorkout(id: string): Promise<Workouts | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WORKOUTS}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createWorkout(fields: Workouts['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WORKOUTS}/records`, { fields });
  }
  static async updateWorkout(id: string, fields: Partial<Workouts['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WORKOUTS}/records/${id}`, { fields });
  }
  static async deleteWorkout(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WORKOUTS}/records/${id}`);
  }

  // --- ZIELE ---
  static async getZiele(): Promise<Ziele[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZIELE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getZieleEntry(id: string): Promise<Ziele | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZIELE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createZieleEntry(fields: Ziele['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ZIELE}/records`, { fields });
  }
  static async updateZieleEntry(id: string, fields: Partial<Ziele['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ZIELE}/records/${id}`, { fields });
  }
  static async deleteZieleEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ZIELE}/records/${id}`);
  }

  // --- ERNAEHRUNG ---
  static async getErnaehrung(): Promise<Ernaehrung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ERNAEHRUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getErnaehrungEntry(id: string): Promise<Ernaehrung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ERNAEHRUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createErnaehrungEntry(fields: Ernaehrung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ERNAEHRUNG}/records`, { fields });
  }
  static async updateErnaehrungEntry(id: string, fields: Partial<Ernaehrung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ERNAEHRUNG}/records/${id}`, { fields });
  }
  static async deleteErnaehrungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ERNAEHRUNG}/records/${id}`);
  }

  // --- KOERPERDATEN ---
  static async getKoerperdaten(): Promise<Koerperdaten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KOERPERDATEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKoerperdatenEntry(id: string): Promise<Koerperdaten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KOERPERDATEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKoerperdatenEntry(fields: Koerperdaten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KOERPERDATEN}/records`, { fields });
  }
  static async updateKoerperdatenEntry(id: string, fields: Partial<Koerperdaten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KOERPERDATEN}/records/${id}`, { fields });
  }
  static async deleteKoerperdatenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KOERPERDATEN}/records/${id}`);
  }

  // --- WORKOUT_LOGS ---
  static async getWorkoutLogs(): Promise<WorkoutLogs[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WORKOUT_LOGS}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWorkoutLog(id: string): Promise<WorkoutLogs | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WORKOUT_LOGS}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createWorkoutLog(fields: WorkoutLogs['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WORKOUT_LOGS}/records`, { fields });
  }
  static async updateWorkoutLog(id: string, fields: Partial<WorkoutLogs['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WORKOUT_LOGS}/records/${id}`, { fields });
  }
  static async deleteWorkoutLog(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WORKOUT_LOGS}/records/${id}`);
  }

}