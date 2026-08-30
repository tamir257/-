import { OverlayConfig } from "@/components/PriceChart";

export interface IndicatorPreset {
  id: string;
  name: string;
  overlays: OverlayConfig;
  showRSI: boolean;
  showMACD: boolean;
  /** Plain-language "what is this for" — shown for built-in presets. */
  description?: string;
  /** Built-in presets ship with the app; they can be applied but not deleted. */
  builtin?: boolean;
}
