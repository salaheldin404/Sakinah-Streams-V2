import { memo } from "react";
import { Button } from "@/components/ui/button";
import { LuPause, LuPlay } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  handleTogglePlay: () => void;
}
const PlayButton = memo(
  ({ isPlaying, isLoading, handleTogglePlay }: PlayButtonProps) => {
    return (
      <Button
        onClick={handleTogglePlay}
        className="cursor-pointer w-8 h-8 md:w-10 md:h-10 rounded-full gradient-purple text-white shadow-md hover:bg-primary/90 transition-transform transform hover:scale-105"
      >
        {isPlaying && <LuPause className="w-6 h-6" />}
        {!isPlaying && !isLoading && <LuPlay className="w-6 h-6" />}
        {!isPlaying && isLoading && (
          <ImSpinner2 className="w-6 h-6 animate-spin" />
        )}
      </Button>
    );
  }
);

PlayButton.displayName = "PlayButton";

export default PlayButton;
