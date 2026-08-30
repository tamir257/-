"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "onboarding-seen";

/** Shows the onboarding modal once, automatically, on a visitor's first load. */
export function useOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!seen) setOpen(true);
    } catch {
      // ignore — worst case the modal doesn't auto-show
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // non-fatal
    }
  }

  function reopen() {
    setOpen(true);
  }

  return { open, close, reopen };
}
