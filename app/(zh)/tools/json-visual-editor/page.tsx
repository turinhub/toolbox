"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Import,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

export default function JsonVisualEditorPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        sampleName: "Sample object",
        sampleCity: "San Francisco",
        sampleHobbies: ["reading", "coding"],
        valueUpdated: "Value updated",
        invalidValue: "Invalid value",
        fieldDeleted: "Field deleted",
        enterKey: "Enter a field name",
        enterValue: "Enter a value",
        fieldAdded: "Field added",
        itemAdded: "Item added",
        copied: "JSON copied to clipboard",
        downloaded: "JSON file downloaded",
        imported: "JSON data imported",
        invalidJson: "Invalid JSON",
        reset: "Data reset",
        expanded: "All nodes expanded",
        collapsed: "All nodes collapsed",
        import: "Import",
        importTitle: "Import JSON data",
        importDescription: "Import JSON by uploading a file or pasting data.",
        importFromFile: "Import from file",
        fileLoaded: "JSON file loaded",
        invalidFile: "Invalid JSON file",
        chooseFile: "Choose JSON file",
        pasteJson: "Paste JSON data",
        pastePlaceholder: "Paste JSON data...",
        importData: "Import data",
        preview: "Preview",
        previewTitle: "JSON data preview",
        previewDescription:
          "Formatted preview and actions for the current JSON data.",
        copyJson: "Copy JSON",
        downloadFile: "Download file",
        resetData: "Reset data",
        editorTitle: "JSON Visual Editor",
        editorDescription:
          "Click nodes to expand or collapse. Hover to show edit actions. Keyboard shortcuts: Enter to save, Esc to cancel.",
        copy: "Copy",
        download: "Download",
        expandAll: "Expand all",
        collapseAll: "Collapse all",
        addObjectField: "Add object field",
        addArrayItem: "Add array item",
        addObjectDescription: "Add a new field to this object.",
        addArrayDescription: "Add a new item to this array.",
        fieldName: "Field name",
        fieldPlaceholder: "Enter field name",
        dataType: "Data type",
        value: "Value",
        selectBoolean: "Select a boolean value",
        string: "String",
        number: "Number",
        boolean: "Boolean",
        null: "Null",
        object: "Object",
        array: "Array",
        stringPlaceholder: "Enter string",
        numberPlaceholder: "Enter number",
        valuePlaceholder: "Enter value",
        confirmAdd: "Add",
        cancel: "Cancel",
        saveValue: "Save current value",
        cancelEdit: "Cancel editing",
        editValue: "Edit current value",
        deleteValue: "Delete current value",
        collapseArray: "Collapse array node",
        expandArray: "Expand array node",
        addArray: "Add array item",
        deleteArray: "Delete array node",
        collapseObject: "Collapse object node",
        expandObject: "Expand object node",
        addObject: "Add object field",
        deleteObject: "Delete object node",
      }
    : {
        sampleName: "示例对象",
        sampleCity: "北京",
        sampleHobbies: ["阅读", "编程"],
        valueUpdated: "值已更新",
        invalidValue: "值格式错误",
        fieldDeleted: "字段已删除",
        enterKey: "请输入字段名",
        enterValue: "请输入值",
        fieldAdded: "字段已添加",
        itemAdded: "元素已添加",
        copied: "JSON 已复制到剪贴板",
        downloaded: "JSON 文件已下载",
        imported: "JSON 数据已导入",
        invalidJson: "JSON 格式错误",
        reset: "数据已重置",
        expanded: "已展开所有节点",
        collapsed: "已折叠所有节点",
        import: "导入",
        importTitle: "导入 JSON 数据",
        importDescription: "通过文件上传或粘贴 JSON 数据来导入",
        importFromFile: "从文件导入",
        fileLoaded: "JSON 文件已加载",
        invalidFile: "JSON 文件格式错误",
        chooseFile: "选择 JSON 文件",
        pasteJson: "粘贴 JSON 数据",
        pastePlaceholder: "粘贴 JSON 数据…",
        importData: "导入数据",
        preview: "预览",
        previewTitle: "JSON 数据预览",
        previewDescription: "当前 JSON 数据的格式化预览和操作",
        copyJson: "复制 JSON",
        downloadFile: "下载文件",
        resetData: "重置数据",
        editorTitle: "JSON 可视化编辑器",
        editorDescription:
          "点击节点展开/折叠，悬停显示编辑按钮，支持键盘快捷键（Enter 保存，Esc 取消）",
        copy: "复制",
        download: "下载",
        expandAll: "展开全部",
        collapseAll: "折叠全部",
        addObjectField: "添加对象字段",
        addArrayItem: "添加数组元素",
        addObjectDescription: "为对象添加新的字段",
        addArrayDescription: "为数组添加新的元素",
        fieldName: "字段名",
        fieldPlaceholder: "输入字段名",
        dataType: "数据类型",
        value: "值",
        selectBoolean: "选择布尔值",
        string: "字符串",
        number: "数字",
        boolean: "布尔值",
        null: "空值",
        object: "对象",
        array: "数组",
        stringPlaceholder: "输入字符串",
        numberPlaceholder: "输入数字",
        valuePlaceholder: "输入值",
        confirmAdd: "确认添加",
        cancel: "取消",
        saveValue: "保存当前值",
        cancelEdit: "取消编辑",
        editValue: "编辑当前值",
        deleteValue: "删除当前值",
        collapseArray: "收起数组节点",
        expandArray: "展开数组节点",
        addArray: "添加数组元素",
        deleteArray: "删除数组节点",
        collapseObject: "收起对象节点",
        expandObject: "展开对象节点",
        addObject: "添加对象字段",
        deleteObject: "删除对象节点",
      };
  const [jsonData, setJsonData] = useState<JsonObject>(() => ({
    name: copy.sampleName,
    age: 25,
    isActive: true,
    address: {
      city: copy.sampleCity,
      zipCode: isEnglish ? "94103" : "100000",
    },
    hobbies: copy.sampleHobbies,
    metadata: null,
  }));

  const [rawJson, setRawJson] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["", "address"])
  );
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // 添加元素弹框相关状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"object" | "array">(
    "object"
  );
  const [addDialogPath, setAddDialogPath] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addValueType, setAddValueType] = useState<
    "string" | "number" | "boolean" | "null" | "object" | "array"
  >("string");

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
      case "string":
        return <Type className="h-3 w-3 text-green-600" />;
      case "number":
        return <Hash className="h-3 w-3 text-blue-600" />;
      case "boolean":
        return <ToggleLeft className="h-3 w-3 text-purple-600" />;
      case "null":
        return <X className="h-3 w-3 text-gray-500" />;
      case "object":
        return expandedNodes.has("") ? (
          <FolderOpen className="h-3 w-3 text-orange-600" />
        ) : (
          <Folder className="h-3 w-3 text-orange-600" />
        );
      case "array":
        return (
          <div className="h-3 w-3 border border-indigo-600 rounded-sm bg-indigo-100"></div>
        );
      default:
        return null;
    }
  };

  // 格式化显示值
  const formatValue = (value: JsonValue): string => {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === "object")
      return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  // 获取类型颜色
  const getTypeColor = (type: string): string => {
    switch (type) {
      case "string":
        return "text-green-600 dark:text-green-400";
      case "number":
        return "text-blue-600 dark:text-blue-400";
      case "boolean":
        return "text-purple-600 dark:text-purple-400";
      case "null":
        return "text-gray-500 dark:text-gray-400";
      case "object":
        return "text-orange-600 dark:text-orange-400";
      case "array":
        return "text-indigo-600 dark:text-indigo-400";
      default:
        return "text-gray-600 dark:text-gray-300";
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
          return typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
            ? parsed
            : {};
        } catch {
          return {};
        }
      default:
        return input;
    }
  };

  // 更新嵌套对象的值
  const updateNestedValue = useCallback(
    (obj: JsonObject, path: string[], value: JsonValue): JsonObject => {
      if (path.length === 0) return obj;

      const newObj = { ...obj };
      let current: JsonObject = newObj;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current[key] = { ...(current[key] as JsonObject) };
        current = current[key] as JsonObject;
      }

      const lastKey = path[path.length - 1];
      current[lastKey] = value;

      return newObj;
    },
    []
  );

  // 删除嵌套对象的值
  const deleteNestedValue = useCallback(
    (obj: JsonObject, path: string[]): JsonObject => {
      if (path.length === 0) return obj;

      const newObj = { ...obj };
      let current: JsonObject = newObj;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current)) return obj;
        current[key] = { ...(current[key] as JsonObject) };
        current = current[key] as JsonObject;
      }

      const lastKey = path[path.length - 1];
      delete current[lastKey];

      return newObj;
    },
    []
  );

  // 编辑值
  const handleEdit = (path: string, currentValue: JsonValue) => {
    setEditingKey(path);
    setEditingValue(
      typeof currentValue === "object"
        ? JSON.stringify(currentValue, null, 2)
        : String(currentValue)
    );
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
      toast.success(copy.valueUpdated);
    } catch {
      toast.error(copy.invalidValue);
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
    toast.success(copy.fieldDeleted);
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
      toast.error(copy.enterKey);
      return;
    }

    if (!addValue.trim() && addValueType !== "null") {
      toast.error(copy.enterValue);
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
        toast.success(copy.fieldAdded);
      } else {
        // 添加到数组
        const currentValue = getNestedValue(jsonData, pathArray);
        if (Array.isArray(currentValue)) {
          const newArray = [...currentValue, newValue];
          const updatedData = updateNestedValue(jsonData, pathArray, newArray);
          setJsonData(updatedData);
          toast.success(copy.itemAdded);
        }
      }

      setAddDialogOpen(false);
      setAddKey("");
      setAddValue("");
      setAddValueType("string");
    } catch {
      toast.error(copy.invalidValue);
    }
  };

  // 获取嵌套值
  const getNestedValue = (obj: JsonObject, path: string[]): JsonValue => {
    let current: JsonValue = obj;
    for (const key of path) {
      if (
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        key in current
      ) {
        current = (current as JsonObject)[key];
      } else {
        return null;
      }
    }
    return current;
  };

  // 渲染 JSON 树
  const renderJsonTree = (
    data: JsonValue,
    path: string = "",
    level: number = 0
  ): React.ReactNode => {
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

    if (
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
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
                name="json-edit-value"
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                className="h-7 text-sm font-mono"
                autoComplete="off"
                spellCheck={false}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveEdit}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                aria-label={copy.saveValue}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                aria-label={copy.cancelEdit}
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
                    aria-label={copy.editValue}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(path)}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                    aria-label={copy.deleteValue}
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
            className={`flex items-center gap-2 rounded-md transition-colors ${
              isHovered ? "bg-muted/50" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => toggleExpanded(path)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? copy.collapseArray : copy.expandArray}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <div className="flex items-center gap-1">
                {getTypeIcon("array")}
                <Badge variant="outline" className="text-xs">
                  array
                </Badge>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                [{data.length} 项]
              </span>
            </button>
            {path && isHovered && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddArrayItem(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600 hover:text-green-700"
                  aria-label={copy.addArray}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                  aria-label={copy.deleteArray}
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
                  {renderJsonTree(
                    item,
                    path ? `${path}.${index}` : String(index),
                    level + 1
                  )}
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
            className={`flex items-center gap-2 rounded-md transition-colors ${
              isHovered ? "bg-muted/50" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => toggleExpanded(path)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? copy.collapseObject : copy.expandObject}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <div className="flex items-center gap-1">
                {getTypeIcon("object")}
                <Badge variant="outline" className="text-xs">
                  object
                </Badge>
              </div>
              <span className="text-orange-600 dark:text-orange-400 font-mono text-sm">
                {`{${entries.length} 个字段}`}
              </span>
            </button>
            {(path === "" || (path && isHovered)) && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleAddObjectField(path);
                  }}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-green-600 hover:text-green-700"
                  aria-label={copy.addObject}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(path);
                    }}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100 text-red-500 hover:text-red-700"
                    aria-label={copy.deleteObject}
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
                    <span className="text-red-600 dark:text-red-400 font-mono font-medium">
                      &quot;{key}&quot;:
                    </span>
                  </div>
                  {renderJsonTree(
                    value,
                    path ? `${path}.${key}` : key,
                    level + 1
                  )}
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
    toast.success(copy.copied);
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
    toast.success(copy.downloaded);
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
      toast.success(copy.imported);
    } catch {
      toast.error(copy.invalidJson);
    }
  };

  // 重置数据
  const resetData = () => {
    setJsonData({});
    setExpandedNodes(new Set([""]));
    toast.success(copy.reset);
  };

  // 展开所有节点
  const expandAll = () => {
    const getAllPaths = (obj: JsonValue, currentPath = ""): string[] => {
      const paths: string[] = [currentPath];

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const newPath = currentPath
            ? `${currentPath}.${index}`
            : String(index);
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
    toast.success(copy.expanded);
  };

  // 折叠所有节点
  const collapseAll = () => {
    setExpandedNodes(new Set([""]));
    toast.success(copy.collapsed);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end gap-2">
        {/* 导入功能弹框 */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Import data-icon="inline-start" />
              {copy.import}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                {copy.importTitle}
              </DialogTitle>
              <DialogDescription>{copy.importDescription}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6">
              {/* 文件上传 */}
              <div className="flex flex-col gap-2">
                <Label>{copy.importFromFile}</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = event => {
                        try {
                          const content = event.target?.result as string;
                          const parsed = JSON.parse(content);
                          setJsonData(parsed);
                          // 自动展开根节点
                          setExpandedNodes(new Set([""]));
                          setImportDialogOpen(false);
                          toast.success(copy.fileLoaded);
                        } catch {
                          toast.error(copy.invalidFile);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload data-icon="inline-start" />
                    {copy.chooseFile}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 粘贴导入 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-json">{copy.pasteJson}</Label>
                <Textarea
                  id="import-json"
                  value={rawJson}
                  onChange={e => setRawJson(e.target.value)}
                  placeholder={copy.pastePlaceholder}
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={importFromRaw}
                  className="w-full"
                  disabled={!rawJson.trim()}
                >
                  <FileJson data-icon="inline-start" />
                  {copy.importData}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 预览功能弹框 */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye data-icon="inline-start" />
              {copy.preview}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {copy.previewTitle}
              </DialogTitle>
              <DialogDescription>{copy.previewDescription}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyJson} variant="outline" size="sm">
                  <Copy data-icon="inline-start" />
                  {copy.copyJson}
                </Button>
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download data-icon="inline-start" />
                  {copy.downloadFile}
                </Button>
                <Button onClick={resetData} variant="outline" size="sm">
                  <RotateCcw data-icon="inline-start" />
                  {copy.resetData}
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

      {/* 工具栏 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">{copy.editorTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {copy.editorDescription}
                </p>
              </div>
            </div>

            {/* 操作按钮组 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button onClick={copyJson} variant="outline" size="sm">
                  <Copy data-icon="inline-start" />
                  {copy.copy}
                </Button>
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download data-icon="inline-start" />
                  {copy.download}
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex gap-2">
                <Button onClick={expandAll} variant="outline" size="sm">
                  <ChevronDown data-icon="inline-start" />
                  {copy.expandAll}
                </Button>
                <Button onClick={collapseAll} variant="outline" size="sm">
                  <ChevronRight data-icon="inline-start" />
                  {copy.collapseAll}
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <Button onClick={resetData} variant="outline" size="sm">
                <RotateCcw data-icon="inline-start" />
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
            <div className="p-4">{renderJsonTree(jsonData)}</div>
          </div>
        </CardContent>
      </Card>

      {/* 添加元素弹框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {addDialogType === "object"
                ? copy.addObjectField
                : copy.addArrayItem}
            </DialogTitle>
            <DialogDescription>
              {addDialogType === "object"
                ? copy.addObjectDescription
                : copy.addArrayDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {addDialogType === "object" && (
              <div>
                <Label htmlFor="add-key">{copy.fieldName}</Label>
                <Input
                  id="add-key"
                  value={addKey}
                  onChange={e => setAddKey(e.target.value)}
                  placeholder={copy.fieldPlaceholder}
                  className="font-mono"
                />
              </div>
            )}

            <div>
              <Label htmlFor="add-type">{copy.dataType}</Label>
              <Select
                value={addValueType}
                onValueChange={(
                  value:
                    | "string"
                    | "number"
                    | "boolean"
                    | "null"
                    | "object"
                    | "array"
                ) => setAddValueType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="string">
                      <div className="flex items-center gap-2">
                        <Type className="h-3 w-3 text-green-600" />
                        {copy.string}
                      </div>
                    </SelectItem>
                    <SelectItem value="number">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-blue-600" />
                        {copy.number}
                      </div>
                    </SelectItem>
                    <SelectItem value="boolean">
                      <div className="flex items-center gap-2">
                        <ToggleLeft className="h-3 w-3 text-purple-600" />
                        {copy.boolean}
                      </div>
                    </SelectItem>
                    <SelectItem value="null">
                      <div className="flex items-center gap-2">
                        <X className="h-3 w-3 text-gray-500" />
                        {copy.null}
                      </div>
                    </SelectItem>
                    <SelectItem value="object">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3 w-3 text-orange-600" />
                        {copy.object}
                      </div>
                    </SelectItem>
                    <SelectItem value="array">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 border border-indigo-600 rounded-sm bg-indigo-100"></div>
                        {copy.array}
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="add-value">{copy.value}</Label>
              {addValueType === "boolean" ? (
                <Select value={addValue} onValueChange={setAddValue}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.selectBoolean} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : addValueType === "null" ? (
                <Input value="null" disabled className="font-mono" />
              ) : addValueType === "object" || addValueType === "array" ? (
                <Textarea
                  value={addValue}
                  onChange={e => setAddValue(e.target.value)}
                  placeholder={
                    addValueType === "object"
                      ? '{"key": "value"}'
                      : '["item1", "item2"]'
                  }
                  rows={3}
                  className="font-mono"
                />
              ) : (
                <Input
                  id="add-value"
                  value={addValue}
                  onChange={e => setAddValue(e.target.value)}
                  placeholder={
                    addValueType === "string"
                      ? copy.stringPlaceholder
                      : addValueType === "number"
                        ? copy.numberPlaceholder
                        : copy.valuePlaceholder
                  }
                  type={addValueType === "number" ? "number" : "text"}
                  className="font-mono"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmAdd} className="flex-1">
                <Plus data-icon="inline-start" />
                {copy.confirmAdd}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="flex-1"
              >
                {copy.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
