"use client";

import React, { useState, useEffect } from "react";
import { useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import cx from "clsx";
import classes from "./FluidThemeToggle.module.css";

export function FluidThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={classes.placeholder} />;

  const isDark = computedColorScheme === "dark";

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
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
    <button
      className={cx(classes.fluidToggle, isDark && classes.isDark)}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className={classes.blob} />
      <div className={cx(classes.iconWrapper, !isDark && classes.iconActive)}>
        <IconSun className={classes.icon} stroke={1.5} />
      </div>
      <div className={cx(classes.iconWrapper, isDark && classes.iconActive)}>
        <IconMoon className={classes.icon} stroke={1.5} />
      </div>
    </button>
  );
}
