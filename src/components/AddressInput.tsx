import React from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter wallet address (0x...)",
  className
}) => {
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-black/20 border-gray-700 font-mono"
      />
    </div>
  );
};

export const Address: React.FC<{ address: string; size?: "xs" | "sm" | "md" | "lg" }> = ({ 
  address, 
  size = "md" 
}) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <span className={`font-mono ${sizeClasses[size]} text-gray-400`}>
      {formatAddress(address)}
    </span>
  );
};
