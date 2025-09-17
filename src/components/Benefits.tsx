import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaCheck } from "react-icons/fa";

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
    label: "Business listed in the Chamber directory on Chamber website",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Subscription to the Chamber Newsletter",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Free booth at the Fall Festival",
    checks: { basic: true, enhanced: true, elite: true },
  },
  {
    label: "Free monthly education courses",
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
    label:
      "Upgraded listing in Chamber Directory to include link to your business website",
    checks: { basic: false, enhanced: true, elite: true },
  },
  {
    label: "Business announced as new member on Chamber social media pages",
    checks: { basic: false, enhanced: true, elite: true },
  },
  {
    label: "One free ticket to monthly luncheons",
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
    label: "Small ad on placemats for luncheons",
    checks: { basic: false, enhanced: false, elite: true },
  },
  {
    label:
      "Upgraded directory listing to include links to your website and your social media pages",
    checks: { basic: false, enhanced: false, elite: true },
  },
  {
    label: "Free luncheon sponsorship (not exclusive) once a year",
    checks: { basic: false, enhanced: false, elite: true },
  },
];

const newMemberBenefits: string[] = [
  "$500 worth of advertising on Mid-Utah Radio for new Chamber members in 2025",
  "Subscription to the Chamber newsletter",
  "Time to share about your business at first Chamber luncheon",
  "Business announced as new member at first Chamber luncheon",
  "Ribbon cutting, open house or groundbreaking support for new business",
  "Business announced as new member in Chamber newsletter and in newspaper",
];

const addOns: { item: string; price: number }[] = [
  { item: "Prepay luncheons for year", price: 150 },
  { item: "Luncheon Sponsorship (not exclusive)", price: 100 },
  { item: "Annual Dinner per ticket", price: 25 },
  { item: "Annual Dinner Table for 6", price: 125 },
  { item: "Small ad on Placemat", price: 200 },
  { item: "Upgrade small ad to medium ad", price: 100 },
  { item: "Upgrade medium ad to large ad", price: 100 },
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
      {active ? <FaCheck className="w-3 h-3 md:w-5 md:h-5" /> : null}
    </div>
  );
}

export default function ChamberMembershipBenefits() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 mb-16">

      {/* Benefits table */}
      <Card className="shadow-sm mb-16">
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom section: New Member Benefits + Add-ons */}
      <div className="grid md:grid-cols-5 gap-8 mb-16">
        <Card className="md:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>New Member Benefits</CardTitle>
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
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {addOns.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{row.item}</TableCell>
                    <TableCell className="w-24 text-right text-sm font-semibold">
                      ${row.price}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

