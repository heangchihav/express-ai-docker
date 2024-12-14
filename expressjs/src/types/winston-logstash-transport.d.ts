declare module 'winston-logstash-transport' {
  import Transport from 'winston-transport';
  
  export interface LogstashTransportOptions extends Transport.TransportStreamOptions {
    host?: string;
    port?: number;
    ssl?: boolean;
    timeout?: number;
    [key: string]: any;
  }

  export class LogstashTransport extends Transport {
    constructor(options: LogstashTransportOptions);
  }
}
