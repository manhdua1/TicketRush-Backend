import Link from "next/link";

type LogoProps = {
  className?: string;
  href?: string;
};
export default function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="TicketRush"
      className={
        "inline-flex select-none items-center font-extrabold tracking-tight transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 " +
        (className ?? "")
      }
    >
      <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
        TicketRush
      </span>
    </Link>
  );
}
