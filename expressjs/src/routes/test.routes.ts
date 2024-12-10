import express from 'express';
import Logger from '../config/logger';

const router = express.Router();

// Test endpoint to generate different log levels
router.get('/logs/:level', (req, res) => {
    const level = req.params.level;
    const message = `Test ${level} log message`;
    
    switch(level) {
        case 'info':
            Logger.info(message, { 
                endpoint: '/logs/info',
                userId: 'test-user',
                action: 'test-info'
            });
            break;
        case 'error':
            Logger.error(message, { 
                endpoint: '/logs/error',
                error: new Error('Test error'),
                userId: 'test-user'
            });
            break;
        case 'warn':
            Logger.warn(message, { 
                endpoint: '/logs/warn',
                userId: 'test-user',
                warning: 'Test warning'
            });
            break;
        case 'debug':
            Logger.debug(message, { 
                endpoint: '/logs/debug',
                userId: 'test-user',
                debugInfo: 'Test debug info'
            });
            break;
        default:
            Logger.info('Invalid log level', { 
                endpoint: '/logs/invalid',
                level: level 
            });
    }
    
    res.json({ message: `Generated ${level} log` });
});

// Test endpoint to simulate different response times
router.get('/performance/:delay', async (req, res) => {
    const delay = parseInt(req.params.delay) || 100;
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const responseTime = Date.now() - startTime;
    Logger.info('API Response Time', { 
        endpoint: '/performance',
        responseTime,
        delay
    });
    
    res.json({ responseTime });
});

// Test endpoint to simulate different HTTP status codes
router.get('/status/:code', (req, res) => {
    const code = parseInt(req.params.code) || 200;
    
    Logger.info('Status Code Test', { 
        endpoint: '/status',
        statusCode: code,
        userId: 'test-user'
    });
    
    res.status(code).json({ status: code });
});

export default router;
