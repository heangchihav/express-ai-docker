import { User } from "@prisma/client";
import geoip from 'geoip-lite';
import { secret } from "../../config/secret";
import { NextFunction, Request, Response, RequestHandler } from "express";
import Logger from '../../config/logger';
import { 
    HttpError, 
    ErrorCode,
    BadRequestError,
    ForbiddenError,
    InternalServerError 
} from '../../errors';
import { extractUserIP } from "../../helpers/extractUserIP";
import { extractUserAgentDetails } from "../../helpers/extractUserAgentDetails";

// Check if the user's IP is allowed
export const isIPAllowed = (user: User, userIP: string): boolean => {
    if (!user.whitelistedIPs.length && !user.blacklistedIPs.length) return true; // Allow all if no IPs set
    if (user.whitelistedIPs.includes(userIP)) return true; // IP is whitelisted
    if (user.blacklistedIPs.includes(userIP)) return false; // IP is blacklisted
    return true; // Allow if not explicitly blacklisted
};

// Check if the user's country is allowed
export const isCountryAllowed = (user: User, ip: string): boolean => {
    const geo = geoip.lookup(ip);

    // If in development mode and geo lookup fails, allow access
    if (!geo) {
        if (secret.nodeEnv === "development") {
            console.warn("Geo lookup failed, but bypassing country check in development mode.");
            return true;
        }

        // If not in development mode and geo lookup fails, deny access
        return false;
    }

    const userCountry = geo.country;

    // If both whitelistedCountries and blacklistedCountries are empty, allow all
    if (!user.whitelistedCountries.length && !user.blacklistedCountries.length) {
        return true;
    }

    // If blacklistedCountries is not set or empty, allow all except explicitly blacklisted countries
    if (!user.blacklistedCountries.length) {
        // Allow if the whitelist is empty or the country is whitelisted
        if (!user.whitelistedCountries.length || user.whitelistedCountries.includes(userCountry)) {
            return true;
        } else {
            return false; // Deny if not in the whitelist and whitelist is set
        }
    }

    // If the user is in the blacklist, deny access
    if (user.blacklistedCountries.includes(userCountry)) return false;

    // If the user is in the whitelist, allow access
    if (user.whitelistedCountries.includes(userCountry)) return true;

    return false; // Deny if not explicitly allowed or in any list
};

// Check if the user's OS is allowed
export const isOSAllowed = (user: User, os: any): boolean => {
    const osName = os.name;

    // If both whitelistedOS and blacklistedOS are empty, allow all
    if (!user.whitelistedOS.length && !user.blacklistedOS.length) return true;

    // If blacklistedOS is empty, allow any OS unless explicitly whitelisted
    if (!user.blacklistedOS.length) {
        // Allow if the whitelist is empty or the OS is whitelisted
        if (!user.whitelistedOS.length || user.whitelistedOS.includes(osName)) {
            return true;
        } else {
            return false; // Deny if not in the whitelist and whitelist is set
        }
    }

    // If the OS is in the blacklist, deny access
    if (user.blacklistedOS.includes(osName)) return false;

    // If the OS is in the whitelist, allow access
    if (user.whitelistedOS.includes(osName)) return true;

    return false; // Deny if not explicitly allowed or in any list
};

// Check if the user's User Agent is allowed
export const isUserAgentAllowed = (user: User, userAgent: string): boolean => {
    // If both whitelistedUserAgents and blacklistedUserAgents are empty, allow all
    if (!user.whitelistedUserAgents.length && !user.blacklistedUserAgents.length) return true;

    // If blacklistedUserAgents is empty, allow all user agents unless explicitly whitelisted
    if (!user.blacklistedUserAgents.length) {
        // Allow if the whitelist is empty or the user agent is whitelisted
        if (!user.whitelistedUserAgents.length || user.whitelistedUserAgents.includes(userAgent)) {
            return true;
        } else {
            return false; // Deny if not in the whitelist and whitelist is set
        }
    }

    // If the user agent is in the blacklist, deny access
    if (user.blacklistedUserAgents.includes(userAgent)) return false;

    // If the user agent is in the whitelist, allow access
    if (user.whitelistedUserAgents.includes(userAgent)) return true;

    return false; // Deny if not explicitly allowed or in any list
};

// Perform IP, Country, and User Agent validation if user exists
export const allowDeviceMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if user exists in request
        const user = req.user as User;
        if (!user) {
            return next();
        }
        const userIP = extractUserIP(req);
        const userAgent = req.headers["user-agent"] || "Unknown";
        const os = extractUserAgentDetails(req.headers["user-agent"] || "Unknown").os;

        // Log device validation attempt
        Logger.info({
            message: 'Device validation attempt',
            data: {
                userId: user.id,
                ip: userIP,
                userAgent: userAgent,
                os: os.name
            }
        });

        // IP validation
        if (!isIPAllowed(user, userIP)) {
            Logger.warn({
                message: 'IP access denied',
                data: {
                    userId: user.id,
                    ip: userIP,
                    whitelisted: user.whitelistedIPs,
                    blacklisted: user.blacklistedIPs
                }
            });

            // Create custom error message
            const errorMessage = `Access denied: IP address ${userIP} is ${
                user.whitelistedIPs.length > 0 ? 'not in whitelist' : 'in blacklist'
            }`;
            throw new ForbiddenError(errorMessage);
        }

        // Country validation
        if (!isCountryAllowed(user, userIP)) {
            const geo = geoip.lookup(userIP);
            Logger.warn({
                message: 'Country access denied',
                data: {
                    userId: user.id,
                    ip: userIP,
                    country: geo?.country,
                    whitelisted: user.whitelistedCountries,
                    blacklisted: user.blacklistedCountries
                }
            });

            // Create custom error message
            const errorMessage = `Access denied: Country ${geo?.country || 'Unknown'} is ${
                user.whitelistedCountries.length > 0 ? 'not in whitelist' : 'in blacklist'
            }`;
            throw new ForbiddenError(errorMessage);
        }

        // User Agent validation
        if (!isUserAgentAllowed(user, userAgent)) {
            Logger.warn({
                message: 'User agent access denied',
                data: {
                    userId: user.id,
                    userAgent: userAgent,
                    whitelisted: user.whitelistedUserAgents,
                    blacklisted: user.blacklistedUserAgents
                }
            });

            // Create custom error message
            const errorMessage = `Access denied: Browser or device is ${
                user.whitelistedUserAgents.length > 0 ? 'not in whitelist' : 'in blacklist'
            }`;
            throw new ForbiddenError(errorMessage);
        }

        // OS validation
        if (!isOSAllowed(user, os)) {
            Logger.warn({
                message: 'OS access denied',
                data: {
                    userId: user.id,
                    os: os.name,
                    whitelisted: user.whitelistedOS,
                    blacklisted: user.blacklistedOS
                }
            });

            // Create custom error message
            const errorMessage = `Access denied: Operating system ${os.name} is ${
                user.whitelistedOS.length > 0 ? 'not in whitelist' : 'in blacklist'
            }`;
            throw new ForbiddenError(errorMessage);
        }

        // Log successful validation
        Logger.info({
            message: 'Device validation successful',
            data: {
                userId: user.id,
                ip: userIP,
                userAgent: userAgent,
                os: os.name
            }
        });

        next();
    } catch (error) {
        // If it's already an HttpError, pass it directly
        if (error instanceof HttpError) {
            return next(error);
        }

        // Log unexpected errors
        Logger.error({
            message: 'Unexpected error in device validation',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        // Convert unknown errors to InternalServerError
        return next(new InternalServerError('An unexpected error occurred during device validation'));
    }
};