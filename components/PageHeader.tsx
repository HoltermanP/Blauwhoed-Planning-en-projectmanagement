import { Skyline } from "./art";

/**
 * Hero-header. Met `image` (pad onder /public) wordt het beeld als vage,
 * donker-overlayde achtergrond getoond; zonder image valt hij terug op het
 * navy-verloop met skyline-illustratie.
 */
export default function PageHeader({
  title,
  intro,
  image,
  imagePosition = "center",
  children,
}: {
  title: string;
  intro?: string;
  image?: string;
  imagePosition?: string;
  children?: React.ReactNode;
}) {
  const style = image
    ? {
        backgroundImage:
          `linear-gradient(to top, rgba(9, 20, 36, 0.60) 0%, rgba(9, 20, 36, 0) 45%), ` +
          `linear-gradient(105deg, rgba(9, 20, 36, 0.92) 0%, rgba(12, 26, 46, 0.72) 38%, rgba(16, 42, 80, 0.32) 70%, rgba(20, 58, 110, 0.10) 100%), ` +
          `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: imagePosition,
      }
    : undefined;
  return (
    <header className="hero" style={style}>
      <div className="hero-content">
        <h1>{title}</h1>
        {intro && <p className="hero-intro">{intro}</p>}
        {children}
      </div>
      {!image && <Skyline className="hero-art" />}
    </header>
  );
}
