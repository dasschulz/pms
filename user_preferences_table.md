# User Preferences Table Structure

## Table: User-Preferences (tblVzV5cyPa60sJNf)

This table stores user dashboard preferences for cross-device/session persistence.

### Fields:

| Field Name | Field ID | Type | Description |
|------------|----------|------|-------------|
| **ID** | fldBrQ8aqbTbZF6bS | Auto Number | Automatically incremented unique counter |
| **Name** | fldeVDfe0gUyFnH0l | Link to another record | Links to Users table records |
| **UserID (from Name)** | fldtlFfK9ihD4FA9t | Lookup | UserID from linked Users records |
| **Name (from Name)** | fldJHPYvDe2qIjeo2 | Lookup | Name from linked Users records |
| **Email (from Name)** | fldpCfO6RUUCbStBU | Lookup | Email from linked Users records |
| **Widget Order** | fldeK5BNlLlB9n6gq | Long text | JSON string array of widget IDs in order |
| **Active Widgets** | fldjyRe67IlOFercN | Long text | JSON string array of active widget IDs |
| **Theme Preference** | fldaKvqawmIhpo1ew | Single select | Options: "light", "dark", "system" |
| **Last Update** | fld9hDhwYbK2PdbrV | Date | Date of last preference update |

### Example Records:

```
ID: 1
Name: [rec8116cdd76088af] (Links to Users table)
UserID (from Name): [123]
Name (from Name): ["Max Mustermann"]
Email (from Name): ["user@example.com"]
Widget Order: ["weather", "trains", "activity"]
Active Widgets: ["weather", "trains"]
Theme Preference: "dark"
Last Update: 2024-01-15
```

### Single Select Options for Theme Preference:
- light
- dark
- system

### Relationship:
- **Name** field links to the **Users** table (tblmRrA9DEFEuuYi1)
- Lookup fields automatically pull UserID, Name, and Email from the linked Users record

### Users Table Addition:
Added **IsFraktionsvorstand** field (fldTkNfCk2uQo0uA5) - Checkbox type between Role and Data fields.

### API Endpoints:

- **GET** `/api/user-preferences` - Fetch user preferences
- **POST** `/api/user-preferences` - Save user preferences

### API Logic:
1. Find user record in Users table by email
2. Find or create preferences record linked to that user
3. Handle JSON serialization of widget arrays
4. Use proper Airtable formula for linked record lookups

### Usage:
- User preferences are automatically loaded when the dashboard loads
- Changes to widget order, active widgets, or theme are automatically saved
- Preferences sync across all user devices and sessions
- Falls back to defaults if no preferences are found 