"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Database, Download, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "sql-formatter";

// SQL 方言选项
const dialectOptions = [
  { value: "sql", label: "标准 SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "db2", label: "DB2" },
  { value: "mariadb", label: "MariaDB" },
  { value: "oracle", label: "Oracle" },
  { value: "sqlite", label: "SQLite" },
  { value: "redshift", label: "Redshift" },
  { value: "spark", label: "Spark SQL" },
  { value: "tsql", label: "T-SQL" },
];

type SqlDialect =
  | "sql"
  | "mysql"
  | "postgresql"
  | "db2"
  | "mariadb"
  | "sqlite"
  | "redshift"
  | "spark"
  | "tsql"
  | "bigquery"
  | "plsql";

export default function SqlFormatterPage() {
  // SQL 状态
  const [sqlInput, setSqlInput] = useState("");
  const [formattedSql, setFormattedSql] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [indentSize, setIndentSize] = useState(2);
  const [uppercase, setUppercase] = useState(true);

  // 格式化 SQL
  const formatSql = () => {
    try {
      if (!sqlInput.trim()) {
        setFormattedSql("");
        return;
      }

      const formatted = format(sqlInput, {
        language: dialect,
        tabWidth: indentSize,
        keywordCase: uppercase ? "upper" : "lower",
      });

      setFormattedSql(formatted);
      toast.success("SQL 格式化成功");
    } catch (error) {
      toast.error("SQL 格式化失败");
      console.error(error);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 下载 SQL 文件
  const downloadSql = () => {
    if (!formattedSql) return;

    const blob = new Blob([formattedSql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 上传 SQL 文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setSqlInput(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">SQL 格式化工具</h1>
        <p className="text-muted-foreground">
          格式化和美化 SQL 语句，支持多种 SQL 方言
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL 格式化
          </CardTitle>
          <CardDescription>粘贴 SQL 语句进行格式化和美化</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 格式化选项 */}
          <div className="flex flex-wrap gap-6 justify-between">
            <div className="space-y-2">
              <div className="text-sm font-medium">SQL 方言</div>
              <Tabs
                value={dialect}
                onValueChange={value => setDialect(value as SqlDialect)}
                className="w-auto"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
                  {dialectOptions.slice(0, 5).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto mt-2">
                  {dialectOptions.slice(5).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">缩进大小</div>
                <Tabs
                  value={indentSize.toString()}
                  onValueChange={value => setIndentSize(parseInt(value))}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="2">2</TabsTrigger>
                    <TabsTrigger value="4">4</TabsTrigger>
                    <TabsTrigger value="8">8</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">关键字大写</div>
                <Tabs
                  value={uppercase ? "true" : "false"}
                  onValueChange={value => setUppercase(value === "true")}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="true">是</TabsTrigger>
                    <TabsTrigger value="false">否</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">输入 SQL</div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSqlInput("");
                      setFormattedSql("");
                    }}
                  >
                    清空
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".sql,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      上传
                    </Button>
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="在此粘贴 SQL 语句..."
                value={sqlInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSqlInput(e.target.value)
                }
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            {/* 输出区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">格式化结果</div>
                <div className="flex space-x-2">
                  {formattedSql && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formattedSql)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadSql}>
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Textarea
                value={formattedSql}
                readOnly
                className="min-h-[300px] font-mono text-sm bg-muted"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center">
            <Button onClick={formatSql} className="min-w-[120px]">
              格式化 SQL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
