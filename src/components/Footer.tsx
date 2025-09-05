import LogoDark from "@/assets/racc-logo-dark.png";
import { useTheme } from "../providers/theme-provider";

export const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer id="footer" className="bg-card-foreground dark:bg-accent-foreground text-stone-100 text-sm">
      <hr className="w-full mx-auto border-t-stone-400" />

      <section className="container py-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full md:col-span-2 justify-center flex">
            <a
              rel="noreferrer noopener"
              href="/"
              className="flex h-12 py-0"
            >
              <img
                src={theme === "dark" ? LogoDark : LogoDark}
                alt="Richfield Area Chamber of Commerce Logo"
                className="h-full w-auto" 
              />
            </a>
        </div>

        <div className="flex flex-col">
          <h3 className="font-medium text-md">Follow US</h3>
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

        <div className="flex flex-col">
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

        <div className="flex flex-col">
          <h3 className="font-medium text-md">About</h3>
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

          <div>
            <a
              rel="noreferrer noopener"
              href="/privacy"
              className="opacity-60 hover:opacity-100"
            >
              Privacy
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="/terms"
              className="opacity-60 hover:opacity-100"
            >
              Terms
            </a>
          </div>
        </div>

        <div className="flex flex-col">
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

      <section className="container pb-4 text-center">
        <h3>
          Copyright &copy; 2025 Richfield Area Chamber of Commerce. | 
          Powered by{" "}
          <a
            rel="noreferrer noopener"
            target="_blank"
            href="https://openskydev.com"
            className="text-highlight font-bold transition-all border-primary hover:border-b-2"
          >
            Open Sky Solutions
          </a>
        </h3>
      </section>
    </footer>
  );
};
