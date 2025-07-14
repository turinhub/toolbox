"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Database, Calculator } from "lucide-react";
import { toast } from "sonner";

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
function calculateFieldSize(database: DatabaseType, dataType: string, avgLength: number = 0, precision: number = 0): number {
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
function formatStorageSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 解析数据类型参数
function parseDataType(dataType: string): { type: string; precision: number; scale: number } {
  const match = dataType.match(/^(\w+)(?:\((\d+)(?:,(\d+))?\))?$/);
  if (!match) return { type: dataType, precision: 0, scale: 0 };
  
  return {
    type: match[1],
    precision: parseInt(match[2] || "0"),
    scale: parseInt(match[3] || "0"),
  };
}

export default function DatabaseStorageCalculator() {
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
  
  const removeField = useCallback((id: string) => {
    setFields(fields.filter(f => f.id !== id));
  }, [fields]);
  
  const updateField = useCallback((id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [fields]);
  
  const calculateStorage = useCallback(() => {
    if (fields.length === 0) {
      toast.error("请至少添加一个字段");
      return;
    }
    
    if (rowCount <= 0) {
      toast.error("行数必须大于0");
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
        const storageSize = calculateFieldSize(db, parsed.type, avgLength, parsed.precision);
        
        fieldResults.push({
          fieldName: field.name,
          dataType: field.dataType,
          storageSize,
          displaySize: formatStorageSize(storageSize),
        });
        
        totalBytesPerRow += storageSize;
      }
      
      const totalSize = totalBytesPerRow * rowCount;
      
      calculationResults.push({
        database: db,
        fields: fieldResults,
        totalSize,
        displaySize: formatStorageSize(totalSize),
      });
    }
    
    setResults(calculationResults);
    toast.success("计算完成！");
  }, [fields, rowCount]);
  
  const getDatabaseLabel = (db: DatabaseType): string => {
    switch (db) {
      case "mysql": return "MySQL";
      case "clickhouse": return "ClickHouse";
      case "postgresql": return "PostgreSQL";
      default: return db;
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8" />
          数据库存储估算计算器
        </h1>
        <p className="text-muted-foreground">
          估算数据字段在 MySQL、ClickHouse 和 PostgreSQL 数据库中的存储体积
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入配置 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="database">数据库类型</Label>
                <Select value={database} onValueChange={(value: DatabaseType) => setDatabase(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="clickhouse">ClickHouse</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="rowCount">行数</Label>
                <Input
                  id="rowCount"
                  type="number"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                字段配置
                <Button onClick={addField} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  添加字段
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="字段名"
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="数据类型 (如: VARCHAR(255))"
                      value={field.dataType}
                      onChange={(e) => updateField(field.id, { dataType: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="平均长度 (可变长度类型)"
                      type="number"
                      value={field.avgLength || ""}
                      onChange={(e) => updateField(field.id, { avgLength: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Button onClick={calculateStorage} className="w-full" size="lg">
            <Calculator className="w-4 h-4 mr-2" />
            计算存储大小
          </Button>
        </div>
        
        {/* 结果显示 */}
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.database}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {getDatabaseLabel(result.database)} 存储估算
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-lg font-semibold text-primary">
                    总存储大小: {result.displaySize}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">字段详情:</h4>
                    <div className="space-y-1">
                      {result.fields.map((field, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{field.fieldName} ({field.dataType})</span>
                          <span>{field.displaySize}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    每行大小: {formatStorageSize(result.totalSize / rowCount)} × {rowCount.toLocaleString()} 行
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {results.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  请配置字段并点击计算按钮查看结果
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">使用说明</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 对于可变长度类型（如 VARCHAR、TEXT），请提供平均长度以获得准确估算</li>
          <li>• 数据类型格式示例：VARCHAR(255)、DECIMAL(10,2)、INT 等</li>
          <li>• 此计算器不考虑索引、压缩和存储引擎优化等因素</li>
          <li>• ClickHouse 的列式存储和压缩可能显著减少实际存储需求</li>
        </ul>
      </div>
    </div>
  );
} 