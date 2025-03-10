'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { FormValues } from "./ApiRequestForm";

interface SavedConfigsProps {
  configs: { name: string; config: FormValues }[];
  onLoadConfig: (config: FormValues) => void;
  onDeleteConfig: (index: number) => void;
}

export default function SavedConfigs({ configs, onLoadConfig, onDeleteConfig }: SavedConfigsProps) {
  // 获取请求方法的标签颜色
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "PATCH":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>已保存的测试用例</CardTitle>
        <CardDescription>加载、查看或管理您保存的 API 测试用例</CardDescription>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            暂无保存的测试用例
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((item, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-muted/30">
                  <div className="font-medium flex items-center">
                    <span className={`text-xs px-2 py-1 rounded mr-2 ${getMethodColor(item.config.method)}`}>
                      {item.config.method}
                    </span>
                    {item.name}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onLoadConfig(item.config)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      加载
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDeleteConfig(index)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
                <div className="p-3 text-sm space-y-2 bg-muted/10">
                  <div>
                    <span className="font-medium">URL:</span> 
                    <span className="ml-1 break-all">{item.config.url}</span>
                  </div>
                  {item.config.headers && item.config.headers.length > 0 && item.config.headers[0].key && (
                    <div>
                      <span className="font-medium">Headers:</span> 
                      <span className="ml-1">
                        {item.config.headers
                          .filter(h => h.key.trim())
                          .map(h => `${h.key}: ${h.value}`)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {item.config.body && (
                    <div>
                      <span className="font-medium">Body:</span> 
                      <span className="ml-1 break-all line-clamp-1">{item.config.body}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 