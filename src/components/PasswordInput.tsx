import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };

export function PasswordInput({ className = "", ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`w-full h-12 rounded-2xl border-2 border-border bg-background px-4 pr-12 font-semibold focus:outline-none focus:border-primary transition ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 -translate-y-1/2 right-3 h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
