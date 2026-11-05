export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "rgba(var(--text-muted), 0.3)", borderTopColor: "transparent" }} />
    </div>
  );
}
