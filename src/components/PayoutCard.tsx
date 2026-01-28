import React from "react";
import { cn } from "@/lib/utils";

interface PayoutCardProps {
  totalRevenue: number;
  serviceFee: number;
  payout: number;
  serviceFeePercentage?: number;
  className?: string;
}

export const PayoutCard: React.FC<PayoutCardProps> = ({
  totalRevenue,
  serviceFee,
  payout,
  serviceFeePercentage = 12.29,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-[18px] p-6 border-2 border-[#459394]/25",
        "shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)]",
        "transition-all duration-200 ease-in-out",
        "hover:-translate-y-0.5 hover:border-[#459394]/45 hover:shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]",
        className
      )}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#0F172A" }}>
        Payout Statement
      </h3>
      
      <div className="space-y-3">
        {/* Total Revenue */}
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: "#0F172A" }}>Total Revenue</span>
          <span style={{ color: "#0F172A" }}>
            ${totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: "#E6F2F2" }} />

        {/* Service Fee */}
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: "#FD8865" }}>Service Fee</span>
          <span style={{ color: "#FD8865" }}>
            -${serviceFee.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t pt-2 mt-2" style={{ borderColor: "#E6F2F2" }} />

        {/* Your Payout */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold" style={{ color: "#387C7F" }}>
            Your Payout
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: "#387C7F" }}
          >
            ${payout.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

