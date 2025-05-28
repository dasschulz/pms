# Airtable Filtering Best Practices

## Overview

This document outlines the **CORRECT** way to filter Airtable records by user ownership in our MdB-App, based on the working patterns from `touranfragen`, `task-manager`, and other successfully implemented modules.

## ❌ BROKEN Pattern (What NOT to Do)

### The Problem
```typescript
// ❌ BROKEN - This was used in BPA APIs and doesn't work reliably
const records = await base('BPA_Fahrten')
  .select({
    filterByFormula: `SEARCH("${airtableUserId}", ARRAYJOIN({UserID}))`,
    // or
    filterByFormula: `FIND("${airtableUserId}", CONCATENATE({UserID}))`,
  })
  .all();
```

### Why This Fails
1. **Complex String Manipulation**: `ARRAYJOIN` and `CONCATENATE` create unpredictable string representations
2. **Partial Matches**: `SEARCH` and `FIND` can match substrings, leading to false positives
3. **Airtable Record ID Dependency**: Relies on Airtable's internal record IDs which are complex strings
4. **Inconsistent Results**: Works sometimes, fails other times depending on data structure

## ✅ WORKING Pattern (The Correct Way)

### Primary Approach: Numeric UserID Filter
```typescript
// ✅ WORKING - Direct numeric comparison
const userId = token.id as string; // This is the numeric UserID (e.g., "1", "2", "3")

const records = await base('TableName')
  .select({
    filterByFormula: `{UserID} = ${userId}`, // Direct numeric comparison
    sort: [{ field: 'Created', direction: 'desc' }],
  })
  .all();
```

### Fallback Approach: Airtable Record ID (Only When Necessary)
```typescript
// ✅ WORKING - Only use as fallback if numeric filter fails
try {
  // Try numeric filter first
  records = await base('TableName')
    .select({
      filterByFormula: `{UserID} = ${userId}`,
    })
    .all();
} catch (error) {
  // Fallback to Airtable record ID approach
  const userRecords = await base('Users')
    .select({
      filterByFormula: `{UserID} = '${userId}'`,
      maxRecords: 1,
    })
    .firstPage();

  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const userAirtableId = userRecords[0].id;
  
  records = await base('TableName')
    .select({
      filterByFormula: `SEARCH("${userAirtableId}", ARRAYJOIN({UserID}))`,
    })
    .all();
}
```

## Key Differences

| Aspect | ❌ Broken Pattern | ✅ Working Pattern |
|--------|------------------|-------------------|
| **Filter Type** | String search in complex data | Direct numeric comparison |
| **Performance** | Slow (string operations) | Fast (numeric comparison) |
| **Reliability** | Inconsistent results | Consistent results |
| **Complexity** | High (multiple string functions) | Low (simple comparison) |
| **Maintenance** | Hard to debug | Easy to understand |

## Data Structure Understanding

### Users Table
```
UserID (Number): 1, 2, 3, 4...  ← This is what we filter by
Name: "Heidi Reichinnek"
Airtable Record ID: "reczoC6VSJKIRTsJy"  ← Only use as fallback
```

### Related Tables (BPA_Fahrten, Touranfragen, etc.)
```
UserID (Link to Users): [1]  ← Links to numeric UserID, NOT Airtable record ID
```

## Working Examples from Codebase

### ✅ Touranfragen API (Working)
```typescript
// src/app/api/touranfragen/route.ts
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token.id as string; // Numeric UserID

  try {
    records = await base('Touranfragen')
      .select({
        filterByFormula: `{UserID} = ${userId}`, // ✅ Direct numeric comparison
        sort: [{ field: 'Created', direction: 'desc' }],
      })
      .all();
  } catch (error) {
    // Fallback approach if needed
  }
}
```

### ✅ Task Manager API (Working)
```typescript
// src/app/api/task-manager/route.ts
const filterFormula = `{fldirhqhpcbGphbdD} = ${userId}`; // ✅ Numeric comparison
let records = await base('TaskManager')
  .select({
    filterByFormula: filterFormula,
    sort: [{ field: ' SortOrder ', direction: 'asc' }],
  })
  .all();
```

### ✅ Fixed BPA Active Trips API
```typescript
// src/app/api/bpa-public/active-trips/route.ts
try {
  records = await base('BPA_Fahrten')
    .select({
      filterByFormula: `AND({UserID} = ${numericUserId}, {Status_Fahrt} = 'Anmeldung offen', {Aktiv} = TRUE())`,
      fields: ['Fahrt_Datum_von', 'Zielort', 'Beschreibung', 'Status_Fahrt', 'Aktiv'],
      sort: [{ field: 'Fahrt_Datum_von', direction: 'asc' }],
    })
    .all();
} catch (error) {
  // Fallback to Airtable record ID approach
}
```

## Implementation Checklist

When creating new APIs that filter by user ownership:

### ✅ Do This
1. **Use `token.id` directly** - This contains the numeric UserID
2. **Filter with `{UserID} = ${userId}`** - Direct numeric comparison
3. **Implement try/catch** - Primary approach with fallback
4. **Use numeric UserID first** - Only fall back to Airtable record IDs if needed
5. **Keep it simple** - Avoid complex string manipulations

### ❌ Don't Do This
1. **Don't use `SEARCH()` or `FIND()` as primary method** - Too unreliable
2. **Don't use `ARRAYJOIN()` or `CONCATENATE()` unnecessarily** - Adds complexity
3. **Don't start with Airtable record IDs** - Use as fallback only
4. **Don't use `token.airtableRecordId` for filtering** - Use for permission checks only
5. **Don't overcomplicate** - Simple numeric comparison works best

## Token Structure Reference

```typescript
// JWT Token contains:
{
  id: "1",                           // ← USE THIS for filtering (numeric UserID)
  airtableRecordId: "reczoC6VSJKIRTsJy", // ← Use for permission checks only
  name: "Heidi Reichinnek",
  email: "heidi@example.com",
  // ... other fields
}
```

## Common Pitfalls

### 1. Using Airtable Record ID for Filtering
```typescript
// ❌ Wrong
filterByFormula: `SEARCH("${token.airtableRecordId}", ARRAYJOIN({UserID}))`

// ✅ Correct
filterByFormula: `{UserID} = ${token.id}`
```

### 2. Not Implementing Fallback
```typescript
// ❌ Wrong - No fallback
const records = await base('Table').select({
  filterByFormula: `{UserID} = ${userId}`
}).all();

// ✅ Correct - With fallback
try {
  records = await base('Table').select({
    filterByFormula: `{UserID} = ${userId}`
  }).all();
} catch (error) {
  // Implement fallback approach
}
```

### 3. Confusing Permission Checks with Filtering
```typescript
// Permission Check - Use Airtable Record ID
const linkedMdbUserIds = (fahrtRecord.fields.UserID as string[]) || [];
if (!linkedMdbUserIds.includes(mdbAirtableUserId)) {
  // ✅ This is correct for permission checks
}

// Filtering - Use Numeric UserID  
filterByFormula: `{UserID} = ${userId}` // ✅ This is correct for filtering
```

## Debugging

### Debug Endpoint Pattern
Create debug endpoints to test filtering approaches:

```typescript
// Test all approaches and compare results
const debugResults = {
  numericFilter: await testNumericFilter(userId),
  airtableRecordFilter: await testAirtableRecordFilter(userAirtableId),
  searchArrayJoin: await testSearchArrayJoin(userAirtableId),
};
```

### Logging
Always log filter results to understand what's working:

```typescript
console.log('[API] Records found with numeric UserID filter:', records.length);
```

## Summary

**The Golden Rule**: Always start with direct numeric UserID comparison (`{UserID} = ${userId}`). This is fast, reliable, and matches the pattern used in all working modules. Only fall back to complex Airtable record ID string manipulation if absolutely necessary.

This pattern is proven to work in:
- ✅ Touranfragen API
- ✅ Task Manager API  
- ✅ User Details API
- ✅ BPA Fahrten API (after fix)
- ✅ BPA Active Trips API (after fix)

Follow this pattern for all future user-filtered APIs to avoid filtering issues. 