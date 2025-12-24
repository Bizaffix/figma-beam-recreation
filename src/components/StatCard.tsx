import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardVariant = "revenue" | "students" | "bookings" | "default";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  variant?: StatCardVariant;
  tooltip?: string;
  onClick?: () => void;
  className?: string;
}

const variantConfig = {
  revenue: {
    dotColor: "#FAB130",
    iconColor: "#459394",
  },
  students: {
    dotColor: "#387C7F",
    iconColor: "#459394",
  },
  bookings: {
    dotColor: "#EF684B",
    iconColor: "#459394",
  },
  default: {
    dotColor: undefined,
    iconColor: "#459394",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  variant = "default",
  tooltip,
  onClick,
  className,
}) => {
  const config = variantConfig[variant];
  const hasDot = config.dotColor !== undefined;

  // Format value - if it's a number with currency, make currency sign smaller
  const formatValue = (val: string | number): React.ReactNode => {
    if (typeof val === "number") {
      return val.toLocaleString();
    }
    
    // Check if value starts with $ and format currency
    if (typeof val === "string" && val.startsWith("$")) {
      const numPart = val.slice(1);
      return (
        <>
          <span className="text-[0.75em]">$</span>
          {numPart}
        </>
      );
    }
    
    return val;
  };

  return (
    <div
      className={cn(
        "bg-white rounded-[18px] p-6",
        "shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)]",
        "transition-all duration-200 ease-in-out",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      title={tooltip}
    >
      {/* Card Header with Icon and Dot */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg border border-[#459394]/20"
            style={{ color: config.iconColor }}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
          {hasDot && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.dotColor }}
            />
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <p
          className="text-[36px] font-bold leading-none"
          style={{ color: "#0F172A" }}
        >
          {formatValue(value)}
        </p>
      </div>

      {/* Label Text */}
      <p
        className="text-sm tracking-wide"
        style={{ color: "#459394", letterSpacing: "0.025em" }}
      >
        {label}
      </p>
    </div>
  );
};

