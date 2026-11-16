/** Anime-style AI portrait avatars (generated busts). */

export const AVATAR_COUNT = 12;

const AVATAR_SRC = Array.from({ length: AVATAR_COUNT }, (_, i) => `/avatars/${i}.jpg`);

export function AvatarPortrait({
  id = 0,
  size = 40,
  className = "",
}: {
  id?: number;
  size?: number;
  className?: string;
}) {
  const idx = ((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  const src = AVATAR_SRC[idx] ?? AVATAR_SRC[0]!;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
      loading="lazy"
    />
  );
}
