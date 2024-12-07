import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import Logger from "../../config/logger";
import { extractUserIP } from "../../helpers/extractUserIP";
import { extractUserAgentDetails } from "../../helpers/extractUserAgentDetails";
import { sanitizeSensitiveInfo } from "../../helpers/sanitizeSensitiveInfo";

// Middleware for logging device info
export const logRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userAgent = req.headers["user-agent"] || "Unknown";
        const userIP = extractUserIP(req);
        const { device, os, browser } = extractUserAgentDetails(userAgent);
        const { latitude, longitude } = req.body;
        const user = req.user as User;
        const requestedRoute = req.originalUrl || req.url || "Unknown";
        const method = req.method;
        let statusCode: number;
        let responseBody: string = "No response body"; // Default value

        // Override the response send method to capture the response body
        const originalSend = res.send.bind(res);
        res.send = function (this: Response, body: any) {
            statusCode = res.statusCode;
            try {
                if (typeof body === "string") {
                    const bodyObj = JSON.parse(body);
                    responseBody = JSON.stringify(sanitizeSensitiveInfo(bodyObj));
                } else {
                    responseBody = JSON.stringify(sanitizeSensitiveInfo(body));
                }
            } catch (error) {
                responseBody = "Error sanitizing response body";
                Logger.error("Error sanitizing response body:", error);
            }

            // Call the original send method and return its result
            return originalSend(body); // Return the result of the original send
        };

        // Log the request and response details after the response is finished
        res.on("finish", async () => {
            try {
                Logger.info({
                    ipAddress: userIP,
                    latitude: latitude ? parseFloat(latitude) : undefined,
                    longitude: longitude ? parseFloat(longitude) : undefined,
                    userAgent,
                    device,
                    os,
                    browser,
                    requestedRoute,
                    method,
                    statusCode: statusCode || 500,
                    responseBody,
                    requestBody:
                        JSON.stringify(sanitizeSensitiveInfo(req.body)) || "No request body",
                    userId: user?.id || "Unauthenticated User",
                });
            } catch (error) {
                Logger.error("Error capturing user device information:", error);
            }
        });

        // Proceed to the next middleware if all checks pass
        next();
    } catch (error) {
        Logger.error("Error in logRequest", error);
        next(error);
    }
};
