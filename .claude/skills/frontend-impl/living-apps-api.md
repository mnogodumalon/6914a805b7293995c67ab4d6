# Living Apps API Reference

## ⚠️ Critical API Rules

These rules are **non-negotiable**. Breaking them causes runtime errors.

---

## 1. Date Formats

Living Apps has strict date format requirements:

| Field Type | Format | Example |
|------------|--------|---------|
| `date/datetimeminute` | `YYYY-MM-DDTHH:MM` | `2025-11-06T12:00` |
| `date/date` | `YYYY-MM-DD` | `2025-11-06` |

### ❌ WRONG
```typescript
// Seconds are NOT allowed for datetimeminute!
const date = '2025-11-06T12:00:00';  // ❌ Will fail
```

### ✅ CORRECT
```typescript
// For date/datetimeminute fields
const dateForAPI = formData.datum + 'T12:00';  // ✅ YYYY-MM-DDTHH:MM

// For date/date fields
const dateForAPI = formData.datum;  // ✅ YYYY-MM-DD

// Display in <input type="date">
const dateForInput = apiData.datum?.split('T')[0];  // Extract YYYY-MM-DD
```

---

## 2. applookup Fields

`applookup/select` fields store **full URLs** to related records.

### URL Format
```
https://my.living-apps.de/rest/apps/{app_id}/records/{record_id}
```

### ⚠️ CRITICAL: Always use extractRecordId()

```typescript
// ❌ NEVER do this manually
const parts = url.split('/');
const id = parts[parts.length - 1];  // ❌ Fragile!

// ✅ ALWAYS use the helper function
import { extractRecordId } from '@/services/livingAppsService';

const recordId = extractRecordId(url);
if (!recordId) return;  // ✅ Always null-check!
```

### extractRecordId() Implementation
```typescript
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extracts last 24 hex characters (Living Apps Record IDs)
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}
```

### Creating applookup Values
```typescript
import { createRecordUrl, APP_IDS } from '@/services/livingAppsService';

// When creating/updating records with applookup fields
const data = {
  kategorie: createRecordUrl(APP_IDS.KATEGORIEN, selectedKategorieId),
};

// createRecordUrl returns:
// 'https://my.living-apps.de/rest/apps/{app_id}/records/{record_id}'
```

### applookup Can Be Null!
```typescript
// ❌ WRONG - Will crash if field is null
workoutLogs.forEach((log) => {
  const id = extractRecordId(log.fields.uebung);
  data[id] = log;  // ❌ Crashes if id is null
});

// ✅ CORRECT - Defensive programming
workoutLogs.forEach((log) => {
  const id = extractRecordId(log.fields.uebung);
  if (!id) return;  // ✅ Skip if null
  if (!data[id]) data[id] = [];
  data[id].push(log);
});
```

---

## 3. API Response Format

Living Apps returns **objects**, not arrays!

### Response Structure
```typescript
// API returns:
{
  "690abc123...": {
    "createdat": "2025-11-06T10:00:00",
    "updatedat": null,
    "fields": {
      "name": "Item 1",
      "value": 100
    }
  },
  "690def456...": {
    "createdat": "2025-11-06T11:00:00",
    "updatedat": null,
    "fields": {
      "name": "Item 2",
      "value": 200
    }
  }
}
```

### ❌ WRONG Transformation
```typescript
// Loses record_id!
const items = Object.values(response);  // ❌ No record_id!
```

### ✅ CORRECT Transformation
```typescript
// Use Object.entries() to preserve record_id
const items = Object.entries(response).map(([record_id, record]) => ({
  record_id,  // ← From the key
  createdat: record.createdat,
  updatedat: record.updatedat,
  ...record.fields,
}));
```

### Why record_id Matters
- Required for React `key` prop
- Required for update/delete operations
- Required for applookup references

---

## 4. API Authentication

```typescript
const headers = {
  'X-API-Key': API_KEY,  // From environment
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

### Proxy vs Direct URL
```typescript
// For API calls (via proxy)
const API_BASE = '/api/rest';

// For applookup values (direct)
const APPLOOKUP_BASE = 'https://my.living-apps.de/rest';
```

---

## 5. CRUD Operations

### GET All Records
```typescript
GET /api/rest/apps/{app_id}/records
```

### GET Single Record
```typescript
GET /api/rest/apps/{app_id}/records/{record_id}
```

### CREATE Record
```typescript
POST /api/rest/apps/{app_id}/records
Content-Type: application/json

{
  "name": "New Item",
  "value": 100
}
```

### UPDATE Record
```typescript
PATCH /api/rest/apps/{app_id}/records/{record_id}
Content-Type: application/json

{
  "value": 150  // Only changed fields
}
```

### DELETE Record
```typescript
DELETE /api/rest/apps/{app_id}/records/{record_id}

// Note: DELETE also returns JSON, always call response.json()
```

---

## 6. Error Handling

```typescript
async function callAPI(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();  // Always parse JSON, even for DELETE
}
```

---

## 7. Metadata Structure

`app_metadata.json` contains the **complete, real metadata from Living Apps REST API**.

**IMPORTANT:**
- `controls` is an **OBJECT** (not array!)
- Each control has `identifier`, `label`, `type`, `subtype`, `fulltype`
- `lookup/select` has `lookup_data` with all options
- `applookup/select` has `lookup_app` URL to the linked app

```typescript
{
  "appgroup_id": "...",
  "appgroup_name": "My App Group",
  "apps": {
    "app_identifier": {
      "app_id": "...",
      "name": "App Display Name",
      "controls": {
        "control_identifier": {
          "identifier": "field_name",      // Use this as field key
          "label": "Field Label",          // Use this for UI display
          "type": "string",                // Base type
          "subtype": null,                 // or "select", "textarea", etc.
          "fulltype": "string/text",       // Combined: type/subtype
          "lookup_data": [                 // For lookup/select fields
            { "key": "option1", "value": "Option 1" },
            { "key": "option2", "value": "Option 2" }
          ],
          "lookup_app": "https://my.living-apps.de/rest/apps/{app_id}"  // For applookup
        }
      }
    }
  }
}
```

### Common Field Types
| fulltype | TypeScript | Notes |
|----------|------------|-------|
| `string/text` | `string` | Plain text |
| `string/textarea` | `string` | Multiline text |
| `number/number` | `number` | Numeric |
| `bool/bool` | `boolean` | True/false |
| `date/date` | `string` | YYYY-MM-DD |
| `date/datetimeminute` | `string` | YYYY-MM-DDTHH:MM (NO seconds!) |
| `lookup/select` | `string` | From predefined list (lookup_data) |
| `applookup/select` | `string \| null` | URL to another app's record |

### Using Metadata for UI
```typescript
// Use field labels for UI
const fieldLabel = metadata.apps.myapp.controls.myfield.label;

// Use lookup_data for Select options
const options = metadata.apps.myapp.controls.status.lookup_data;
// → [{ key: "active", value: "Active" }, { key: "done", value: "Done" }]
```

