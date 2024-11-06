import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import Logger from "../config/logger";
import { isCountryAllowed, isIPAllowed, isOSAllowed, isUserAgentAllowed } from "../helpers/utility";
import { extractUserIP, extractUserAgentDetails } from "../helpers/utility";
import { sanitizeSensitiveInfo } from "../helpers/sanitizeSensitiveInfo";

// Middleware for user control and logging device info
export const userControlMiddleware = async (
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
        


        // Perform IP, Country, and User Agent validation if user exists
        if (user) {
            if (!isIPAllowed(user, userIP)) {
                return res.status(403).json({ error: "Your IP is not allowed" });
            }

            if (!isCountryAllowed(user, userIP)) {
                return res.status(403).json({ error: "Access from your country is restricted" });
            }

            if (!isUserAgentAllowed(user, userAgent)) {
                return res.status(403).json({ error: "Your browser or device is not supported" });
            }
            // 4. Check operating system
            if (!isOSAllowed(user, os)) {
                return res.status(403).json({ error: 'Your operating system is not allowed' });
            }
        }

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
        Logger.error("Error in userControlMiddleware:", error);
        next(error);
    }
};
