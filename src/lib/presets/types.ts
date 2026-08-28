import { OverlayConfig } from "@/components/PriceChart";

export interface IndicatorPreset {
  id: string;
  name: string;
  overlays: OverlayConfig;
  showRSI: boolean;
  showMACD: boolean;
}
