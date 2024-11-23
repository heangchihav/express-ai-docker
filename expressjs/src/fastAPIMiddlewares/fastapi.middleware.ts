import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request, Response, NextFunction } from 'express';
import Logger from '../config/logger';
import { secret } from '../config/secret';

// Create axios instance with default configuration
const fastAPIClient = axios.create({
    baseURL: secret.fastApiUrl,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': secret.securityServiceApiKey
    }
});

interface SecurityData {
    risk_score: number;
    request_count: number;
    suspicious_count: number;
    unique_patterns: number;
    blocked: boolean;
    recommendation?: string;
}

interface SecurityError {
    message: string;
    code?: string;
    details?: any;
}

declare global {
    namespace Express {
        interface Request {
            securityData?: SecurityData;
            securityError?: SecurityError;
        }
    }
}

/**
 * Extract client IP from request
 */
const getClientIP = (req: Request): string => {
    const ip = (
        req.headers['x-forwarded-for'] as string ||
        req.socket.remoteAddress ||
        'unknown'
    ).split(',')[0];
    return ip.trim();
};

/**
 * Check if IP is whitelisted
 */
const isWhitelistedIP = (ip: string): boolean => {
    return secret.whitelistedIPs.includes(ip);
};

/**
 * Prepare request headers for FastAPI
 */
const prepareHeaders = (req: Request): Record<string, string> => {
    const headers: Record<string, string> = {
        'X-Real-IP': getClientIP(req),
        'X-Forwarded-For': getClientIP(req),
        'User-Agent': req.headers['user-agent'] || 'unknown',
        'Accept': req.headers['accept'] || '*/*',
        'X-API-Key': secret.securityServiceApiKey
    };

    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }

    return headers;
};

/**
 * Security middleware to analyze requests using FastAPI service
 */
export const fastAPISecurityMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();
    const clientIP = getClientIP(req);

    try {
        // Skip security check for whitelisted paths and IPs
        const skipPaths = ['/health', '/metrics', '/favicon.ico'];
        if (skipPaths.includes(req.path) || isWhitelistedIP(clientIP)) {
            Logger.debug({
                message: 'Skipping security check',
                path: req.path,
                ip: clientIP,
                reason: isWhitelistedIP(clientIP) ? 'whitelisted IP' : 'skip path'
            });
            return next();
        }

        // Prepare request data
        const requestData = {
            ip: clientIP,
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query,
            body: req.body,
            timestamp: new Date().toISOString()
        };

        // Call security service with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        const retryDelay = 1000;

        while (attempts < maxAttempts) {
            try {
                const response = await fastAPIClient.post<SecurityData>(
                    '/api/v1/security/analyze',
                    requestData,
                    { headers: prepareHeaders(req) }
                );

                const securityData = response.data;
                const responseTime = Date.now() - startTime;

                // Log slow responses
                if (responseTime > 1000) {
                    Logger.warn({
                        message: 'Slow security check',
                        duration: responseTime,
                        path: req.path,
                        ip: clientIP
                    });
                }

                // Block high-risk requests based on configured threshold
                if (securityData.blocked || securityData.risk_score > secret.riskThreshold) {
                    Logger.warn({
                        message: 'High risk activity detected',
                        ip: clientIP,
                        path: req.path,
                        riskScore: securityData.risk_score,
                        threshold: secret.riskThreshold,
                        securityData
                    });
                    res.status(403).json({
                        error: 'Access denied',
                        message: 'Suspicious activity detected',
                        recommendation: securityData.recommendation
                    });
                    return;
                }

                // Add security data to request
                req.securityData = securityData;
                
                // Log successful security check
                Logger.debug({
                    message: 'Security check passed',
                    ip: clientIP,
                    path: req.path,
                    riskScore: securityData.risk_score
                });
                
                return next();

            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    Logger.debug({
                        message: 'Retrying security check',
                        attempt: attempts,
                        maxAttempts,
                        ip: clientIP,
                        path: req.path
                    });
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                throw error;
            }
        }
    } catch (error) {
        const axiosError = error as AxiosError;
        Logger.error({
            message: 'Security service error',
            error: axiosError.message,
            path: req.path,
            ip: clientIP,
            status: axiosError.response?.status,
            data: axiosError.response?.data
        });

        // Add error info to request but don't block
        req.securityError = {
            message: 'Security service unavailable',
            code: axiosError.code,
            details: axiosError.response?.data
        };
        next();
    }
};

/**
 * Create a proxy middleware for FastAPI routes
 */
export const createFastAPIProxy = (path: string) => {
    return async (req: Request, res: Response): Promise<void> => {
        const clientIP = getClientIP(req);
        
        try {
            const config: AxiosRequestConfig = {
                method: req.method,
                url: path,
                headers: prepareHeaders(req),
                validateStatus: (status) => status < 500
            };

            if (['POST', 'PUT', 'PATCH'].includes(req.method?.toUpperCase() || '')) {
                config.data = req.body;
            }

            if (Object.keys(req.query).length > 0) {
                config.params = req.query;
            }

            const response: AxiosResponse = await fastAPIClient.request(config);

            // Log successful proxy request
            Logger.debug({
                message: 'FastAPI proxy request successful',
                path,
                method: req.method,
                status: response.status,
                ip: clientIP
            });

            // Forward the response
            res.status(response.status).json(response.data);

        } catch (error) {
            const axiosError = error as AxiosError;
            Logger.error({
                message: 'FastAPI proxy error',
                path,
                method: req.method,
                error: axiosError.message,
                status: axiosError.response?.status,
                ip: clientIP
            });

            if (axiosError.response) {
                res.status(axiosError.response.status).json(axiosError.response.data);
            } else {
                res.status(503).json({
                    error: 'Service temporarily unavailable',
                    message: 'Unable to reach FastAPI service'
                });
            }
        }
    };
};
