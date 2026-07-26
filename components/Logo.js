export default function Logo({ size = 26 }) {
  return (
    <span className="iv-brand-mark" style={{ height: size }}>
      <img src="/cam-logo.png" alt="Competence Asset Management" className="iv-brand-logo" style={{ height: size * 0.62 }} />
    </span>
  );
}
