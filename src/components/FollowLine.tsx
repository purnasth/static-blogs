import { profile } from "@/lib/profile";
import { follow } from "@/lib/site";

/**
 * The quiet counterpart to the share row: share is "tell someone else", this is
 * "hear about the next one".
 *
 * Without it a reader who liked a post has no route back — reactions tell you
 * they enjoyed it, and then they leave. RSS is the honest, zero-obligation
 * version of a mailing list, so it leads.
 */
export default function FollowLine() {
  return (
    <p className="meta mt-8 border-t border-line pt-5 text-muted">
      Enjoyed this?{" "}
      <a
        href="/rss.xml"
        className="text-foreground underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
      >
        Subscribe by RSS
      </a>
      {follow.map((item) => (
        <span key={item.href}>
          {" · "}
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
          >
            {item.label}
          </a>
        </span>
      ))}
      {" — or see more of my work at "}
      <a
        href={profile.portfolio}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
      >
        purnashrestha.com.np
      </a>
      .
    </p>
  );
}
