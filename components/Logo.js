export default function Logo({ size = 26, wordmark = true, textSize }) {
  return (
    <span className="iv-brand">
      <img src="/cam-logo.png" alt="CAM" className="iv-brand-logo" style={{ height: size }} />
      {wordmark && (
        <span className="iv-logo-text" style={textSize ? { fontSize: textSize } : undefined}>CAM</span>
      )}
    </span>
  );
}
