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
        backgroundImage: `linear-gradient(110deg, rgba(9, 20, 36, 0.94) 0%, rgba(14, 30, 51, 0.86) 42%, rgba(20, 58, 110, 0.55) 100%), url(${image})`,
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
