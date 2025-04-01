"use client";

import * as diff from "diff";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function TextComparePage() {
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [diffResult, setDiffResult] = useState<diff.Change[]>([]);
  const [diffType, setDiffType] = useState<"chars" | "words" | "lines">("lines");
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  // Generate diff when inputs change
  useEffect(() => {
    if (originalText || modifiedText) {
      generateDiff();
    }
  }, [originalText, modifiedText, diffType, ignoreWhitespace]);

  // Generate diff based on selected algorithm
  const generateDiff = () => {
    let result: diff.Change[] = [];
    
    // Prepare text based on whitespace option
    let original = originalText;
    let modified = modifiedText;
    
    if (ignoreWhitespace) {
      if (diffType === "lines") {
        original = originalText.split('\n').map(line => line.trim()).join('\n');
        modified = modifiedText.split('\n').map(line => line.trim()).join('\n');
      } else {
        original = originalText.replace(/\s+/g, ' ').trim();
        modified = modifiedText.replace(/\s+/g, ' ').trim();
      }
    }
    
    switch (diffType) {
      case "chars":
        result = diff.diffChars(original, modified);
        break;
      case "words":
        result = diff.diffWords(original, modified);
        break;
      case "lines":
        result = diff.diffLines(original, modified);
        break;
      default:
        result = diff.diffLines(original, modified);
    }
    
    setDiffResult(result);
  };

  // Handle text clearing
  const clearTexts = () => {
    setOriginalText("");
    setModifiedText("");
    setDiffResult([]);
    toast.success("已清空所有文本");
  };

  // Handle text swapping
  const swapTexts = () => {
    setOriginalText(modifiedText);
    setModifiedText(originalText);
    toast.success("已交换文本位置");
  };

  // Format diff output with line numbers
  const renderDiffOutput = () => {
    if (diffResult.length === 0) {
      return <p className="text-muted-foreground text-center">请输入文本进行对比</p>;
    }

    if (diffType === "lines") {
      let originalLineNum = 1;
      let modifiedLineNum = 1;
      
      return diffResult.map((part, index) => {
        const lines = part.value.split('\n');
        // Remove empty line at the end if present
        if (lines[lines.length - 1] === '') {
          lines.pop();
        }
        
        return lines.map((line, lineIndex) => {
          let lineNum = '';
          
          if (showLineNumbers) {
            if (part.added) {
              lineNum = `${modifiedLineNum++}`;
            } else if (part.removed) {
              lineNum = `${originalLineNum++}`;
            } else {
              lineNum = `${originalLineNum++} | ${modifiedLineNum++}`;
            }
          }
          
          const lineContent = (
            <div 
              key={`${index}-${lineIndex}`} 
              className={`flex ${
                part.added 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                  : part.removed 
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                    : ""
              }`}
            >
              {showLineNumbers && (
                <span className="text-muted-foreground w-16 select-none text-right pr-4 border-r mr-2">
                  {lineNum}
                </span>
              )}
              <span>
                {part.added ? "+ " : part.removed ? "- " : "  "}
                {line}
              </span>
            </div>
          );
          
          return lineContent;
        });
      });
    } else {
      // Character or word diff, render inline
      return (
        <div className="inline">
          {diffResult.map((part, index) => {
            const color = part.added 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
              : part.removed 
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                : "";
            return (
              <span key={index} className={color}>
                {part.value}
              </span>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">文本对比</h1>
        <p className="text-muted-foreground">查看两段文本之间的差异，以 git diff 风格展示</p>
      </div>
      
      <Card className="p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={diffType} onValueChange={(value) => setDiffType(value as "chars" | "words" | "lines")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="对比模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chars">按字符对比</SelectItem>
                  <SelectItem value="words">按单词对比</SelectItem>
                  <SelectItem value="lines">按行对比</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="lineNumbers" 
                  checked={showLineNumbers} 
                  onCheckedChange={setShowLineNumbers} 
                  disabled={diffType !== "lines"}
                />
                <Label htmlFor="lineNumbers">显示行号</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="ignoreWhitespace" 
                  checked={ignoreWhitespace} 
                  onCheckedChange={setIgnoreWhitespace}
                />
                <Label htmlFor="ignoreWhitespace">忽略空格</Label>
              </div>
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={swapTexts}>交换文本</Button>
              <Button variant="outline" onClick={clearTexts}>清空</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalText">原始文本</Label>
              <Textarea 
                id="originalText"
                placeholder="输入原始文本..."
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modifiedText">修改后文本</Label>
              <Textarea 
                id="modifiedText"
                placeholder="输入修改后文本..."
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>对比结果</Label>
            <div className="border rounded-md p-4 min-h-[200px] bg-muted/20 font-mono text-sm overflow-auto whitespace-pre">
              {renderDiffOutput()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 