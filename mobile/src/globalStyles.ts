// Native builds get their styles from the NativeWind babel plugin, so this is a
// no-op. The .web.ts variant pulls in the generated Tailwind stylesheet, which
// NativeWind needs on web because it forwards classNames to the DOM instead.
export {};
