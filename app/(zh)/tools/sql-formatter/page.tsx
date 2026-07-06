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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        title: "SQL Formatter",
        description: "Paste SQL queries to format and beautify them.",
        dialect: "SQL dialect",
        indentSize: "Indent size",
        uppercase: "Uppercase keywords",
        yes: "Yes",
        no: "No",
        input: "Input SQL",
        clear: "Clear",
        upload: "Upload",
        placeholder: "Paste SQL here...",
        output: "Formatted result",
        copy: "Copy",
        download: "Download",
        format: "Format SQL",
        success: "SQL formatted",
        failed: "SQL formatting failed",
        copied: "Copied to clipboard",
      }
    : {
        title: "SQL 格式化",
        description: "粘贴 SQL 语句进行格式化和美化",
        dialect: "SQL 方言",
        indentSize: "缩进大小",
        uppercase: "关键字大写",
        yes: "是",
        no: "否",
        input: "输入 SQL",
        clear: "清空",
        upload: "上传",
        placeholder: "在此粘贴 SQL 语句…",
        output: "格式化结果",
        copy: "复制",
        download: "下载",
        format: "格式化 SQL",
        success: "SQL 格式化成功",
        failed: "SQL 格式化失败",
        copied: "已复制到剪贴板",
      };
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
      toast.success(copy.success);
    } catch (error) {
      toast.error(copy.failed);
      console.error(error);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copy.copied);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* 格式化选项 */}
          <div className="flex flex-wrap gap-6 justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">{copy.dialect}</div>
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
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">{copy.indentSize}</div>
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

              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">{copy.uppercase}</div>
                <Tabs
                  value={uppercase ? "true" : "false"}
                  onValueChange={value => setUppercase(value === "true")}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="true">{copy.yes}</TabsTrigger>
                    <TabsTrigger value="false">{copy.no}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{copy.input}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSqlInput("");
                      setFormattedSql("");
                    }}
                  >
                    {copy.clear}
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".sql,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                      <Upload data-icon="inline-start" />
                      {copy.upload}
                    </Button>
                  </div>
                </div>
              </div>
              <Textarea
                placeholder={copy.placeholder}
                value={sqlInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSqlInput(e.target.value)
                }
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            {/* 输出区域 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{copy.output}</div>
                <div className="flex gap-2">
                  {formattedSql && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formattedSql)}
                      >
                        <Copy data-icon="inline-start" />
                        {copy.copy}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadSql}>
                        <Download data-icon="inline-start" />
                        {copy.download}
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
              {copy.format}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
