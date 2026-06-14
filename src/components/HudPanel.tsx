import { ReactNode } from "react";

type HudPanelVariant = "default" | "accent" | "gold";

type HudPanelProps = {
  title?: string;
  variant?: HudPanelVariant;
  clipped?: boolean;
  className?: string;
  children: ReactNode;
};

export default function HudPanel({
  title,
  variant = "default",
  clipped = false,
  className,
  children,
}: HudPanelProps) {
  const classes = ["hud-panel"];
  if (variant === "accent") classes.push("hud-panel--accent");
  if (variant === "gold") classes.push("hud-panel--gold");
  if (clipped) classes.push("hud-panel--clipped");
  if (className) classes.push(className);

  return (
    <section className={classes.join(" ")}>
      {title && (
        <header className="hud-panel__title">
          <span
            className={
              variant === "gold"
                ? "hud-panel__tick hud-panel__tick--gold"
                : "hud-panel__tick"
            }
          />
          {title}
        </header>
      )}
      {children}
    </section>
  );
}