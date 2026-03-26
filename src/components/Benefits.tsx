import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { openExternalUrl, membershipUrls } from "@/lib/externalBrowser";
import cn from "classnames";

/**
 * Richfield Area Chamber of Commerce — Membership Benefits
 * A single-file React component using shadcn/ui + Tailwind.
 * Layout mirrors the content of the provided flyer.
 *
 * Notes:
 * - Tiers & checks are inferred from the image and can be tweaked easily by
 *   editing the `benefits` array below.
 * - Drop this into a Next.js app that already has shadcn/ui installed.
 */

const tiers = [
  { key: "basic", label: "Basic", price: 300 },
  { key: "enhanced", label: "Enhanced", price: 550 },
  { key: "elite", label: "Elite", price: 900 },
] as const;

type TierKey = typeof tiers[number]["key"];

const benefits: Array<{
  label: string;
  checks: Record<TierKey, boolean>;
}> = [
  {
    label: "Your business featured in the Chamber’s online directory with a customizable profile—add your website, bio, photos, social links, job postings, and coupons to help customers easily find and connect with you.",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "1/6 Ad in the Sevier County Magazine + Discounts to upgrade ad size",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Subscription to the Chamber Newsletter",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "$30 booth at the Fall Festival (must register by July 1st)",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Discounted/ Free monthly education courses offered by the Sevier County Entrepreneurship Program",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Networking opportunities at lunches",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Sponsorship opportunities",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Member listing Cover image",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Member listing coupon uploads",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label:
      "Upgraded listing in Chamber Directory to include link to your business website",
    checks: { basic: true, enhanced: true, elite: true },
  },
  // {
  //   label: "Business announced as new member on Chamber social media pages",
  //   checks: { basic: false, enhanced: true, elite: true },
  // },
  {
    label: "One free ticket to luncheons every month (excludes Annual Dinner)",
    checks: { basic: false, enhanced: true, elite: true },
  },
  {
    label: "Business featured once a year in Richfield Reaper",
    checks: { basic: false, enhanced: true, elite: true },
  },
  {
    label: "Business Spotlight once a year on Radio",
    checks: { basic: false, enhanced: false, elite: true },
  },
  {
    label: "Ad on placemats for luncheons",
    checks: { basic: false, enhanced: false, elite: true },
  },
  {
    label: "Free luncheon sponsorship once a year",
    checks: { basic: false, enhanced: false, elite: true },
  },
];

const newMemberBenefits: string[] = [
  "$500 worth of advertising on Mid-Utah Radio for new Chamber members",
  "Time to share about your business at first Chamber luncheon",
  "Ribbon cutting, open house or groundbreaking support for new business",
  "Business announced as new member in Chamber newsletter, in newspaper, radio, and on social media",
];

const optionalAddons: String[] = [
  "Luncheon Sponsor: $100",
  "Pre-pay Monthly Luncheons: $170",
  "Ad on luncheon placemats: $300",
  "Business Landing page website: $150",
];

function CheckCell({ active }: { active: boolean }) {
  return (
    <div
      className={
        "mx-auto flex h-7 w-7 items-center justify-center rounded-full border-0 " +
        (active
          ? "text-emerald-600"
          : "text-muted-foreground/40")
      }
      aria-label={active ? "Included" : "Not included"}
    >
      {active ? <FaCheck className="w-5 h-5" /> : null}
    </div>
  );
}

export default function ChamberMembershipBenefits() {
  const navigate = useNavigate();

  const handleMembershipClick = async (path: string) => {
    const handled = await openExternalUrl(path);
    if (!handled) {
      // On web, use React Router
      navigate(path);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 mb-16">

      {/* Benefits table */}
      <Card className="shadow-sm mb-8 text-am">
        <CardHeader>
          <CardTitle>Benefits by Membership Level</CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[55%] px-2">Benefits</TableHead>
                {tiers.map((t) => (
                  <TableHead key={t.key} className="text-center px-0 md:px-2">
                    {t.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefits.map((row, i) => (
                <TableRow key={i} className="align-top">
                  <TableCell className="pl-2 pr-0 py-2 text-sm">{row.label}</TableCell>
                  {tiers.map((t) => (
                    <TableCell key={t.key} className="px-3 text-center">
                      <CheckCell active={row.checks[t.key]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {/* Buttons row */}
              <TableRow className="border-t-2">
                <TableCell className="pl-2 pr-2 py-4 font-bold">
                  Choose Your Membership
                </TableCell>
                <TableCell className="px-0 text-center py-2">
                  <Button
                    size="sm"
                    onClick={() => handleMembershipClick(membershipUrls.basic)}
                    className={cn(
                      "bg-card-foreground hover:bg-card-foreground/90 text-card w-full text-wrap px-1 md:px-3 h-9 sm:h-12"
                    )}
                  >
                    Basic
                  </Button>
                </TableCell>
                <TableCell className="px-1 text-center py-2">
                  <Button
                    size="sm"
                    onClick={() => handleMembershipClick(membershipUrls.enhanced)}
                    className={cn(
                      "bg-blue-500 hover:bg-blue-600 text-white w-full text-wrap font-normal px-1 md:px-3 h-9 sm:h-12"
                    )}
                  >
                    Enhanced
                  </Button>
                </TableCell>
                <TableCell className="px-0 text-center py-2">
                  <Button
                    size="sm"
                    onClick={() => handleMembershipClick(membershipUrls.elite)}
                    className={cn(
                      "bg-highlight-foreground hover:bg-highlight-foreground/90 text-card w-full text-wrap px-1 md:px-3 h-9 sm:h-12"
                    )}
                  >
                    Elite
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-5 gap-8 mb-16">
        <Card className="md:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle>New Member Benefits - for all membership levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {newMemberBenefits.map((b, idx) => (
                <li key={idx} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardHeader>
            <CardTitle>Optional Add Ons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {optionalAddons.map((b, idx) => (
                <li key={idx} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

