"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Database, Download, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "sql-formatter";
import { useTranslations } from "next-intl";

// SQL 方言选项
const dialectOptions = [
  { value: "sql", label: "标准 SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "db2", label: "DB2" },
  { value: "mariadb", label: "MariaDB" },
  { value: "plsql", label: "Oracle" },
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
  const t = useTranslations("sqlFormatter");
  const [sqlInput, setSqlInput] = useState("");
  const [formattedSql, setFormattedSql] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [indentSize, setIndentSize] = useState(2);
  const [uppercase, setUppercase] = useState(true);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const readerRef = useRef<FileReader | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      const reader = readerRef.current;
      readerRef.current = null;
      if (reader) {
        reader.onload = null;
        reader.onerror = null;
        if (reader.readyState === FileReader.LOADING) reader.abort();
      }
    },
    []
  );

  const invalidateResult = () => {
    setFormattedSql("");
    setSqlError(null);
  };

  const cancelFileRead = () => {
    const reader = readerRef.current;
    readerRef.current = null;
    if (reader) {
      reader.onload = null;
      reader.onerror = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    }
    setIsReadingFile(false);
  };

  const updateInput = (value: string) => {
    cancelFileRead();
    invalidateResult();
    setSqlInput(value);
  };

  const formatSql = () => {
    invalidateResult();
    if (!sqlInput.trim()) {
      setSqlError(t("emptyInput"));
      inputRef.current?.focus();
      return;
    }
    try {
      setFormattedSql(
        format(sqlInput, {
          language: dialect,
          tabWidth: indentSize,
          keywordCase: uppercase ? "upper" : "lower",
        })
      );
      toast.success(t("success"));
    } catch {
      setSqlError(t("invalidInput"));
      toast.error(t("invalidInput"));
      inputRef.current?.focus();
    }
  };

  const copyToClipboard = async () => {
    if (!formattedSql) return;
    try {
      await navigator.clipboard.writeText(formattedSql);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const downloadSql = () => {
    if (!formattedSql) return;
    let url: string | undefined;
    try {
      url = URL.createObjectURL(
        new Blob([formattedSql], { type: "text/plain" })
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "formatted.sql";
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
      }
      toast.success(t("downloaded"));
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    cancelFileRead();
    invalidateResult();
    setIsReadingFile(true);

    const reader = new FileReader();
    readerRef.current = reader;
    const finish = () => {
      reader.onload = null;
      reader.onerror = null;
      readerRef.current = null;
      setIsReadingFile(false);
    };
    const fail = () => {
      if (readerRef.current !== reader) return;
      finish();
      setSqlError(t("uploadFailed"));
      toast.error(t("uploadFailed"));
    };
    reader.onload = () => {
      if (readerRef.current !== reader) return;
      if (typeof reader.result !== "string") {
        fail();
        return;
      }
      setSqlInput(reader.result);
      finish();
      toast.success(t("uploadSuccess"));
    };
    reader.onerror = fail;
    try {
      reader.readAsText(file);
    } catch {
      fail();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* 格式化选项 */}
          <div className="flex flex-wrap gap-6 justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">{t("dialect")}</div>
              <Tabs
                value={dialect}
                onValueChange={value => {
                  invalidateResult();
                  setDialect(value as SqlDialect);
                }}
                className="w-auto"
              >
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
                  {dialectOptions.slice(0, 5).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.value === "sql"
                        ? t("standardDialect")
                        : option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto mt-2">
                  {dialectOptions.slice(5).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.value === "sql"
                        ? t("standardDialect")
                        : option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">{t("indentSize")}</div>
                <Tabs
                  value={indentSize.toString()}
                  onValueChange={value => {
                    invalidateResult();
                    setIndentSize(Number(value));
                  }}
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
                <div className="text-sm font-medium">{t("uppercase")}</div>
                <Tabs
                  value={uppercase ? "true" : "false"}
                  onValueChange={value => {
                    invalidateResult();
                    setUppercase(value === "true");
                  }}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="true">{t("yes")}</TabsTrigger>
                    <TabsTrigger value="false">{t("no")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="sql-input">{t("input")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateInput("");
                      toast.success(t("cleared"));
                    }}
                  >
                    {t("clear")}
                  </Button>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="sql-file"
                      aria-label={t("uploadFile")}
                      accept=".sql,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload data-icon="inline-start" />
                      {t("upload")}
                    </Button>
                  </div>
                </div>
              </div>
              <Textarea
                ref={inputRef}
                id="sql-input"
                name="sql-input"
                placeholder={t("placeholder")}
                value={sqlInput}
                onChange={event => updateInput(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(sqlError)}
                aria-describedby={sqlError ? "sql-error" : undefined}
                className="min-h-[300px] font-mono text-sm"
              />
              {isReadingFile && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t("readingFile")}
                </p>
              )}
              {sqlError && (
                <p
                  id="sql-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {sqlError}
                </p>
              )}
            </div>

            {/* 输出区域 */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="sql-output">{t("output")}</Label>
                <div className="flex gap-2">
                  {formattedSql && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        <Copy data-icon="inline-start" />
                        {t("copy")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadSql}>
                        <Download data-icon="inline-start" />
                        {t("download")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Textarea
                id="sql-output"
                name="sql-output"
                placeholder={t("emptyResult")}
                value={formattedSql}
                readOnly
                className="min-h-[300px] font-mono text-sm bg-muted"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center">
            <Button
              onClick={formatSql}
              disabled={isReadingFile}
              className="min-w-[120px]"
            >
              {t("format")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
