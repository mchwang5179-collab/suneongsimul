interface PageLoaderProps {
  label?: string;
}

export default function PageLoader({ label = "불러오는 중입니다..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background-100">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <i className="ri-loader-4-line animate-spin text-2xl" aria-hidden="true"></i>
      </span>
      <p className="text-sm text-foreground-600">{label}</p>
    </div>
  );
}