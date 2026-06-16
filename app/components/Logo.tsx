import Image from "next/image";

type LogoProps = {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  className?: string;
};

export default function Logo({
  size = 36,
  showText = true,
  textClassName = "text-white text-lg",
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <Image
        src="/logo.png"
        alt="SavdoMarket"
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white/25 shadow-md"
        priority
      />
      {showText && (
        <span className={`font-extrabold tracking-tight ${textClassName}`}>
          SavdoMarket
        </span>
      )}
    </div>
  );
}
