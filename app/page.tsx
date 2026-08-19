import { Converter } from "@/components/converter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-2xl items-center justify-between px-4 py-6">
        <h1 className="text-base font-semibold tracking-tight">
          URL → Markdown
        </h1>
        <ThemeToggle />
      </div>
      <main className="flex w-full flex-1 flex-col items-center px-4 pb-16">
        <Converter />
      </main>
    </div>
  );
}
