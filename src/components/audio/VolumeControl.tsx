"use client";

import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";

interface VolumeControlProps {
  VolumeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  volume: number;
  handleVolumeChange: (value: number[]) => void;
}
const VolumeControl = ({
  VolumeIcon,
  volume,
  handleVolumeChange,
}: VolumeControlProps) => {
  return (
    <div>
      <div className="lg:hidden">
        <Popover modal>
          <PopoverTrigger className="cursor-pointer p-1 md:p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <VolumeIcon className="w-5 h-5 " />
          </PopoverTrigger>
          <PopoverContent className="">
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[volume]}
              onValueChange={handleVolumeChange}
              className=" w-full h-1  cursor-pointer"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="hidden lg:flex items-center lg:space-x-2 lg:w-28">
        <VolumeIcon className="w-5 h-5 " />
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[volume]}
          onValueChange={handleVolumeChange}
          className="hidden lg:flex w-full h-1  cursor-pointer"
        />
      </div>
    </div>
  );
};

export default VolumeControl;
