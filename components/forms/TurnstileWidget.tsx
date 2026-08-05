"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileOptions = {
  sitekey: string;
  theme: "dark";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
  "response-field": false;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  active: boolean;
  siteKey?: string;
  onTokenChange: (token: string | null) => void;
};

const scriptId = "cloudflare-turnstile-script";
let turnstileLoader: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoader) {
    return turnstileLoader;
  }

  turnstileLoader = new Promise<TurnstileApi>((resolve, reject) => {
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      reject(new Error("Turnstile loaded without a client API."));
    };

    const handleError = () => reject(new Error("Turnstile client script failed to load."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    turnstileLoader = null;
    throw error;
  });

  return turnstileLoader;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ active, siteKey, onTokenChange }, forwardedRef) {
    const instanceId = useId().replace(/:/g, "");
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string>();
    const tokenChangeRef = useRef(onTokenChange);
    const [status, setStatus] = useState("Loading verification...");
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      tokenChangeRef.current = onTokenChange;
    }, [onTokenChange]);

    const resetWidget = () => {
      tokenChangeRef.current(null);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }

      setHasError(false);
      setStatus("Verification reset for the next submission.");
    };

    useImperativeHandle(forwardedRef, () => ({ reset: resetWidget }));

    useEffect(() => {
      if (!active || !siteKey || !containerRef.current || widgetIdRef.current) {
        return;
      }

      let cancelled = false;

      loadTurnstile()
        .then((turnstile) => {
          if (cancelled || !containerRef.current) {
            return;
          }

          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            "response-field": false,
            callback: (token) => {
              tokenChangeRef.current(token);
              setHasError(false);
              setStatus("Verification complete.");
            },
            "expired-callback": () => {
              tokenChangeRef.current(null);
              setHasError(true);
              setStatus("Verification expired. Complete it again before submitting.");

              if (widgetIdRef.current) {
                turnstile.reset(widgetIdRef.current);
              }
            },
            "error-callback": () => {
              tokenChangeRef.current(null);
              setHasError(true);
              setStatus("Verification could not load. Please try again.");

              if (widgetIdRef.current) {
                turnstile.reset(widgetIdRef.current);
              }
            },
            "timeout-callback": () => {
              tokenChangeRef.current(null);
              setHasError(true);
              setStatus("Verification timed out. Complete it again before submitting.");

              if (widgetIdRef.current) {
                turnstile.reset(widgetIdRef.current);
              }
            },
          });
          setStatus("Verification ready.");
        })
        .catch(() => {
          if (!cancelled) {
            tokenChangeRef.current(null);
            setHasError(true);
            setStatus("Verification could not load. Please try again.");
          }
        });

      return () => {
        cancelled = true;

        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = undefined;
        }
      };
    }, [active, instanceId, siteKey]);

    if (!active || !siteKey) {
      return null;
    }

    return (
      <div className="turnstile-widget" data-error={hasError ? "true" : "false"}>
        <div ref={containerRef} id={`turnstile-${instanceId}`} />
        <p className="turnstile-widget-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    );
  },
);
