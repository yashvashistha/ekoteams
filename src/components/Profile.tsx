import React from "react";

interface ProfileProps {
  name?: string;
}

export default function Profile({ name }: ProfileProps) {
  return (
    <span className="w-9 h-9 rounded-full bg-[#F8EACD] text-[#B99F6D] flex items-center justify-center font-semibold text-sm">
      {name?.split(" ")[0][0]}
      {name?.split(" ")[1]?.[0]}
    </span>
  );
}
