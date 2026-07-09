"use client";

import React from "react";
import Link from "next/link";
import {
  useMantineColorScheme,
  useComputedColorScheme,
  rem,
  Avatar,
  Menu,
  UnstyledButton,
  ActionIcon,
  Container,
  Drawer,
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "next-auth/react";
import {
  IconLogout,
  IconUser,
  IconChevronDown,
  IconSun,
  IconMoon,
  IconSearch,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import cx from "clsx";
import classes from "./Navbar.module.css";

/* ── Grid geometric logo mark ── */
function GridLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={28} height={28} aria-hidden="true">
      {/* Anvil-inspired geometric mark */}
      <rect x="4" y="10" width="24" height="14" fill="var(--accent)" />
      <rect x="10" y="4" width="12" height="8" fill="var(--accent)" opacity={0.7} />
      <rect x="0" y="22" width="32" height="4" fill="var(--accent)" opacity={0.4} />
      {/* Spark dot */}
      <circle cx="26" cy="6" r="3" fill="var(--accent-2)" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/skills",      label: "Skills" },
  { href: "/projects",    label: "Projects" },
  { href: "/discussions", label: "Discuss" },
  { href: "/events",      label: "Events" },
  { href: "/quizzes",     label: "Quizzes" },
  { href: "/chat",        label: "Chat" },
  { href: "/community",   label: "Community" },
  { href: "/roast",       label: "Roast" },
];

export function Navbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const toggleTheme = () =>
    setColorScheme(computedColorScheme === "light" ? "dark" : "light");

  return (
    <header className={classes.header}>
      <Container size="xl" className={classes.inner}>
        {/* Brand */}
        <Link href="/" className={classes.brand} id="nav-brand">
          <GridLogo />
          <span className={classes.brandName}>Grid</span>
        </Link>

        {/* Desktop nav links — logged in only */}
        {user && (
          <nav className={classes.navLinks}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={classes.navLink}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side actions */}
        <div className={classes.actions}>
          {user && (
            <ActionIcon
              component={Link}
              href="/users"
              className={classes.iconBtn}
              aria-label="Search people"
              title="Find people"
            >
              <IconSearch size={16} />
            </ActionIcon>
          )}

          {/* Theme toggle */}
          <ActionIcon
            onClick={toggleTheme}
            className={classes.iconBtn}
            aria-label="Toggle theme"
          >
            <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
            <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
          </ActionIcon>

          {/* User menu or auth buttons */}
          {user ? (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton className={classes.userBtn}>
                  <Avatar
                    src={user.photoURL}
                    alt={user.displayName || ""}
                    size={28}
                    radius={0}
                    color="orange"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {(profile?.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </Avatar>
                  <span className={classes.userName}>
                    {profile?.name?.split(" ")[0] || "You"}
                  </span>
                  <IconChevronDown size={12} style={{ color: "var(--text-muted)" }} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown style={{ borderRadius: 0, border: "1px solid var(--border)" }}>
                <Menu.Label style={{ fontFamily: "var(--font-space)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                  ACCOUNT
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUser style={{ width: rem(14) }} />}
                  component={Link}
                  href="/profile"
                >
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: rem(14) }} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <div className={classes.authBtns}>
              <Link href="/login" className={classes.loginBtn} id="navbar-login-btn">
                Log in
              </Link>
              <Link href="/signup" className={classes.signupBtn} id="navbar-signup-btn">
                Get started
              </Link>
            </div>
          )}

          {/* Mobile burger */}
          <button
            className={classes.burger}
            onClick={toggleDrawer}
            aria-label="Open menu"
            style={{ display: "none" }}
          >
            <span className={classes.burgerLine} style={{ transform: drawerOpened ? "translateY(6px) rotate(45deg)" : "" }} />
            <span className={classes.burgerLine} style={{ opacity: drawerOpened ? 0 : 1 }} />
            <span className={classes.burgerLine} style={{ transform: drawerOpened ? "translateY(-6px) rotate(-45deg)" : "" }} />
          </button>
        </div>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        hiddenFrom="md"
        zIndex={1000000}
        styles={{
          header: { background: "var(--bg)", borderBottom: "1px solid var(--border)" },
          body:   { background: "var(--bg)", padding: 0 },
          title:  { fontFamily: "var(--font-space)", fontWeight: 700, color: "var(--text)" },
        }}
        title={
          <Link href="/" className={classes.brand} onClick={closeDrawer}>
            <GridLogo />
            <span className={classes.brandName}>Grid</span>
          </Link>
        }
      >
        <ScrollArea h="calc(100vh - 80px)">
          <div className={classes.drawerLinks}>
            <Link href="/" className={classes.drawerLink} onClick={closeDrawer}>Home</Link>
            {user && NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={classes.drawerLink} onClick={closeDrawer}>
                {l.label}
              </Link>
            ))}
            {user && (
              <Link href="/users" className={classes.drawerLink} onClick={closeDrawer}>
                Find People
              </Link>
            )}
          </div>

          <div className={classes.drawerFooter}>
            <ActionIcon onClick={toggleTheme} className={classes.iconBtn} aria-label="Toggle theme" size="lg">
              <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
              <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
            </ActionIcon>

            {user ? (
              <button
                className={classes.drawerLogout}
                onClick={() => { handleLogout(); closeDrawer(); }}
              >
                Logout
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <Link href="/login" className={classes.loginBtn} onClick={closeDrawer}
                  style={{ flex: 1, justifyContent: "center" }}>
                  Log in
                </Link>
                <Link href="/signup" className={classes.signupBtn} onClick={closeDrawer}
                  style={{ flex: 1, justifyContent: "center" }}>
                  Get started
                </Link>
              </div>
            )}
          </div>
        </ScrollArea>
      </Drawer>
    </header>
  );
}
