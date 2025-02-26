"use client";

import { useState, useEffect } from "react";
import { TurnstileForm } from "./TurnstileForm";

interface TurnstileProtectionProps {
  children: React.ReactNode;
}

export function TurnstileProtection({ children }: TurnstileProtectionProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  
  useEffect(() => {
    // 检查是否已经通过验证（从 cookie 或 localStorage 中）
    const checkVerification = async () => {
      try {
        // 尝试从 cookie 中读取验证状态
        const humanVerified = document.cookie
          .split('; ')
          .find(row => row.startsWith('human_verified='))
          ?.split('=')[1];
          
        if (humanVerified === 'true') {
          setIsVerified(true);
          return;
        }
        
        // 如果 cookie 中没有，则默认为未验证
        setIsVerified(false);
      } catch (error) {
        console.error("验证状态检查失败:", error);
        setIsVerified(false);
      }
    };
    
    checkVerification();
  }, []);
  
  // 处理验证成功
  const handleVerificationSuccess = () => {
    setIsVerified(true);
  };
  
  // 加载中状态
  if (isVerified === null) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // 未验证状态，显示验证表单
  if (!isVerified) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">需要人机验证</h2>
        <p className="text-muted-foreground mb-4">
          为了保护网站免受自动化攻击，请先完成人机验证后继续访问。
        </p>
        <TurnstileForm onVerificationSuccess={handleVerificationSuccess} />
      </div>
    );
  }
  
  // 已验证状态，显示子组件
  return <>{children}</>;
} 