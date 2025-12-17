// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Uebungen, Workouts, Ziele, Ernaehrung, Koerperdaten, WorkoutLogs } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1];
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
  // --- APP METADATA ---
  static async getAppMetadata(appId: string): Promise<any> {
    return callApi('GET', `/apps/${appId}`);
  }

  static async getWorkoutLookupData(): Promise<{ typ: Record<string, string>; stimmung: Record<string, string> }> {
    const metadata = await this.getAppMetadata(APP_IDS.WORKOUTS);
    console.log('Workout Metadata:', metadata);
    console.log('Typ Control:', metadata.controls?.typ);
    console.log('Typ lookup_data:', metadata.controls?.typ?.lookup_data);
    console.log('Stimmung lookup_data:', metadata.controls?.stimmung?.lookup_data);
    
    // If lookup_data contains URLs, we need to fetch the records
    const typLookupData = metadata.controls?.typ?.lookup_data || {};
    const stimmungLookupData = metadata.controls?.stimmung?.lookup_data || {};
    
    // Check if the first entry is a URL
    const firstTypValue = Object.values(typLookupData)[0];
    console.log('First typ value:', firstTypValue);
    
    if (typeof firstTypValue === 'string' && firstTypValue.startsWith('https://')) {
      // lookup_data contains URLs - need to fetch the records
      const typRecords: Record<string, string> = {};
      const stimmungRecords: Record<string, string> = {};
      
      // Fetch all typ records
      for (const [key, url] of Object.entries(typLookupData)) {
        try {
          const recordId = extractRecordId(url as string);
          if (recordId) {
            // Extract app_id from URL
            const appIdMatch = (url as string).match(/\/apps\/([^/]+)\/records/);
            if (appIdMatch) {
              const appId = appIdMatch[1];
              const record = await callApi('GET', `/apps/${appId}/records/${recordId}`);
              // Use the record's title or name field
              typRecords[key] = record.fields?.name || record.fields?.title || key;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch typ record for key ${key}:`, err);
          typRecords[key] = key;
        }
      }
      
      // Fetch all stimmung records
      for (const [key, url] of Object.entries(stimmungLookupData)) {
        try {
          const recordId = extractRecordId(url as string);
          if (recordId) {
            const appIdMatch = (url as string).match(/\/apps\/([^/]+)\/records/);
            if (appIdMatch) {
              const appId = appIdMatch[1];
              const record = await callApi('GET', `/apps/${appId}/records/${recordId}`);
              stimmungRecords[key] = record.fields?.name || record.fields?.title || key;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch stimmung record for key ${key}:`, err);
          stimmungRecords[key] = key;
        }
      }
      
      return { typ: typRecords, stimmung: stimmungRecords };
    }
    
    // Otherwise, assume it's already key-value pairs
    return {
      typ: typLookupData as Record<string, string>,
      stimmung: stimmungLookupData as Record<string, string>
    };
  }

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