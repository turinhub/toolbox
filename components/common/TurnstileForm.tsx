"use client";

import { useState } from "react";
import { TurnstileWidget } from "./TurnstileWidget";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface TurnstileFormProps {
  onVerificationSuccess?: () => void;
}

export function TurnstileForm({ onVerificationSuccess }: TurnstileFormProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("请先完成人机验证");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/verify-human", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("验证成功，您可以继续访问网站");
        // 调用成功回调
        if (onVerificationSuccess) {
          onVerificationSuccess();
        }
      } else {
        toast.error(data.message || "验证失败");
      }
    } catch (error) {
      toast.error("验证过程中发生错误");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          为了保护网站免受自动化攻击，请完成下方的人机验证
        </p>
        <TurnstileWidget onVerify={setToken} />
      </div>

      <Button type="submit" disabled={!token || isSubmitting}>
        {isSubmitting ? "验证中..." : "验证我是人类"}
      </Button>
    </form>
  );
} 