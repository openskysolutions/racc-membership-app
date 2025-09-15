import LogoDark from "@/assets/racc-logo-dark.png";
import { useTheme } from "../providers/theme-provider";

export const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer id="footer" className="bg-card-foreground dark:bg-accent-foreground text-stone-100 text-sm">
      <hr className="w-full mx-auto border-t-border dark:border-b-ring" />
      <section className="container py-8 md:pt-0 grid grid-rows-2 grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-8 lg:gap-4 px-6">
        <div className="rows-span-1 md:row-span-2 col-span-3 sm:col-span-3 md:col-span-2 justify-center items-center flex">
            <a
              rel="noreferrer noopener"
              href="/"
              className="flex w-48 h-auto justify-center items-center"
            >
              <img
                src={theme === "dark" ? LogoDark : LogoDark}
                alt="Richfield Area Chamber of Commerce Logo"
                className="h-full w-full" 
              />
            </a>
        </div>

        <div className="text-sm mt-6 my-4  dark:text-neutral-350 row-span-1 col-span-full sm:cols-span-2 md:col-span-3 justify-center items-center item inline-flex">
          <p>
            The Chamber of Commerce is an organization of businesses who have joined together for business promotion and information.
            The Chamber is your business partner and resource.
            <a rel="noreferrer noopener"
              href="/about"
              className="text-nowrap text-highlight hover:text-highlight-foreground"
            >
              {" "}
              Learn more
            </a>
          </p>
        </div>
        <div className="hidden flex-col md:col-span-2" />

        <div className="flex flex-col col-span-1 text-sm">
          <h3 className="font-medium text-md">Platforms</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Web
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Mobile
            </a>
          </div>
        </div>

        <div className="flex flex-col col-span-1 text-sm">
          <h3 className="font-medium">About</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Benefits
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Pricing
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              FAQ
            </a>
          </div>
        </div>

        <div className="flex flex-col col-span-1 text-sm">
          <h3 className="font-medium text-md">Community</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://www.facebook.com/profile.php?id=100063232268373"
              className="opacity-60 hover:opacity-100"
            >
              Facebook
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-4 dark:text-neutral-350 text-center text-xs px-3">
        <h3>
          Copyright &copy; 2025 Richfield Area Chamber of Commerce {" "} | {" "}
            <a
              rel="noreferrer noopener"
              href="/privacy"
              className="text-highlight transition-all border-primary hover:border-b-2"
            >
              Privacy
            </a>
            {" "} | {" "}
            <a
              rel="noreferrer noopener"
              href="/terms"
              className="text-highlight transition-all border-primary hover:border-b-2"
            >
              Terms
            </a>
            {" "} | {" "}
          <span className="text-nowrap">
            Powered by{" "}
            <a
              rel="noreferrer noopener"
              target="_blank"
              href="https://openskydev.com"
              className="text-highlight transition-all border-primary hover:border-b-2"
            >
              Open Sky Solutions
            </a>
          </span>
        </h3>
      </section>
    </footer>
  );
};
