"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

type DatabaseType = "mysql" | "clickhouse" | "postgresql";

interface Field {
  id: string;
  name: string;
  dataType: string;
  avgLength?: number;
}

interface StorageResult {
  fieldName: string;
  dataType: string;
  storageSize: number;
  displaySize: string;
}

interface DatabaseResult {
  database: DatabaseType;
  fields: StorageResult[];
  totalSize: number;
  displaySize: string;
}

// 计算存储大小的函数
function calculateFieldSize(
  database: DatabaseType,
  dataType: string,
  avgLength: number = 0,
  precision: number = 0
): number {
  const dt = dataType.toLowerCase();

  switch (database) {
    case "mysql":
      // 整数类型
      if (dt === "tinyint") return 1;
      if (dt === "smallint") return 2;
      if (dt === "mediumint") return 3;
      if (dt === "int") return 4;
      if (dt === "bigint") return 8;

      // 浮点类型
      if (dt === "float") return 4;
      if (dt === "double") return 8;

      // 小数类型
      if (dt === "decimal") return 4 * Math.ceil(precision / 9);

      // 字符串类型
      if (dt === "char") return precision;
      if (dt === "varchar") return avgLength + (precision < 256 ? 1 : 2);
      if (dt === "text") return avgLength + 2;

      // 日期时间类型
      if (dt === "date") return 3;
      if (dt === "datetime") return 8;
      if (dt === "timestamp") return 4;

      break;

    case "clickhouse":
      // 整数类型
      if (dt === "int8") return 1;
      if (dt === "int16") return 2;
      if (dt === "int32") return 4;
      if (dt === "int64") return 8;

      // 浮点类型
      if (dt === "float32") return 4;
      if (dt === "float64") return 8;

      // 小数类型
      if (dt === "decimal") {
        if (precision <= 9) return 4;
        if (precision <= 18) return 8;
        if (precision <= 38) return 16;
        if (precision <= 76) return 32;
        return 32;
      }

      // 字符串类型
      if (dt === "fixedstring") return precision;
      if (dt === "string") return avgLength + 2;

      // 日期时间类型
      if (dt === "date") return 3;
      if (dt === "datetime") return 8;

      break;

    case "postgresql":
      // 整数类型
      if (dt === "smallint") return 2;
      if (dt === "integer") return 4;
      if (dt === "bigint") return 8;

      // 浮点类型
      if (dt === "real") return 4;
      if (dt === "double precision") return 8;

      // 小数类型
      if (dt === "numeric") return 12 + 2 * Math.ceil(precision / 4);

      // 字符串类型
      if (dt === "char") return precision;
      if (dt === "character varying") return avgLength + 4;
      if (dt === "text") return avgLength + 4;

      // 日期时间类型
      if (dt === "date") return 4;
      if (dt === "timestamp without time zone") return 8;
      if (dt === "timestamp with time zone") return 8;

      break;
  }

  return 0;
}

// 格式化存储大小显示
function formatStorageSize(
  bytes: number,
  numberFormatter: Intl.NumberFormat
): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${numberFormatter.format(bytes / Math.pow(k, i))} ${sizes[i]}`;
}

// 解析数据类型参数
function parseDataType(dataType: string): {
  type: string;
  precision: number;
  scale: number;
} {
  const match = dataType.match(/^(\w+)(?:\((\d+)(?:,(\d+))?\))?$/);
  if (!match) return { type: dataType, precision: 0, scale: 0 };

  return {
    type: match[1],
    precision: parseInt(match[2] || "0"),
    scale: parseInt(match[3] || "0"),
  };
}

export default function DatabaseStorageCalculator() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });
  const copy = isEnglish
    ? {
        addFieldRequired: "Add at least one field.",
        rowCountPositive: "Row count must be greater than 0.",
        done: "Calculation complete",
        basicConfig: "Basic config",
        databaseType: "Database type",
        rowCount: "Row count",
        fieldConfig: "Field config",
        addField: "Add field",
        fieldName: "Field name",
        dataType: "Data type, for example VARCHAR(255)",
        avgLength: "Average length for variable-length types",
        deleteField: "Delete field",
        calculate: "Calculate storage size",
        estimate: "storage estimate",
        totalSize: "Total storage size:",
        fieldDetails: "Field details:",
        rowSize: "Row size:",
        rows: "rows",
        empty: "Configure fields and click calculate to view results.",
        helpTitle: "How to use",
        help: [
          "For variable-length types such as VARCHAR and TEXT, provide an average length for a more accurate estimate.",
          "Data type examples: VARCHAR(255), DECIMAL(10,2), INT.",
          "This calculator does not include indexes, compression, storage engine overhead, or optimization effects.",
          "ClickHouse columnar storage and compression may significantly reduce actual storage requirements.",
        ],
      }
    : {
        addFieldRequired: "请至少添加一个字段",
        rowCountPositive: "行数必须大于0",
        done: "计算完成！",
        basicConfig: "基本配置",
        databaseType: "数据库类型",
        rowCount: "行数",
        fieldConfig: "字段配置",
        addField: "添加字段",
        fieldName: "字段名",
        dataType: "数据类型 (如: VARCHAR(255))",
        avgLength: "平均长度 (可变长度类型)",
        deleteField: "删除字段",
        calculate: "计算存储大小",
        estimate: "存储估算",
        totalSize: "总存储大小:",
        fieldDetails: "字段详情:",
        rowSize: "每行大小:",
        rows: "行",
        empty: "请配置字段并点击计算按钮查看结果",
        helpTitle: "使用说明",
        help: [
          "对于可变长度类型（如 VARCHAR、TEXT），请提供平均长度以获得准确估算",
          "数据类型格式示例：VARCHAR(255)、DECIMAL(10,2)、INT 等",
          "此计算器不考虑索引、压缩和存储引擎优化等因素",
          "ClickHouse 的列式存储和压缩可能显著减少实际存储需求",
        ],
      };
  const [database, setDatabase] = useState<DatabaseType>("mysql");
  const [fields, setFields] = useState<Field[]>([
    { id: "1", name: "id", dataType: "INT" },
  ]);
  const [rowCount, setRowCount] = useState<number>(10000);
  const [results, setResults] = useState<DatabaseResult[]>([]);

  const addField = useCallback(() => {
    const newField: Field = {
      id: Date.now().toString(),
      name: "",
      dataType: "",
    };
    setFields([...fields, newField]);
  }, [fields]);

  const removeField = useCallback(
    (id: string) => {
      setFields(fields.filter(f => f.id !== id));
    },
    [fields]
  );

  const updateField = useCallback(
    (id: string, updates: Partial<Field>) => {
      setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
    },
    [fields]
  );

  const calculateStorage = useCallback(() => {
    if (fields.length === 0) {
      toast.error(copy.addFieldRequired);
      return;
    }

    if (rowCount <= 0) {
      toast.error(copy.rowCountPositive);
      return;
    }

    const databases: DatabaseType[] = ["mysql", "clickhouse", "postgresql"];
    const calculationResults: DatabaseResult[] = [];

    for (const db of databases) {
      const fieldResults: StorageResult[] = [];
      let totalBytesPerRow = 0;

      for (const field of fields) {
        if (!field.name || !field.dataType) continue;

        const parsed = parseDataType(field.dataType);
        const avgLength = field.avgLength || 0;
        const storageSize = calculateFieldSize(
          db,
          parsed.type,
          avgLength,
          parsed.precision
        );

        fieldResults.push({
          fieldName: field.name,
          dataType: field.dataType,
          storageSize,
          displaySize: formatStorageSize(storageSize, numberFormatter),
        });

        totalBytesPerRow += storageSize;
      }

      const totalSize = totalBytesPerRow * rowCount;

      calculationResults.push({
        database: db,
        fields: fieldResults,
        totalSize,
        displaySize: formatStorageSize(totalSize, numberFormatter),
      });
    }

    setResults(calculationResults);
    toast.success(copy.done);
  }, [
    copy.addFieldRequired,
    copy.done,
    copy.rowCountPositive,
    fields,
    numberFormatter,
    rowCount,
  ]);

  const getDatabaseLabel = (db: DatabaseType): string => {
    switch (db) {
      case "mysql":
        return "MySQL";
      case "clickhouse":
        return "ClickHouse";
      case "postgresql":
        return "PostgreSQL";
      default:
        return db;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入配置 */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{copy.basicConfig}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="database">{copy.databaseType}</Label>
                <Select
                  value={database}
                  onValueChange={(value: DatabaseType) => setDatabase(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="clickhouse">ClickHouse</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rowCount">{copy.rowCount}</Label>
                <Input
                  id="rowCount"
                  type="number"
                  value={rowCount}
                  onChange={e => setRowCount(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {copy.fieldConfig}
                <Button onClick={addField} size="sm">
                  <Plus data-icon="inline-start" />
                  {copy.addField}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {fields.map(field => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Input
                      placeholder={copy.fieldName}
                      value={field.name}
                      onChange={e =>
                        updateField(field.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={copy.dataType}
                      value={field.dataType}
                      onChange={e =>
                        updateField(field.id, { dataType: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={copy.avgLength}
                      type="number"
                      value={field.avgLength || ""}
                      onChange={e =>
                        updateField(field.id, {
                          avgLength: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    aria-label={copy.deleteField}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={calculateStorage} className="w-full" size="lg">
            <Calculator data-icon="inline-start" />
            {copy.calculate}
          </Button>
        </div>

        {/* 结果显示 */}
        <div className="flex flex-col gap-4">
          {results.map(result => (
            <Card key={result.database}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {getDatabaseLabel(result.database)} {copy.estimate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="text-lg font-semibold text-primary">
                    {copy.totalSize} {result.displaySize}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium">{copy.fieldDetails}</h4>
                    <div className="flex flex-col gap-1">
                      {result.fields.map((field, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {field.fieldName} ({field.dataType})
                          </span>
                          <span>{field.displaySize}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {copy.rowSize}{" "}
                    {formatStorageSize(result.totalSize / rowCount, numberFormatter)}{" "}
                    × {numberFormatter.format(rowCount)} {copy.rows}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {copy.empty}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">{copy.helpTitle}</h3>
        <ul className="flex flex-col text-sm text-muted-foreground gap-1">
          {copy.help.map(item => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
