import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button";
import { HeroCards } from "./HeroCards";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-top py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6 mb-12">
        <main className="text-5xl md:text-6xl font-medium">
          <h1 className="inline">
            Why Join The{" "}
            <span className="inline bg-gradient-to-b from-highlight-foreground to-highlight text-transparent bg-clip-text">
            Chamber
            </span>{" "}
            ?
          </h1>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
        Together, we can create a strong local economy,
        make connections, represent the interests of
        businesses with the government, and promote
        programs and events to improve our community

        Be assured that the Chamber is here
        to help as you reach your business, life,
        and professional goals because
        <br/>

        <h3 className="text-3xl bg-gradient-to-b from-highlight-foreground to-highlight text-transparent bg-clip-text py-4">
        Your Business is Our Business!
        </h3>
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3">Join Now!</Button>
        </div>
      </div>

      {/* Hero cards sections */}
      {/* <div className="z-10">
        <HeroCards />
      </div> */}
    </section>
  );
};
