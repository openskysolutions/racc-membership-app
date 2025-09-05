import { Button } from "@/components/ui/button";
// import { HeroCards } from "./HeroCards";
import { useNavigate } from 'react-router-dom';
import cn from "classnames";

export const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className={cn(
      ` bg-[url(@/assets/meeting-image.jpg)] bg-cover bg-center bg-no-repeat bg-[#0f172a] bg-opacity-30 bg-blend-multiply`,
      'relative'
    )}>
      <div className={cn(
        "w-full h-full backdrop-blur-[3px] backdrop-brightness-50",
        "container grid 2xl:grid-cols-1 place-items-top py-20 md:py-32 md:px-16 gap-10 max-w-full"
      )}>
        <div className="text-center lg:text-start space-y-6 mb-12">
          <main className="text-5xl md:text-5xl lg:text-6xl font-semibold">
            <h1 className="inline text-muted dark:text-card-foreground">
              Why Join The{" "}
              <span className="inline bg-gradient-to-b from-highlight to-highlight text-transparent bg-clip-text text-nowrap">
              Chamber ?
              </span>
            </h1>
          </main>

          <p className="text-xl text-left text-muted font-extralight dark:text-card-foreground md:w-10/12 mx-auto lg:mx-0">
          Together, we can create a strong local economy,
          make connections, represent the interests of
          businesses with the government, and promote
          programs and events to improve our community

          Be assured that the Chamber is here
          to help as you reach your business, life,
          and professional goals because
          <br/>

          <h3 className="text-3xl bg-gradient-to-b from-highlight to-highlight text-transparent bg-clip-text py-4">
          Your Business is Our Business!
          </h3>
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Button
              className="w-full md:w-1/3 bg-highlight"
              onClick={() => navigate('/join')}
            >
              Join Now!
            </Button>
          </div>
        </div>

        {/* Hero cards sections */}
        {/* <div className="z-10">
          <HeroCards />
        </div> */}
      </div>
    </section>
  );
};
