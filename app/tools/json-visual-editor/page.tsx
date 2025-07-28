"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Download, 
  Upload,
  RotateCcw,
  FileJson,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Folder,
  FolderOpen,
  Hash,
  Type,
  ToggleLeft,
  Eye,
  Import
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

export default function JsonVisualEditorPage() {
  const [jsonData, setJsonData] = useState<JsonObject>({
    "name": "示例对象",
    "age": 25,
    "isActive": true,
    "address": {
      "city": "北京",
      "zipCode": "100000"
    },
    "hobbies": ["阅读", "编程"],
    "metadata": null
  });
  
  const [rawJson, setRawJson] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["", "address"]));
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // 添加元素弹框相关状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"object" | "array">("object");
  const [addDialogPath, setAddDialogPath] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addValueType, setAddValueType] = useState<"string" | "number" | "boolean" | "null" | "object" | "array">("string");

  // 切换节点展开状态
  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  // 获取值的类型
  const getValueType = (value: JsonValue): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "string": return <Type className="h-3 w-3 text-green-600" />;
      case "number": return <Hash className="h-3 w-3 text-blue-600" />;
      case "boolean": return <ToggleLeft className="h-3 w-3 text-purple-600" />;
      case "null": return <X className="h-3 w-3 text-gray-500" />;
      case "object": return expandedNodes.has("") ? <FolderOpen className="h-3 w-3 text-orange-600" /> : <Folder className="h-3 w-3 text-orange-600" />;
      case "array": return <div className="h-3 w-3 border border-indigo-600 rounded-sm bg-indigo-100"></div>;
      default: return null;
    }
  };

  // 格式化显示值
  const formatValue = (value: JsonValue): string => {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === "object") return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  // 获取类型颜色
  const getTypeColor = (type: string): string => {
    switch (type) {
      case "string": return "text-green-600 dark:text-green-400";
      case "number": return "text-blue-600 dark:text-blue-400";
      case "boolean": return "text-purple-600 dark:text-purple-400";
      case "null": return "text-gray-500 dark:text-gray-400";
      case "object": return "text-orange-600 dark:text-orange-400";
      case "array": return "text-indigo-600 dark:text-indigo-400";
      default: return "text-gray-600 dark:text-gray-300";
    }
  };

  // 解析输入值
  const parseValue = (input: string, type: string): JsonValue => {
    switch (type) {
      case "string":
        return input;
      case "number":
        const num = parseFloat(input);
        return isNaN(num) ? 0 : num;
      case "boolean":
        return input.toLowerCase() === "true";
      case "null":
        return null;
      case "array":
        try {
          const parsed = JSON.parse(input);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      case "object":
        try {
          const parsed = JSON.parse(input);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
        } catch {
          return {};
        }
      default:
        return input;
    }
  };

  // 更新嵌套对象的值
  const updateNestedValue = useCallback((obj: JsonObject, path: string[], value: JsonValue): JsonObject => {
    if (path.length === 0) return obj;
    
    const newObj = { ...obj };
    let current: JsonObject = newObj;
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current[key] = { ...current[key] as JsonObject };
      current = current[key] as JsonObject;
    }
    
    const lastKey = path[path.length - 1];
    current[lastKey] = value;
    
    return newObj;
  }, []);

  // 删除嵌套对象的值
  const deleteNestedValue = useCallback((obj: JsonObject, path: string[]): JsonObject => {
    if (path.length === 0) return obj;
    
    const newObj = { ...obj };
    let current: JsonObject = newObj;
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) return obj;
      current[key] = { ...current[key] as JsonObject };
      current = current[key] as JsonObject;
    }
    
    const lastKey = path[path.length - 1];
    delete current[lastKey];
    
    return newObj;
  }, []);

  // 编辑值
  const handleEdit = (path: string, currentValue: JsonValue) => {
    setEditingKey(path);
    setEditingValue(typeof currentValue === "object" ? JSON.stringify(currentValue, null, 2) : String(currentValue));
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingKey) return;
    
    const path = editingKey.split(".");
    const currentValue = getNestedValue(jsonData, path);
    const type = getValueType(currentValue);
    
    try {
      const newValue = parseValue(editingValue, type);
      const updatedData = updateNestedValue(jsonData, path, newValue);
      setJsonData(updatedData);
      setEditingKey(null);
      setEditingValue("");
      toast.success("值已更新");
    } catch {
      toast.error("值格式错误");
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  // 删除字段
  const handleDelete = (path: string) => {
    const pathArray = path.split(".");
    const updatedData = deleteNestedValue(jsonData, pathArray);
    setJsonData(updatedData);
    toast.success("字段已删除");
  };

  // 为对象添加新字段
  const handleAddObjectField = (parentPath: string) => {
    setAddDialogType("object");
    setAddDialogPath(parentPath);
    setAddKey("");
    setAddValue("");
    setAddValueType("string");
    setAddDialogOpen(true);
  };

  // 为数组添加新元素
  const handleAddArrayItem = (parentPath: string) => {
    setAddDialogType("array");
    setAddDialogPath(parentPath);
    setAddValue("");
    setAddValueType("string");
    setAddDialogOpen(true);
  };

  // 确认添加元素
  const handleConfirmAdd = () => {
    if (addDialogType === "object" && !addKey.trim()) {
      toast.error("请输入字段名");
      return;
    }

    if (!addValue.trim() && addValueType !== "null") {
      toast.error("请输入值");
      return;
    }

    try {
      const newValue = parseValue(addValue, addValueType);
      const pathArray = addDialogPath ? addDialogPath.split(".") : [];
      
      if (addDialogType === "object") {
        // 添加到对象
        const newPath = [...pathArray, addKey];
        const updatedData = updateNestedValue(jsonData, newPath, newValue);
        setJsonData(updatedData);
        toast.success("字段已添加");
      } else {
        // 添加到数组
        const currentValue = getNestedValue(jsonData, pathArray);
        if (Array.isArray(currentValue)) {
          const newArray = [...currentValue, newValue];
          const updatedData = updateNestedValue(jsonData, pathArray, newArray);
          setJsonData(updatedData);
          toast.success("元素已添加");
        }
      }

      setAddDialogOpen(false);
       setAddKey("");
       setAddValue("");
       setAddValueType("string");
     } catch {
       toast.error("值格式错误");
     }
  };

  // 获取嵌套值
  const getNestedValue = (obj: JsonObject, path: string[]): JsonValue => {
    let current: JsonValue = obj;
    for (const key of path) {
      if (current && typeof current === "object" && !Array.isArray(current) && key in current) {
        current = (current as JsonObject)[key];
      } else {
        return null;
      }
    }
    return current;
  };

  // 渲染 JSON 树
  const renderJsonTree = (data: JsonValue, path: string = "", level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(path);
    const isHovered = hoveredPath === path;
    
    if (data === null) {
      return (
        <div 
          className={`flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
            isHovered ? "bg-muted/50" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <div className="flex items-center gap-1">
            {getTypeIcon("null")}
            <span className="text-gray-500 font-mono text-sm">null</span>
          </div>
          {path && isHovered && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(path, data)}
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(path)}
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
      const isEditing = editingKey === path;
      const type = getValueType(data);
      
      return (
        <div 
          className={`flex items-center gap-2 py-1 px-2 rounded-md transition-colors ${
            isHovered ? "bg-muted/50" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1">
                {getTypeIcon(type)}
                <Badge variant="outline" className="text-xs">
                  {type}
                </Badge>
              </div>
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="h-7 text-sm font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveEdit}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                {getTypeIcon(type)}
                <Badge variant="outline" className="text-xs">
                  {type}
                </Badge>
              </div>
              <span className={`font-mono text-sm ${getTypeColor(type)}`}>
                {formatValue(data)}
              </span>
              {path && isHovered && (
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(path, data)}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(path)}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div>
          <div 
            className={`flex items-center gap-2 py-1 px-2 rounded-md transition-colors cursor-pointer ${
              isHovered ? "bg-muted/50" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
            onClick={() => toggleExpanded(path)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            <div className="flex items-center gap-1">
              {getTypeIcon("array")}
              <Badge variant="outline" className="text-xs">
                array
              </Badge>
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
              [{data.length} 项]
            </span>
            {path && isHovered && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddArrayItem(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600 hover:text-green-700"
                  title="添加数组元素"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {isExpanded && (
            <div className="border-l-2 border-muted ml-4">
              {data.map((item, index) => (
                <div key={index}>
                  <div 
                    className="flex items-center gap-2 py-1 px-2 text-xs text-muted-foreground"
                    style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                  >
                    <span className="font-mono">[{index}]</span>
                  </div>
                  {renderJsonTree(item, path ? `${path}.${index}` : String(index), level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof data === "object" && data !== null) {
      const entries = Object.entries(data);
      
      return (
        <div>
          <div 
            className={`flex items-center gap-2 py-1 px-2 rounded-md transition-colors cursor-pointer ${
              isHovered ? "bg-muted/50" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
            onClick={() => toggleExpanded(path)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            <div className="flex items-center gap-1">
              {getTypeIcon("object")}
              <Badge variant="outline" className="text-xs">
                object
              </Badge>
            </div>
            <span className="text-orange-600 dark:text-orange-400 font-mono text-sm">
              {`{${entries.length} 个字段}`}
            </span>
            {(path === "" || (path && isHovered)) && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddObjectField(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600 hover:text-green-700"
                  title="添加对象字段"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(path);
                    }}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {isExpanded && (
            <div className="border-l-2 border-muted ml-4">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <div 
                    className="flex items-center gap-2 py-1 px-2 text-xs text-muted-foreground"
                    style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                  >
                    <span className="text-red-600 dark:text-red-400 font-mono font-medium">&quot;{key}&quot;:</span>
                  </div>
                  {renderJsonTree(value, path ? `${path}.${key}` : key, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // 复制 JSON
  const copyJson = () => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast.success("JSON 已复制到剪贴板");
  };

  // 下载 JSON
  const downloadJson = () => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON 文件已下载");
  };

  // 从原始 JSON 导入
  const importFromRaw = () => {
    try {
      const parsed = JSON.parse(rawJson);
      setJsonData(parsed);
      setRawJson("");
      // 自动展开根节点
      setExpandedNodes(new Set([""]));
      setImportDialogOpen(false);
      toast.success("JSON 数据已导入");
    } catch {
      toast.error("JSON 格式错误");
    }
  };

  // 重置数据
  const resetData = () => {
    setJsonData({});
    setExpandedNodes(new Set([""]));
    toast.success("数据已重置");
  };

  // 展开所有节点
  const expandAll = () => {
    const getAllPaths = (obj: JsonValue, currentPath = ""): string[] => {
      const paths: string[] = [currentPath];
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = currentPath ? `${currentPath}.${index}` : String(index);
          paths.push(...getAllPaths(item, newPath));
        });
      } else if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          paths.push(...getAllPaths(value, newPath));
        });
      }
      
      return paths;
    };
    
    const allPaths = getAllPaths(jsonData);
    setExpandedNodes(new Set(allPaths));
    toast.success("已展开所有节点");
  };

  // 折叠所有节点
  const collapseAll = () => {
    setExpandedNodes(new Set([""]));
    toast.success("已折叠所有节点");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1" />
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold mb-2">JSON 可视化编辑器</h1>
            <p className="text-muted-foreground">
              通过可视化界面编辑 JSON 数据，支持添加、删除、修改字段
            </p>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            {/* 导入功能弹框 */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Import className="h-4 w-4 mr-1" />
                  导入
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    导入 JSON 数据
                  </DialogTitle>
                  <DialogDescription>
                    通过文件上传或粘贴 JSON 数据来导入
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* 文件上传 */}
                  <div className="space-y-2">
                    <Label>从文件导入</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              const parsed = JSON.parse(content);
                              setJsonData(parsed);
                              // 自动展开根节点
                              setExpandedNodes(new Set([""]));
                              setImportDialogOpen(false);
                              toast.success("JSON 文件已加载");
                            } catch {
                              toast.error("JSON 文件格式错误");
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        选择 JSON 文件
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* 粘贴导入 */}
                  <div className="space-y-2">
                    <Label htmlFor="import-json">粘贴 JSON 数据</Label>
                    <Textarea
                      id="import-json"
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder="粘贴 JSON 数据..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={importFromRaw} 
                      className="w-full" 
                      disabled={!rawJson.trim()}
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      导入数据
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 预览功能弹框 */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  预览
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    JSON 数据预览
                  </DialogTitle>
                  <DialogDescription>
                    当前 JSON 数据的格式化预览和操作
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={copyJson} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      复制 JSON
                    </Button>
                    <Button onClick={downloadJson} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      下载文件
                    </Button>
                    <Button onClick={resetData} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重置数据
                    </Button>
                  </div>

                  {/* JSON 预览 */}
                  <div className="border rounded-lg bg-muted/20 max-h-[50vh] overflow-auto">
                    <pre className="text-xs p-4 font-mono whitespace-pre-wrap">
                      {JSON.stringify(jsonData, null, 2)}
                    </pre>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">JSON 可视化编辑器</h2>
                <p className="text-sm text-muted-foreground">
                  点击节点展开/折叠，悬停显示编辑按钮，支持键盘快捷键（Enter 保存，Esc 取消）
                </p>
              </div>
            </div>
            
            {/* 操作按钮组 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button onClick={copyJson} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  复制
                </Button>
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex gap-2">
                <Button onClick={expandAll} variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  展开全部
                </Button>
                <Button onClick={collapseAll} variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  折叠全部
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button onClick={resetData} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主编辑区域 */}
      <Card>
        <CardContent className="p-6">
          <div className="border rounded-lg bg-muted/20 min-h-[600px] max-h-[70vh] overflow-auto">
            <div className="p-4">
              {renderJsonTree(jsonData)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 添加元素弹框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {addDialogType === "object" ? "添加对象字段" : "添加数组元素"}
            </DialogTitle>
            <DialogDescription>
              {addDialogType === "object" 
                ? "为对象添加新的字段" 
                : "为数组添加新的元素"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {addDialogType === "object" && (
              <div>
                <Label htmlFor="add-key">字段名</Label>
                <Input
                  id="add-key"
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                  placeholder="输入字段名"
                  className="font-mono"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="add-type">数据类型</Label>
              <Select value={addValueType} onValueChange={(value: "string" | "number" | "boolean" | "null" | "object" | "array") => setAddValueType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">
                    <div className="flex items-center gap-2">
                      <Type className="h-3 w-3 text-green-600" />
                      字符串
                    </div>
                  </SelectItem>
                  <SelectItem value="number">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-blue-600" />
                      数字
                    </div>
                  </SelectItem>
                  <SelectItem value="boolean">
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-3 w-3 text-purple-600" />
                      布尔值
                    </div>
                  </SelectItem>
                  <SelectItem value="null">
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3 text-gray-500" />
                      空值
                    </div>
                  </SelectItem>
                  <SelectItem value="object">
                    <div className="flex items-center gap-2">
                      <Folder className="h-3 w-3 text-orange-600" />
                      对象
                    </div>
                  </SelectItem>
                  <SelectItem value="array">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 border border-indigo-600 rounded-sm bg-indigo-100"></div>
                      数组
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="add-value">值</Label>
              {addValueType === "boolean" ? (
                <Select value={addValue} onValueChange={setAddValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择布尔值" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : addValueType === "null" ? (
                <Input value="null" disabled className="font-mono" />
              ) : addValueType === "object" || addValueType === "array" ? (
                <Textarea
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  placeholder={addValueType === "object" ? '{"key": "value"}' : '["item1", "item2"]'}
                  rows={3}
                  className="font-mono"
                />
              ) : (
                <Input
                  id="add-value"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  placeholder={
                    addValueType === "string" ? "输入字符串" :
                    addValueType === "number" ? "输入数字" : "输入值"
                  }
                  type={addValueType === "number" ? "number" : "text"}
                  className="font-mono"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmAdd} className="flex-1">
                <Plus className="h-4 w-4 mr-1" />
                确认添加
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAddDialogOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}