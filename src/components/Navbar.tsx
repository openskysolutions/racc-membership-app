import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button, buttonVariants } from "@/components/ui/button";
import { Menu } from "lucide-react";
import LogoLight from "@/assets/racc-logo.png";
import LogoDark from "@/assets/racc-logo-dark.png";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/providers/theme-provider";
import { Moon, Sun } from "lucide-react";
import cn from "classnames";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  // {
  //   href: "/discussions",
  //   label: "Discussions",
  // },
  // {
  //   href: "/courses",
  //   label: "Courses",
  // },
  // {
  //   href: "/news-events",
  //   label: "News & Events",
  // },
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/calendar",
    label: "Calendar",
  },
  {
    href: "/members",
    label: "Members",
  },
  // {
  //   href: "/job-postings",
  //   label: "Jobs Postings"
  // },
  {
    href: "/contact",
    label: "Contact",
  },
  {
    href: "/about",
    label: "About",
  },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const {isAuthenticated, user, handleLogout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, setTheme } = useTheme();

  const logout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-popover dark:bg-accent-foreground shadow-md">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-20 px-4 w-screen flex justify-between ">
          <a
            rel="noreferrer noopener"
            href="https://richfieldareachamber.com"
            className={cn(
              "flex flex-row flex-grow-0 flex-shrink-0 h-20 py-1 justify-center md:justify-start ml-10 md:ml-0",
            )}
          >
            <img
              src={theme === "dark" ? LogoDark : LogoLight}
              alt="Richfield Area Chamber of Commerce Logo"
              className="h-full w-auto p-1" 
            />
          </a>
          <div className="md:order-2 gap-2 items-center ml-3 hidden md:inline-flex">
            <Button
              size="sm"
              onClick={() => navigate('/nominations')}
              className={cn(
                "bg-card-foreground dark:bg-card-foreground text-card hidden md:inline-flex",
                // "p-2 h-7 text-xs"
              )}
            >
              Nominations
            </Button>
            {!isAuthenticated &&
              <>
                {import.meta.env.DEV && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => navigate('/join')}
                      className={cn(
                        "bg-highlight-foreground hover:bg-highlight-foreground/90 text-card hidden md:inline-flex",
                        // "p-2 h-7 text-xs"
                      )}
                    >
                      Join Now
                    </Button>
                    <Button
                      size="sm"
                      color="red"
                      variant={"outline"}
                      onClick={() => navigate('/login', { state: { from: location } })}
                      className={cn(
                        "hidden md:inline-flex",
                        // "p-2 h-7 text-xs"
                      )}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </>
            }
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="border-1 border-input rounded-lg h-9 w-9">
                  <AvatarImage src="/profile-icon.png"></AvatarImage>
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="min-w-[240px] mt-6 mr-2">
                {isAuthenticated &&
                  <>
                    <DropdownMenuLabel>
                      <span className="block text-sm font-semibold">{user?.name || 'User'}</span>
                      {/* <span className="block truncate text-sm font-normal">{user?.email || 'test@test.com'}</span> */}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <span className="flex items-center gap-2">
                          Admin Dashboard
                        </span>
                      </DropdownMenuItem>
                    )}
                  </>
                }
                {isAuthenticated
                  ? <>
                      <DropdownMenuSeparator /> 
                      <DropdownMenuItem className="justify-between">
                        <div onClick={logout} className="flex flex-grow h-full">
                          Sign out
                        </div>
                        <div
                          className="ghost flex flex-row border-l-1 border-l-stone-400 p-1 pl-3"
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                          <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                      </DropdownMenuItem>
                    </>
                  : <DropdownMenuItem className="justify-between py-0 pr-0">
                      <div className="flex flex-grow h-full">
                        Toggle theme
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ghost flex flex-row"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only text-foreground">Toggle theme</span>
                      </Button>
                    </DropdownMenuItem>
                }
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* mobile */}
          <span className="flex md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="px-2">
                <Menu
                  className="flex md:hidden h-8 w-8"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="sr-only">Menu Icon</span>
                </Menu>
              </SheetTrigger>

              <SheetContent side={"left"} className="flex flex-col border-r-0">
                <SheetHeader>
                  <SheetTitle className="font-medium text-md items-center flex flex-col border-b-1 border-b-stone-300 dark:border-b-stone-600 pb-6">
                    <a
                      rel="noreferrer noopener"
                      href="https://richfieldareachamber.com"
                      className="flex items-center justify-center"
                    >
                      <img
                        src={theme === "dark" ? LogoDark : LogoLight}
                        alt="Richfield Area Chamber of Commerce Logo"
                        className="h-16 w-auto p-1" 
                      />
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col justify-start items-start -mt-4">
                  {isAuthenticated &&
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/profile');
                      }}
                      className={cn(
                        // buttonVariants({ variant: "ghost" }),  
                        "border-b-1 border-b-stone-300 dark:border-b-stone-600 text-sm rounded-none w-full py-2 !justify-start text-left"
                      )}
                    >
                      <span className="block text-lg font-semibold">{user?.firstName} {user?.lastName}</span>
                      <span className="block truncate text-sm font-normal">{user?.email}</span>
                    </button>
                  }   
                  {routeList.map(({ href, label }: RouteProps) => (
                    <button
                      key={label}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(href);
                      }}
                      className={cn(
                        // buttonVariants({ variant: "ghost" }),  
                        "border-b-1 border-b-stone-300 dark:border-b-stone-600 text-lg rounded-none w-full py-2 !justify-start text-left"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                <div className="flex-grow"/>
                <Button
                  size="lg"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/nominations');
                  }}
                  className="bg-card-foreground text-card text-lg"
                >
                  Nominations
                </Button>
                {isAuthenticated 
                  ? <Button
                      size="lg"
                      variant={"outline"}
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      className="text-lg"
                    >
                      Sign out
                    </Button>
                  : <>
                      {import.meta.env.DEV && (
                        <>
                          <Button
                            size="lg"
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/join');
                            }}
                            className="bg-highlight-foreground hover:bg-highlight-foreground/90 text-white text-lg"
                          >
                            Join Now
                          </Button>
                          <Button
                            size="lg"
                            variant={"outline"}
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/login', { state: { from: location } });
                            }}
                            className="text-lg"
                          >
                            Member Login
                          </Button>
                        </>
                      )}
                    </>
                }

                <div 
                  className="flex flex-row justify-between items-center w-full py-4 border-t-1 border-t-stone-300 dark:border-t-stone-400"
                  onClick={() => {
                    setIsOpen(false);
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                >
                  <div className="text-foreground text-lg">Toggle theme</div>
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block" />
                </div>
              </SheetContent>
            </Sheet>
          </span>

        </NavigationMenuList>
      </NavigationMenu>
      <NavigationMenu className="hidden md:flex max-w-full w-full bg-background border-t dark:bg-neutral-800 border-t-border dark:border-t-popover"> 
        <NavigationMenuList className="container h-10 px-0 w-screen flex justify-around items-center">
            {routeList.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: 'xs' }),
                  "px-1 py-1 !h-6 hover:bg-highlight-foreground rounded-md")}
              >
                {label}
              </a>
            ))}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
