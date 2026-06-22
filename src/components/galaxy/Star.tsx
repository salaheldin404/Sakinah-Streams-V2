import { GalaxySurah, Point } from "@/types/galaxy";
import { motion } from "framer-motion";
import { CSSProperties, memo, useMemo, useState } from "react";

interface StarProps {
  surah: GalaxySurah;
  position: Point;
  isFilteredView: boolean;
  onClick: () => void;
  isMobile: boolean;
  isArabic: boolean;
}
// const STAR_CLIP_PATH =
//   "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)";

const STAR_CLIP_PATH =
  "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";

const STAR_ENTER_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;
const LABEL_TRANSITION = { duration: 0.18 } as const;

const STAR_WHILE_TAP = { scale: 0.92 } as const;
const INNER_WHILE_TAP = { scale: 0.9 } as const;

// const STAR_INITIAL = { opacity: 0, scale: 0.6 } as const;
const STAR_ANIMATE = { opacity: 1, scale: 1 } as const;
const STAR_EXIT = { opacity: 0, scale: 0 } as const;

const GLOW_VARIANTS = {
  idle: { opacity: 0.55 },
  hovered: { opacity: 0.9 },
} as const;

const BUTTON_VARIANTS = {
  idle:    { scale: 1,   zIndex: 10 },
  hovered: { scale: 1.5, zIndex: 20 },
} as const;

const LABEL_VARIANTS = {
  idle: { opacity: 0, y: 4 },
  hovered: { opacity: 1, y: 0 },
} as const;

const Star = memo(
  ({
    surah,
    position,
    isFilteredView,
    onClick,
    isMobile,
    isArabic,
  }: StarProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const size = isMobile ? 10 : 15;

    const positionStyle = useMemo<CSSProperties>(
      () => ({ left: `${position.x}%`, top: `${position.y}%` }),
      [position.x, position.y],
    );

    const glowBackground = useMemo(
      () =>
        `radial-gradient(circle, ${surah.color}66 0%, ${surah.color}11 60%, transparent 80%)`,
      [surah.color],
    );

    const glowStyle = useMemo<CSSProperties>(
      () => ({
        width: size * 2.6,
        height: size * 2.6,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) translateZ(0)",
        borderRadius: "9999px",
        background: glowBackground,
        willChange: "opacity",
      }),
      [size, glowBackground],
    );

    const starStyle = useMemo<CSSProperties>(
      () =>
        ({
          width: size,
          height: size,
          background: surah.color,
          clipPath: STAR_CLIP_PATH,
          filter: isMobile
            ? "none"
            : `drop-shadow(0 0 ${size * 0.4}px ${surah.color})`,
          willChange: "transform",
          // CSS custom property drives @keyframes duration — set once, zero rerenders
          "--pulse-duration": isMobile
            ? "0s"
            : `${2 + (surah.number % 3) * 0.5}s`,
        }) as CSSProperties,
      [size, surah.color, isMobile, surah.number],
    );

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        color: surah.color,
        fontSize: 9,
        textShadow: isMobile ? "none" : "0 0 6px #000",
        backgroundColor: isMobile ? "rgba(3,3,9,0.6)" : "transparent",
        padding: isMobile ? "2px 4px" : "0",
        borderRadius: "4px",
      }),
      [surah.color, isMobile],
    );

    return (
      <motion.button
        className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus:outline-none contain-layout"
        style={positionStyle}
        onClick={onClick}
        aria-label={`${surah.englishNameTranslation} (${surah.name})`}
        initial='idle'
        animate={STAR_ANIMATE}
        exit={STAR_EXIT}
        transition={STAR_ENTER_TRANSITION}
        variants={BUTTON_VARIANTS}
        whileHover={isMobile ? undefined : "hovered"}
        whileTap={STAR_WHILE_TAP}
        onHoverStart={isMobile ? undefined : () => setIsHovered(true)}
        onHoverEnd={isMobile ? undefined : () => setIsHovered(false)}
      >
        {/* Glow — opacity driven by inherited "hovered" variant, no setState */}
        <motion.div
          className="pointer-events-none absolute"
          style={glowStyle}
          variants={GLOW_VARIANTS}
          initial="idle"
          animate="idle"
        />

        <motion.div
          className={`relative cursor-pointer rounded-full ${!isMobile ? " star-pulse" : ""}`}
          style={starStyle}
          whileTap={INNER_WHILE_TAP}
        />

        {/* Label — visible when filtered, or when parent is hovered */}
        <motion.span
          className="absolute top-full mt-1 select-none whitespace-nowrap text-center leading-none pointer-events-none"
          style={labelStyle}
          variants={LABEL_VARIANTS}
          initial="idle"
          animate={isFilteredView || isHovered ? "hovered" : "idle"}
          transition={LABEL_TRANSITION}
        >
          {isArabic ? surah.shortName : surah.englishName}
        </motion.span>
      </motion.button>
    );
  },
  (prev, next) =>
    prev.surah === next.surah &&
    prev.position === next.position &&
    prev.isFilteredView === next.isFilteredView &&
    prev.onClick === next.onClick &&
    prev.isMobile === next.isMobile &&
    prev.isArabic === next.isArabic,
);

Star.displayName = "Star";

export default Star;
