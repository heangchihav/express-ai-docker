import { NextFunction, Request, Response } from "express";

// Types for FastAPI communication
interface SecurityCheckRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, any> | null;
}

interface SecurityCheckResponse {
  is_threat: boolean;
  threat_level: string;
  details: Record<string, any>;
  recommendations: Record<string, string>;
}

// List of paths to exclude from security check
const excludedPaths = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/healthcheck',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/test-fastapi',
  '/api/healthcheck',
  '/api/csrf-token',
  '/test-fastapi'
];

const SecurityCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Log the current path for debugging
    console.log('Current path:', req.path);
    console.log('Is path excluded?', excludedPaths.includes(req.path));

    // Skip security check for excluded paths
    if (excludedPaths.includes(req.path)) {
      console.log('Skipping security check for excluded path:', req.path);
      return next();
    }

    // Check required environment variables
    const fastApiUrl = process.env.FASTAPI_URL;
    const fastApiKey = process.env.FASTAPI_KEY;

    if (!fastApiUrl || !fastApiKey) {
      console.error('Missing required environment variables: FASTAPI_URL or FASTAPI_KEY');
      return next();
    }

    // Convert headers to a plain object
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers[key] = Array.isArray(value) ? value[0] : value.toString();
    });

    // Prepare request body
    const body = req.body && Object.keys(req.body).length > 0 ? req.body : null;

    const checkRequest: SecurityCheckRequest = {
      method: req.method,
      path: req.path,
      headers,
      body
    };

    console.log('Sending request to FastAPI:', JSON.stringify(checkRequest, null, 2));

    const response = await fetch(`${fastApiUrl}/api/v1/security/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': fastApiKey
      },
      body: JSON.stringify(checkRequest)
    });

    if (!response.ok) {
      console.error('FastAPI response not OK:', response.status, response.statusText);
      throw new Error(`Security check failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('FastAPI response:', JSON.stringify(responseData, null, 2));
    
    // Basic validation that required fields exist
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response: expected an object');
    }

    // Type guard function to validate the response
    const isSecurityResponse = (data: any): data is SecurityCheckResponse => {
      return (
        typeof data.is_threat === 'boolean' &&
        typeof data.threat_level === 'string' &&
        typeof data.details === 'object' &&
        typeof data.recommendations === 'object'
      );
    };

    if (!isSecurityResponse(responseData)) {
      throw new Error('Invalid response format from security service');
    }

    const result = responseData as SecurityCheckResponse;
    
    if (result.is_threat && result.threat_level === 'High') {
      return res.status(403).json({
        error: 'Request blocked',
        reason: 'High security threat detected',
        details: result.details,
        recommendations: result.recommendations
      });
    }
    
    next();
  } catch (error) {
    // Log the actual error for debugging with more details
    console.error('Security check error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // In production, you might want to block requests if security service is down
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Security service unavailable',
        message: 'Unable to process request at this time'
      });
    }
    
    next();
  }
};

export default SecurityCheckMiddleware;