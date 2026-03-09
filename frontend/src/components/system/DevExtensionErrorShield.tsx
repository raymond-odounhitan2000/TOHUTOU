"use client";

import { useEffect } from "react";

const EXTENSION_PREFIXES = ["chrome-extension://", "moz-extension://", "safari-web-extension://"];
const KNOWN_EXTENSION_ERRORS = ["Failed to connect to MetaMask", "MetaMask"];

type ErrorLike = {
  message?: string;
  stack?: string;
  source?: string;
};

function containsExtensionSignal(text: string): boolean {
  return EXTENSION_PREFIXES.some((prefix) => text.includes(prefix));
}

function shouldIgnoreExtensionError(input: ErrorLike): boolean {
  const message = (input.message || "").toLowerCase();
  const stack = (input.stack || "").toLowerCase();
  const source = (input.source || "").toLowerCase();

  const knownMessage = KNOWN_EXTENSION_ERRORS.some((errorText) =>
    message.includes(errorText.toLowerCase())
  );
  const extensionStack = containsExtensionSignal(stack) || containsExtensionSignal(source);

  return knownMessage || extensionStack;
}

function normalizeUnknownError(reason: unknown): ErrorLike {
  if (typeof reason === "string") {
    return { message: reason };
  }

  if (reason && typeof reason === "object") {
    const withMessage = reason as { message?: unknown; stack?: unknown; source?: unknown };
    return {
      message: typeof withMessage.message === "string" ? withMessage.message : undefined,
      stack: typeof withMessage.stack === "string" ? withMessage.stack : undefined,
      source: typeof withMessage.source === "string" ? withMessage.source : undefined,
    };
  }

  return {};
}

export default function DevExtensionErrorShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const onError = (event: ErrorEvent) => {
      const payload: ErrorLike = {
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
      };

      if (shouldIgnoreExtensionError(payload)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const payload = normalizeUnknownError(event.reason);
      if (shouldIgnoreExtensionError(payload)) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
