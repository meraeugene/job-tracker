import { BriefcaseBusiness } from "lucide-react";

export const companyDomains: Record<string, string> = {
  Adobe: "adobe.com",
  Atlassian: "atlassian.com",
  Canva: "canva.com",
  Dropbox: "dropbox.com",
  Figma: "figma.com",
  GitHub: "github.com",
  Linear: "linear.app",
  Notion: "notion.so",
  Slack: "slack.com",
  Stripe: "stripe.com",
};

export function CompanyLogo({ company }: { company: string }) {
  const domain = companyDomains[company];

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
      {domain ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={`${company} logo`}
          className="h-full w-full object-contain p-1"
          loading="lazy"
        />
      ) : (
        <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export function PlatformLogo({ platform }: { platform: string }) {
  const svg =
    platform === "LinkedIn"
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0A66C2"/><text x="7" y="23" fill="white" font-family="Arial" font-size="18" font-weight="700">in</text></svg>`
      : platform === "Indeed"
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2557D6"/><text x="12" y="24" fill="white" font-family="Arial" font-size="22" font-weight="700">i</text></svg>`
        : platform === "JobStreet"
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#5B4DFF"/><text x="5" y="21" fill="white" font-family="Arial" font-size="13" font-weight="700">JS</text></svg>`
          : null;

  if (!svg) return <span>{platform}</span>;

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
        alt={`${platform} logo`}
        className="h-5 w-5 shrink-0 object-contain"
        loading="lazy"
      />
      <span>{platform}</span>
    </span>
  );
}

export function JobSourceLogo({
  platform,
  company,
}: {
  platform: string;
  company: string;
}) {
  if (platform === "Company Site" && companyDomains[company]) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://logo.clearbit.com/${companyDomains[company]}`}
          alt={`${company} logo`}
          className="h-5 w-5 shrink-0 object-contain"
          loading="lazy"
        />
        <span>{platform}</span>
      </span>
    );
  }

  return <PlatformLogo platform={platform} />;
}
