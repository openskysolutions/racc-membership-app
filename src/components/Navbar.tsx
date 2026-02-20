import { useState, useEffect } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button, buttonVariants } from "@/components/ui/button";
import { Menu } from "lucide-react";
import LogoLight from "@/assets/racc-logo.png";
import LogoDark from "@/assets/racc-logo-dark.png";
import { Avatar, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/providers/theme-provider";
import { Moon, Sun } from "lucide-react";
import cn from "classnames";
import { isAndroid } from "@/lib/platform";
import { postService, type Post } from "@/services/blogService";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "/calendar",
    label: "Calendar",
  },
  {
    href: "/members",
    label: "Members",
  },
  {
    href: "/jobs",
    label: "Jobs",
  },

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
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const {isAuthenticated, user, handleLogout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, setTheme } = useTheme();
  const isAndroidDevice = isAndroid();

  useEffect(() => {
    loadBlogPosts();
    
    // Listen for post updates
    const handlePostUpdate = () => {
      loadBlogPosts();
    };
    
    window.addEventListener('postsUpdated', handlePostUpdate);
    return () => window.removeEventListener('postsUpdated', handlePostUpdate);
  }, []);

  async function loadBlogPosts() {
    try {
      const posts = await postService.list({ limit: 10 });
      setBlogPosts(posts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    }
  }

  const logout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <header 
      className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-popover dark:bg-accent-foreground shadow-md"
      style={isAndroidDevice ? { paddingTop: 'var(--safe-area-inset-top, 0px)' } : undefined}
    >
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-20 px-4 w-screen flex justify-center md:justify-between items-center relative">
          <a
            rel="noreferrer noopener"
              onClick={() => navigate('/')}
            className={cn(
              "flex flex-row h-18 py-1 self-center justify-center md:justify-start",
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
                {/* {(import.meta.env.DEV || isNative) && ( */}
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
                {/* )} */}
              </>
            }
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`rounded-full flex items-center h-9 px-1 py-1 ${isAuthenticated ? 'gap-2 pl-3 rounded-lg hover:bg-neutral-300/40 dark:hover:bg-neutral-300/20' : ''} transition-colors`}
              >
                <span className="text-sm font-semibold">{user?.name}</span>
                <Avatar className="h-8 w-auto">
                  <AvatarImage
                    src={user?.avatarUrl ? user.avatarUrl : "/profile-icon.png"}
                    alt={user?.name || 'User Avatar'}
                  />
                </Avatar>
                <span className="sr-only text-foreground">User menu</span>
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
                    {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'board_member') && (
                      <DropdownMenuItem onClick={() => navigate('/voting')}>
                        <span className="flex items-center gap-2">
                          Monthly Voting
                        </span>
                      </DropdownMenuItem>
                    )}
                    {user?.status === 'active' && (
                      <DropdownMenuItem onClick={() => navigate('/yearly-voting')}>
                        <span className="flex items-center gap-2">
                          Yearly Voting
                        </span>
                      </DropdownMenuItem>
                    )}
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
          <span className="flex md:hidden absolute right-4 z-10">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button 
                  className="p-3 -m-1 touch-manipulation active:scale-95 transition-transform"
                  onClick={() => setIsOpen(true)}
                >
                  <Menu className="h-8 w-8" />
                  <span className="sr-only">Menu Icon</span>
                </button>
              </SheetTrigger>

              <SheetContent side={"left"} id="mobile-nav" className="flex flex-col border-r-0">
                <SheetHeader>
                  <SheetTitle className="font-medium text-md items-center flex flex-col border-b-1 border-b-stone-300 dark:border-b-stone-600 pb-6">
                    <a
                      rel="noreferrer noopener"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/')
                      }}
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
                        "flex items-center gap-3 border-b-1 border-b-stone-300 dark:border-b-stone-600 text-sm rounded-none w-full py-3 !justify-start text-left focus:outline-none"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.avatarUrl ? user.avatarUrl : "/profile-icon.png"}
                          alt={user?.name || 'User Avatar'}
                        />
                      </Avatar>
                      <div>
                        <span className="flex text-lg leading-none font-semibold p-0 mb-1">{user?.firstName} {user?.lastName}</span>
                        <span className="flex truncate text-sm font-normal">{user?.email}</span>
                      </div>
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
                        "border-b-1 border-b-stone-300 dark:border-b-stone-600 text-lg rounded-none w-full py-3 !justify-start text-left focus:outline-none"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  
                  {blogPosts.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="news-events" className="border-b-1 border-b-stone-300 dark:border-b-stone-600">
                        <AccordionTrigger className="text-lg font-semibold py-3 hover:no-underline">
                          News & Events
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col">
                            {blogPosts.map((post) => (
                              <button
                                key={post.id}
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/blog/${post.slug}`);
                                }}
                                className="border-b-1 border-b-stone-300 dark:border-b-stone-600 text-base rounded-none w-full py-2 pl-4 !justify-start text-left focus:outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                {post.title}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
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
                {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'board_member') && (
                  <Button
                    size="lg"
                    variant={"outline"}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/voting');
                    }}
                    className="text-lg"
                  >
                    Monthly Voting
                  </Button>
                )}
                {user?.status === 'active' && (
                  <Button
                    size="lg"
                    variant={"outline"}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/yearly-voting');
                    }}
                    className="text-lg"
                  >
                    Yearly Voting
                  </Button>
                )}
                {user?.role === 'admin' && (
                  <Button
                    size="lg"
                    variant={"outline"}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/admin');
                    }}
                    className="text-lg"
                  >
                    Admin Dashboard
                  </Button>
                )}
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
                      {/* {(import.meta.env.DEV || import.meta.env.VITE_PLATFORM === 'mobile') && ( */}
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
                      {/* )} */}
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
            
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                buttonVariants({ variant: "ghost", size: 'xs' }),
                "px-1 py-1 !h-6 hover:bg-highlight-foreground rounded-md"
              )}>
                News & Events
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-auto px-2 max-h-[400px] overflow-y-auto">
                {blogPosts.length > 0 ? (
                  blogPosts.map((post) => (
                    <DropdownMenuItem key={post.id} onClick={() => navigate(`/blog/${post.slug}`)}>
                      <div className="flex flex-col gap-1 py-1">
                        <div className="text-sm font-medium">{post.title}</div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-sm text-muted-foreground">No posts available</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {routeList.map(({ href, label }) => {
              // Special handling for About menu item with dropdown
              if (label === 'About') {
                return (
                  <DropdownMenu key={label}>
                    <DropdownMenuTrigger className={cn(
                      buttonVariants({ variant: "ghost", size: 'xs' }),
                      "px-1 py-1 !h-6 hover:bg-highlight-foreground rounded-md"
                    )}>
                      {label}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-auto px-2">
                      <DropdownMenuItem onClick={() => navigate('/about')}>
                        <span className="text-sm">About Us</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/board')}>
                        <span className="text-sm">Board Members</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <NavigationMenuItem key={label} className="list-none">
                  <NavigationMenuLink asChild>
                    <a
                      href={href}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: 'xs' }),
                        "px-1 py-1 !h-6 hover:bg-highlight-foreground rounded-md")}
                    >
                      {label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
