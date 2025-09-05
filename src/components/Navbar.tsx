import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button, buttonVariants } from "./ui/button";
import { Menu } from "lucide-react";
import LogoLight from "@/assets/racc-logo.png";
import LogoDark from "@/assets/racc-logo-dark.png";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";
import cn from "classnames";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/protected",
    label: "Protected Route",
  }
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const {isAuthenticated, user, handleLogout } = useAuthStore();
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  const logout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-stone-700 dark:bg-accent-foreground shadow-md">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-20 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex flex-grow">
            <a
              rel="noreferrer noopener"
              href="/"
              className="flex h-24 py-3 flex-grow flex-row justify-center"
            >
              <img
                src={theme === "dark" ? LogoDark : LogoLight}
                alt="Richfield Area Chamber of Commerce Logo"
                className="h-full w-auto p-1" 
              />
            </a>
          </NavigationMenuItem>


          {/* desktop */}
          <nav className="hidden md:flex gap-2 flex-grow justify-center items-center">
            {routeList.map((route: RouteProps, i) => (
              <a
                rel="noreferrer noopener"
                href={route.href}
                key={i}
                className={`text-[17px] ${buttonVariants({
                  variant: "ghost",
                })}`}
              >
                {route.label}
              </a>
            ))}
          </nav>
          <div className="gap-3 flex pr-3">
            <Button
              size="sm"
              onClick={() => navigate('/nominations')}
              className="bg-card-foreground text-white hidden md:inline-flex"
            >
              Nominations
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/join')}
              className="bg-highlight-foreground hover:bg-highlight-foreground/90 text-white hidden md:inline-flex"
            >
              Join Now
            </Button>
            <Button
              size="sm"
              variant={"outline"}
              onClick={() => navigate('/auth')}
              className="hidden md:inline-flex"
            >
              Member Login
            </Button>
          </div>
          <div className="md:order-2 gap-2 items-center ml-3 hidden md:inline-flex">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src="/profile-icon.png"></AvatarImage>
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="min-w-[240px] mt-6 mr-2">
                <DropdownMenuLabel>
                  <span className="block text-sm font-semibold">{user?.fullName || 'User'}</span>
                  <span className="block truncate text-sm font-normal">{user?.email || 'test@test.com'}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAuthenticated
                  ? <DropdownMenuItem onClick={logout} className="justify-between">
                      <div onClick={logout} className="flex flex-grow h-full">
                        Sign out
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ghost flex flex-row"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                    </DropdownMenuItem>
                  : <DropdownMenuItem className="justify-between py-0 pr-0">
                      <div onClick={() => navigate('/auth')} className="flex flex-grow h-full">
                        Login / Sign Up
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
                  className="flex md:hidden h-5 w-5"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="sr-only">Menu Icon</span>
                </Menu>
              </SheetTrigger>

              <SheetContent side={"left"} className="flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-medium text-md items-center flex flex-col border-b-2 pb-2">
                    <img
                      src={theme === "dark" ? LogoDark : LogoLight}
                      alt="Richfield Area Chamber of Commerce Logo"
                      className="h-16 w-auto p-1 mb-2" 
                    />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col justify-start items-start mt-0">
                  <a
                    rel="noreferrer noopener"
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      // buttonVariants({ variant: "ghost" }),  
                      "border-b-stone-200 border-b-2 text-sm rounded-none w-full py-2 -mt-4 !justify-start"
                    )}
                  >
                    <span className="block text-sm font-semibold">{user?.fullName || 'User'}</span>
                    <span className="block truncate text-sm font-normal">{user?.email || 'test@test.com'}</span>
                  </a>

                  {routeList.map(({ href, label }: RouteProps) => (
                    <a
                      rel="noreferrer noopener"
                      key={label}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        // buttonVariants({ variant: "ghost" }),  
                        "border-b-stone-200 border-b-2 text-sm rounded-none w-full py-2 !justify-start"
                      )}
                    >
                      {label}
                    </a>
                  ))}
                </nav>
                <div className="flex-grow"/>
                <Button
                  size="sm"
                  onClick={() => navigate('/nominations')}
                  className="bg-card-foreground text-white"
                >
                  Nominations
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/join')}
                  className="bg-highlight-foreground hover:bg-highlight-foreground/90 text-white"
                >
                  Join Now
                </Button>
                <Button
                  size="sm"
                  variant={"outline"}
                  onClick={() => navigate('/auth')}
                  className=""
                >
                  Member Login
                </Button>
                <hr className="w-full mx-auto my-2" />

                {isAuthenticated
                  ? <div className="justify-between items-center flex flex-row -mt-4">
                      <div onClick={logout} className="flex flex-grow items-center h-full">
                        Sign out
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ghost flex flex-row -mr-2"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </Button>
                    </div>
                  : <div className="justify-between items-center flex flex-row -mt-4">
                      <div onClick={logout} className="flex flex-grow items-center h-full">
                        Login / Sign Up
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ghost flex flex-row -mr-2"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only text-foreground">Toggle theme</span>
                      </Button>
                    </div>
                }
              </SheetContent>
            </Sheet>
          </span>

        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
