export default function AuthLayout({ children }) {
  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex items-center justify-center p-4 md:p-8">
      {children}
    </div>
  );
}
