import logger from '../config/logger';
import { secret } from '../config/secret';
import fs from 'fs';
import path from 'path';

// Test logging functionality
async function testLogging() {
    console.log('Starting logger test...');

    // Test different log levels
    logger.info('Test info message', { testId: 1 });
    logger.warn('Test warning message', { testId: 2 });
    logger.error('Test error message', { testId: 3, error: new Error('Test error') });
    logger.debug('Test debug message', { testId: 4 });
    logger.http('Test HTTP message', { testId: 5, method: 'GET', path: '/test' });

    // Test object logging
    logger.info({
        complex: 'object',
        with: {
            nested: 'properties',
            array: [1, 2, 3],
            timestamp: new Date().toISOString()
        }
    });

    // Verify log files exist
    const logsDir = path.join(__dirname, '../../logs');
    const files = ['error.log', 'combined.log'];
    
    files.forEach(file => {
        const filePath = path.join(logsDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
            const stats = fs.statSync(filePath);
            console.log(`   Size: ${stats.size} bytes`);
            
            // Read last few lines
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(Boolean);
            console.log(`   Last log entry: ${lines[lines.length - 1]}`);
        } else {
            console.log(`❌ ${file} does not exist`);
        }
    });

    // Log Logstash connection info
    console.log('\nLogstash Configuration:');
    console.log(`Host: ${secret.logstash.host}`);
    console.log(`Port: ${secret.logstash.port}`);

    console.log('\nTest completed. Check Kibana to verify logs are being received.');
}

// Run the test
testLogging().catch(console.error);
