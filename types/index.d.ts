export {};

declare global {
  interface ProviderInfo {
    id: string;
    name: string;
    color: { r: number; g: number; b: number };
    icon: string;
  }
}
