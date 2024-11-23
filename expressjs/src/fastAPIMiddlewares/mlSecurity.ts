import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { secret } from '../config/secret';
import Logger from '../config/logger';

const securityClient = axios.create({
    baseURL: secret.fastApiUrl,  // Using the same FastAPI URL
    timeout: 5000,
    headers: {
        'X-API-Key': secret.securityServiceApiKey
    }
});

// SQL Injection patterns
const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
];

// SQL Injection protection
const sqlInjectionCheck = (obj: any): boolean => {
    if (typeof obj === 'string') {
        return sqlInjectionPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => sqlInjectionCheck(value));
    }
    return false;
};

// Risk assessment middleware
export const mlSecurityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const clientIP = (req.ip || req.socket.remoteAddress || '').toString().trim();

    try {
        // Skip for whitelisted IPs
        if (secret.whitelistedIPs?.includes(clientIP)) {
            Logger.info('Request allowed from whitelisted IP', {
                ip: clientIP,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            return next();
        }

        // Skip for certain paths with logging
        const skipPaths = ['/health', '/metrics', '/favicon.ico', '/api/auth/login', '/api/auth/signup'];
        if (skipPaths.includes(req.path)) {
            Logger.info('Request allowed for whitelisted path', {
                path: req.path,
                ip: clientIP,
                method: req.method
            });
            return next();
        }

        // Check for SQL injection with detailed logging
        if (sqlInjectionCheck(req.query) || sqlInjectionCheck(req.body) || sqlInjectionCheck(req.params)) {
            const suspiciousData = {
                query: req.query,
                body: req.body,
                params: req.params
            };
            
            Logger.warn('SQL injection attempt detected', {
                ip: clientIP,
                method: req.method,
                path: req.path,
                suspiciousData,
                timestamp: new Date().toISOString()
            });
            
            return res.status(403).json({
                error: 'Access denied',
                message: 'Potential SQL injection detected',
                details: 'Request contains suspicious SQL patterns'
            });
        }

        // Prepare request data for ML analysis with enhanced logging
        const requestData = {
            ip: clientIP,
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query,
            body: req.body,
            timestamp: new Date().toISOString()
        };

        Logger.debug('Processing security check', {
            ip: clientIP,
            path: req.path,
            method: req.method
        });

        // Retry logic for ML service with enhanced error handling
        let attempts = 0;
        const maxAttempts = 3;
        const retryDelay = 1000;

        while (attempts < maxAttempts) {
            try {
                const response = await securityClient.post('/api/v1/security/risk-assessment', requestData);
                const { riskScore, riskFactors, highestRiskFactor, details } = response.data;

                // Add risk analysis to request for logging
                (req as any).securityAnalysis = {
                    riskScore,
                    riskFactors,
                    highestRiskFactor,
                    details
                };

                if (riskScore > secret.riskThreshold) {
                    Logger.warn('High risk request blocked', {
                        ip: clientIP,
                        method: req.method,
                        path: req.path,
                        riskScore,
                        riskFactors,
                        highestRiskFactor,
                        threshold: secret.riskThreshold,
                        timestamp: new Date().toISOString()
                    });
                    
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'Request blocked due to security risk',
                        riskScore,
                        threshold: secret.riskThreshold,
                        highestRiskFactor,
                        recommendation: details.recommendation
                    });
                }

                // Monitor response time
                const responseTime = Date.now() - startTime;
                if (responseTime > 1000) {
                    Logger.warn('Slow security check detected', {
                        duration: responseTime,
                        path: req.path,
                        ip: clientIP
                    });
                }

                Logger.info('Security check passed', {
                    ip: clientIP,
                    path: req.path,
                    method: req.method,
                    riskScore,
                    responseTime,
                    riskFactors
                });

                return next();
            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    Logger.debug('Retrying security check', {
                        attempt: attempts,
                        maxAttempts,
                        path: req.path,
                        ip: clientIP,
                        error: error.message
                    });
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    Logger.error('Security service unavailable', {
                        error,
                        path: req.path,
                        ip: clientIP,
                        attempts
                    });
                    // In production, you might want to block requests when security service is down
                    // For now, we'll allow them through with a warning
                    Logger.warn('Allowing request despite security service failure', {
                        ip: clientIP,
                        path: req.path
                    });
                    return next();
                }
            }
        }
    } catch (error) {
        Logger.error('Error in security middleware', {
            error,
            path: req.path,
            ip: clientIP
        });
        next(error);
    }
};
