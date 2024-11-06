import morgan, { StreamOptions } from 'morgan';
import Logger from '../config/logger';
import { secret } from '../config/secret';

// Stream for Morgan to use Winston
const stream: StreamOptions = {
    write: (message: string) => Logger.http(message.trim()),
};

// Skip logging in non-development environments
const skip = () => secret.NODE_ENV !== 'development';

// Morgan middleware setup
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream, skip }
);

export default morganMiddleware;
