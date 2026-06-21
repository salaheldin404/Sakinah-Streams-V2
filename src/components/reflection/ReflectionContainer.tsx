"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmotionInput from "./EmotionInput";
import LoadingBreathing from "./LoadingBreathing";
import ReflectionResults from "./ReflectionResults";
import ReflectionHistory from "./ReflectionHistory";
import { ReflectionResponse, EmotionTag } from "@/types/reflection";
import { toast } from "sonner";
import { useCreateReflectionMutation } from "@/lib/store/features/reflectionApi";

export default function ReflectionContainer() {
  const [step, setStep] = useState<"input" | "loading" | "results">("input");
  const [reflectionData, setReflectionData] =
    useState<ReflectionResponse | null>(null);
  const [createReflection] = useCreateReflectionMutation();

  
  const handleSubmit = async (data: {
    userInput?: string;
    emotionTag?: EmotionTag;
  }) => {
    setStep("loading");
    try {
      const result = await createReflection(data).unwrap();

      setReflectionData(result);
      setStep("results");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
      setStep("input");
    }
  };

  const handleSelectFromHistory = (data: ReflectionResponse) => {
    setReflectionData(data);
    setStep("results");
  };

  const handleReset = () => {
    setStep("input");
    setReflectionData(null);
  };

  return (
    <div className="">
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <EmotionInput onSubmit={handleSubmit} isLoading={false} />
            <ReflectionHistory
              onSelect={handleSelectFromHistory}
            />
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingBreathing />
          </motion.div>
        )}

        {step === "results" && reflectionData && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ReflectionResults data={reflectionData} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
