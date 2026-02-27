export default function LoginLoading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-var(--content-offset,80px))] p-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
