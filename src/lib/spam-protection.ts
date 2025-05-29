import { RateLimiter } from 'limiter';
import { NextRequest } from 'next/server';

// Rate limiters for different endpoints
const rateLimiters = new Map<string, RateLimiter>();

// Get or create rate limiter for IP
function getRateLimiter(ip: string): RateLimiter {
  if (!rateLimiters.has(ip)) {
    // Allow 5 requests per 10 minutes per IP
    rateLimiters.set(ip, new RateLimiter({ tokensPerInterval: 5, interval: 'hour' }));
  }
  return rateLimiters.get(ip)!;
}

// Clean up old rate limiters periodically
setInterval(() => {
  rateLimiters.clear();
}, 60 * 60 * 1000); // Clear every hour

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // For development/localhost, use a default IP
  return '127.0.0.1';
}

export async function checkRateLimit(req: NextRequest): Promise<{ allowed: boolean; remainingRequests?: number }> {
  const ip = getClientIP(req);
  const limiter = getRateLimiter(ip);
  
  const remainingRequests = await limiter.removeTokens(1);
  
  return {
    allowed: remainingRequests >= 0,
    remainingRequests: Math.max(0, remainingRequests)
  };
}

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  score: number; // 0-100, higher = more likely spam
}

export function checkHoneypot(formData: any): SpamCheckResult {
  // Check for honeypot fields (should be empty)
  const honeypotFields = ['website', 'phone_number', 'company', 'fax'];
  
  for (const field of honeypotFields) {
    if (formData[field] && formData[field].trim() !== '') {
      return {
        isSpam: true,
        reason: 'Honeypot field filled',
        score: 95
      };
    }
  }
  
  return { isSpam: false, score: 0 };
}

export function checkFormTiming(startTime: number, submissionTime: number): SpamCheckResult {
  const timeDiff = submissionTime - startTime;
  
  // Too fast (less than 3 seconds)
  if (timeDiff < 3000) {
    return {
      isSpam: true,
      reason: 'Form filled too quickly',
      score: 90
    };
  }
  
  // Suspiciously fast (less than 10 seconds)
  if (timeDiff < 10000) {
    return {
      isSpam: false,
      score: 60
    };
  }
  
  return { isSpam: false, score: 0 };
}

export function checkFormContent(formData: any): SpamCheckResult {
  let score = 0;
  const reasons: string[] = [];
  
  // Check for common spam indicators
  const spamPatterns = [
    /\b(viagra|cialis|casino|poker|loan|credit|debt|mortgage)\b/i,
    /\b(click here|visit now|act now|limited time)\b/i,
    /\b(free money|make money|earn cash|get rich)\b/i,
    /\b(guarantee|100% free|no obligation|risk free)\b/i,
    /https?:\/\/[^\s]+/g // URLs in form fields (except email)
  ];
  
  const textFields = ['beschreibung', 'nachricht', 'anmerkungen', 'kommentar'];
  
  for (const field of textFields) {
    const value = formData[field];
    if (typeof value === 'string') {
      for (const pattern of spamPatterns) {
        if (pattern.test(value)) {
          score += 30;
          reasons.push(`Spam pattern detected in ${field}`);
        }
      }
      
      // Check for excessive links
      const linkMatches = value.match(/https?:\/\/[^\s]+/g);
      if (linkMatches && linkMatches.length > 2) {
        score += 40;
        reasons.push('Too many links');
      }
      
      // Check for excessive caps
      const capsRatio = (value.match(/[A-Z]/g) || []).length / value.length;
      if (capsRatio > 0.5 && value.length > 20) {
        score += 25;
        reasons.push('Excessive capital letters');
      }
    }
  }
  
  // Check email format
  if (formData.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      score += 50;
      reasons.push('Invalid email format');
    }
    
    // Check for suspicious email domains
    const suspiciousDomains = [
      'tempmail', 'guerrillamail', '10minutemail', 'mailinator',
      'spam', 'trash', 'temp', 'fake'
    ];
    
    const emailDomain = formData.email.split('@')[1]?.toLowerCase();
    if (emailDomain && suspiciousDomains.some(domain => emailDomain.includes(domain))) {
      score += 60;
      reasons.push('Suspicious email domain');
    }
  }
  
  return {
    isSpam: score >= 70,
    reason: reasons.join(', '),
    score
  };
}

export function performSpamCheck(formData: any, startTime?: number): SpamCheckResult {
  const checks = [
    checkHoneypot(formData),
    checkFormContent(formData)
  ];
  
  if (startTime) {
    checks.push(checkFormTiming(startTime, Date.now()));
  }
  
  let totalScore = 0;
  const reasons: string[] = [];
  let isSpam = false;
  
  for (const check of checks) {
    totalScore += check.score;
    if (check.isSpam) {
      isSpam = true;
    }
    if (check.reason) {
      reasons.push(check.reason);
    }
  }
  
  return {
    isSpam: isSpam || totalScore >= 70,
    reason: reasons.join('; '),
    score: Math.min(100, totalScore)
  };
} 