# Spam Protection Implementation

## Overview
This implementation adds comprehensive spam protection to public forms in the MdB-App, specifically for BPA trip applications and tour requests.

## Features Implemented

### 1. Rate Limiting
- **Limit**: 5 requests per hour per IP address
- **Endpoints**: All `/api/bpa-public/*` and `/api/tour-form/*` endpoints
- **Response**: 429 status with German error message

### 2. Honeypot Fields
Public forms now include hidden fields that legitimate users won't fill but bots will:
- `website`
- `phone_number` 
- `company`
- `fax`

### 3. Content Analysis
- Detects spam keywords (casino, poker, loans, etc.)
- Checks for excessive links in text fields
- Validates email format and domains
- Flags suspicious email providers (tempmail, etc.)
- Detects excessive capital letters

### 4. Timing Validation
- Tracks form load time vs submission time
- Blocks submissions completed in under 3 seconds
- Warns about submissions under 10 seconds

### 5. Spam Scoring
Each submission receives a spam score (0-100):
- **0-40**: Clean submission
- **41-69**: Suspicious but allowed (logged)
- **70+**: Blocked as spam

## Database Schema Requirements

Add `spam_score` column to relevant tables:

```sql
-- For BPA applications
ALTER TABLE bpa_formular ADD COLUMN spam_score INTEGER DEFAULT 0;

-- For tour requests  
ALTER TABLE touranfragen ADD COLUMN spam_score INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_bpa_formular_spam_score ON bpa_formular(spam_score);
CREATE INDEX idx_touranfragen_spam_score ON touranfragen(spam_score);
```

## Configuration

### Rate Limits
Located in `src/lib/spam-protection.ts`:
- **Tokens per interval**: 5
- **Interval**: 1 hour
- **Cleanup**: Every hour

### Spam Thresholds
- **Block threshold**: 70+ score
- **Warning threshold**: 40+ score
- **Timing threshold**: 3 seconds minimum

## Files Modified

1. **`src/lib/spam-protection.ts`** - Core spam detection logic
2. **`middleware.ts`** - Added public routes for forms
3. **`src/app/api/bpa-public/submit-application/route.ts`** - Added spam checks
4. **`src/app/api/tour-form/submit/route.ts`** - Added spam checks  
5. **`src/app/bpa/[lastName]/page.tsx`** - Added honeypot fields and timing

## Public Routes Protected

- `/bpa/[lastName]` - BPA trip application forms
- `/bpa-form/[lastName]` - Alternative BPA forms
- `/tour-form/[token]` - Tour request forms
- `/api/bpa-public/*` - BPA public APIs
- `/api/tour-form/*` - Tour form APIs

## Error Messages

All error messages are in German for user-facing consistency:
- Rate limit: "Zu viele Anfragen. Bitte versuchen Sie es später erneut."
- Spam detected: "Die Übermittlung konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingaben."
- Timing: "Bitte nehmen Sie sich etwas mehr Zeit beim Ausfüllen des Formulars."

## Monitoring

Check server logs for:
- `Rate limit exceeded` - IP hitting limits
- `Spam detected` - Blocked submissions with reasons
- `Suspicious submission` - High-score but allowed submissions

## Security Benefits

1. **Prevents automated spam** - Honeypots catch basic bots
2. **Reduces server load** - Rate limiting prevents abuse
3. **Content filtering** - Blocks obvious spam patterns
4. **Timing analysis** - Catches rapid-fire submissions
5. **Audit trail** - Spam scores for analysis 