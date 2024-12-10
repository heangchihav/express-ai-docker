declare module 'winston-logstash' {
  import TransportStream from 'winston-transport';
  import * as Transport from 'winston-transport';

  export enum TransportType {
    Tcp = 'tcp',
    Udp = 'udp'
  }

  export interface LogstashOptions extends Transport.TransportStreamOptions {
    port: number;
    host: string;
    node_name: string;
    ssl_enable?: boolean;
    max_connect_retries?: number;
    timeout_connect_retries?: number;
    retries?: number;
    transport?: TransportType;
  }

  export class Logstash extends TransportStream {
    constructor(options: LogstashOptions);
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'connect', listener: () => void): this;
    log(info: any, callback: () => void): void;
  }
}
