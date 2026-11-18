/** Shown instantly while a page loads, so opening the app never feels frozen. */
export default function Loading() {
  return (
    <main className="page" style={{ minHeight: '70svh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 }}>
      <span className="wordmark" style={{ fontSize: '2.4rem' }}>Secretly Santa</span>
      <span className="loader" aria-label="Loading" />
    </main>
  );
}
