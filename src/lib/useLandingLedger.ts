import { useEffect, useState } from "react";
import { fetchLandingLedger, LEDGER_FALLBACK, type LedgerData } from "./landingLedger";

export type LedgerStatus = "loading" | "live" | "fallback";

export interface UseLandingLedger {
  status: LedgerStatus;
  /** Always renderable: live data or LEDGER_FALLBACK. */
  data: LedgerData;
}

export function useLandingLedger(): UseLandingLedger {
  const [state, setState] = useState<UseLandingLedger>({
    status: "loading",
    data: LEDGER_FALLBACK,
  });

  useEffect(() => {
    let ignore = false;

    fetchLandingLedger()
      .then((result) => {
        if (ignore) return;
        setState(
          result
            ? { status: "live", data: result }
            : { status: "fallback", data: LEDGER_FALLBACK },
        );
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error("[landing-ledger]", err);
        setState({ status: "fallback", data: LEDGER_FALLBACK });
      });

    return () => {
      ignore = true;
    };
  }, []);

  return state;
}
