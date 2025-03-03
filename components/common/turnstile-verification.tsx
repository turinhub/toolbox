"use client";

import { toast } from "sonner";
import { Turnstile } from "next-turnstile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TurnstileVerificationProps {
  /**
   * 对话框是否打开
   */
  open: boolean;
  /**
   * 对话框标题
   */
  title?: string;
  /**
   * 对话框打开状态变化时的回调
   */
  onOpenChange: (open: boolean) => void;
  /**
   * 验证成功时的回调，返回验证令牌
   */
  onVerify: (token: string) => void;
  /**
   * 验证成功后是否自动关闭对话框
   */
  autoClose?: boolean;
  /**
   * 验证成功后自动执行的回调函数
   */
  onSuccess?: () => void;
  /**
   * 验证失败时的错误消息
   */
  errorMessage?: string;
  /**
   * 验证过期时的错误消息
   */
  expireMessage?: string;
}

/**
 * Turnstile 人机验证对话框组件
 * 
 * 用于在需要时显示 Cloudflare Turnstile 验证
 */
export function TurnstileVerification({
  open,
  title = "人机验证",
  onOpenChange,
  onVerify,
  autoClose = true,
  onSuccess,
  errorMessage = "人机验证失败，请重试",
  expireMessage = "人机验证已过期，请重新验证"
}: TurnstileVerificationProps) {
  
  const handleVerify = (token: string) => {
    onVerify(token);
    
    if (autoClose) {
      onOpenChange(false);
      
      // 如果提供了成功回调，延迟执行以确保对话框已关闭
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY || ""}
            onVerify={handleVerify}
            onError={() => {
              toast.error(errorMessage);
            }}
            onExpire={() => {
              toast.error(expireMessage);
            }}
            refreshExpired="auto"
            retry="auto"
            theme="auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 