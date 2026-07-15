import Navbar from "@/components/Navbar";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grain flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="relative flex flex-1 flex-col pt-16">
        {children}
      </main>
      <footer className="border-t border-border bg-canvas py-10">
        <div className="mx-auto max-w-[1400px] px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">XQlyte</span>
            <span className="text-border-hover">—</span>
            <span>Payment diagnostics for Nervos Fiber Network.</span>
          </div>
          <span>&copy; {new Date().getFullYear()} XQlyte. Built for CKB fnn.</span>
        </div>
      </footer>
    </div>
  );
}
