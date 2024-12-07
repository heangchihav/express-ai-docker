import { Request } from "express";
import requestIp from "request-ip";

// Extract user IP from the request
export const extractUserIP = (req: Request): string => {
    const clientIp = requestIp.getClientIp(req);
    return (
      clientIp ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      ""
    );
  };
  