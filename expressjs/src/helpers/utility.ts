import { User } from "@prisma/client";
import { Request } from "express";
import requestIp from "request-ip";
import UAParser from "ua-parser-js";
import geoip from 'geoip-lite';
import { secret } from "../config/secret";

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

// Extract user agent details (device, OS, browser)
export const extractUserAgentDetails = (userAgent: string) => {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  return {
    os,
    browser,
    device
  };
};

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
    if (secret.NODE_ENV === "development") {
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
