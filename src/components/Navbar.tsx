"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useMantineColorScheme,
  useComputedColorScheme,
  Container,
  ActionIcon
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "next-auth/react";
import {
  IconSun,
  IconMoon,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

import cx from "clsx";
import classes from "./Navbar.module.css";

/* ── Grid geometric logo mark ── */
function GridLogo({ color = "var(--accent)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={32} height={32} aria-hidden="true" style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8))" }}>
      {/* Anvil-inspired geometric mark */}
      <rect x="4" y="10" width="24" height="14" fill={color} />
      <rect x="10" y="4" width="12" height="8" fill={color} opacity={0.7} />
      <rect x="0" y="22" width="32" height="4" fill={color} opacity={0.4} />
      {/* Spark dot */}
      <circle cx="26" cy="6" r="3" fill={color === "#000" ? "#fff" : "#fff"} />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/pow",         label: "PoW Graph" },
  { href: "/projects",    label: "Projects" },
  { href: "/discussions", label: "Discuss" },
  { href: "/events",      label: "Events" },
  { href: "/quizzes",     label: "Quizzes" },
  { href: "/chat",        label: "Chat" },
  { href: "/community",   label: "Community" },
  { href: "/roast",       label: "Roast" },
];

export function Navbar({ hideOnTop }: { hideOnTop?: boolean }) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { user } = useAuth();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!hideOnTop) return;
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll);
    onScroll(); // initial check
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnTop]);

  // Prevent scroll when overlay is open
  useEffect(() => {
    if (drawerOpened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [drawerOpened]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    closeDrawer();
  };

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = computedColorScheme === "dark";
    const isAppearanceTransition =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isAppearanceTransition) {
      setColorScheme(isDark ? "light" : "dark");
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setColorScheme(isDark ? "light" : "dark");
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <>
      <header 
        className={classes.header}
        style={{
          ...(hideOnTop && !scrolled 
            ? { opacity: 0, pointerEvents: "none", transform: "translateY(-10px)", transition: "opacity 0.4s, transform 0.4s" }
            : { opacity: 1, pointerEvents: "auto", transform: "translateY(0)", transition: "opacity 0.4s, transform 0.4s" }
          )
        }}
      >
        <Container size="xl" className={classes.inner}>
          {/* Brand */}
          <Link href="/" className={cx(classes.brand, drawerOpened && classes.brandOpen)} id="nav-brand" onClick={closeDrawer}>
            <GridLogo color={drawerOpened ? "#000" : "var(--accent)"} />
            <span className={classes.brandName}>Grid</span>
                  </Link>

          {/* Right side actions */}
          <div className={classes.actions}>
            {/* Theme toggle */}
            <ActionIcon
              onClick={toggleTheme}
              className={classes.iconBtn}
              aria-label="Toggle theme"
            >
              <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
              <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
            </ActionIcon>

            {/* Mobile burger */}
            <button
              className={classes.burger}
              onClick={toggleDrawer}
              aria-label="Toggle menu"
            >
              {drawerOpened ? <IconX size={28} stroke={2} /> : <IconMenu2 size={28} stroke={2} />}
            </button>
          </div>
        </Container>
      </header>

      {/* Full Screen Overlay Menu */}
      <div className={cx(classes.fullMenu, drawerOpened && classes.fullMenuOpen)}>
        <div className={classes.menuGraphic}>G</div>
        
        <div className={classes.menuContent}>
          <div className={classes.fullNavLinks}>
            <Link href="/" className={classes.fullNavLink} onClick={closeDrawer}>
              <span className={classes.navNumber}>0</span>Home
            </Link>
            {NAV_LINKS.map((l, i) => (
              <Link key={l.href} href={l.href} className={classes.fullNavLink} onClick={closeDrawer}>
                <span className={classes.navNumber}>{i + 1}</span>{l.label}
              </Link>
            ))}
          </div>

        <div className={classes.fullMenuFooter}>
          {user ? (
            <>
              <Link href="/profile" className={classes.overlayActionBtn} onClick={closeDrawer}>Profile</Link>
              <button className={classes.overlayActionBtn} onClick={handleLogout} style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className={classes.overlayActionBtn} onClick={closeDrawer}>Log in</Link>
              <Link href="/signup" className={classes.overlayActionBtn} onClick={closeDrawer} style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>Get Started</Link>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
