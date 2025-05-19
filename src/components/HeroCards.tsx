import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Check, Linkedin } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { OpenSkyLogo } from '@/components/Icons';
import cn from "classnames";

export const HeroCards = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">

      {/* Pricing */}
      <Card className="w-full mt:12 md:w-72 h-full drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader>
          <CardTitle className="flex item-center justify-between">
            Free
            <Badge
              variant="secondary"
              className="text-sm text-primary"
            >
              Most popular
            </Badge>
          </CardTitle>
          <div>
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground"> /month</span>
          </div>

          <CardDescription>
            Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button className="w-full">Start Free Trial</Button>
        </CardContent>

        <hr className="w-4/5 m-auto mb-4" />

        <CardFooter className="flex">
          <div className="space-y-4">
            {["4 Team member", "4 GB Storage", "Upto 6 pages", "Light & dark mode"].map(
              (benefit: string) => (
                <span
                  key={benefit}
                  className="flex"
                >
                  <Check className="text-green-500" />{" "}
                  <h3 className="ml-2">{benefit}</h3>
                </span>
              )
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Team */}
      <Card className="w-full md:w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
        <CardHeader className="mt-8 mb-6 flex justify-center items-center pb-2 pt-0">
          <OpenSkyLogo className={cn('mt-2 mb-2 md:mb-6 h-60 w-60')} />
          <CardDescription className="text-primary text-md font-bold">
            Accelerate Your Growth with Custom Software
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-2">
          <p>High-performance web, mobile & desktop apps tailored for mid-market businesses.</p>
        </CardContent>

        <CardFooter>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://github.com/openskysolutions"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">Github icon</span>
              <GitHubLogoIcon className="w-5 h-5" />
            </a>
            <a
              rel="noreferrer noopener"
              href="https://twitter.com/schotttaylor"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">X icon</span>
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="fill-foreground w-5 h-5"
              >
                <title>X</title>
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>

            <a
              rel="noreferrer noopener"
              href="https://www.linkedin.com/in/openskysolutions/"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">Linkedin icon</span>
              <Linkedin size="20" />
            </a>
          </div>
        </CardFooter>
      </Card>

    </div>
  );
};
