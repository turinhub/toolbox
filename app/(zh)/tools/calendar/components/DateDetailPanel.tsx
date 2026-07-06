"use client";

import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarDays } from "lucide-react";
import type { CalendarDay } from "../lib/lunar-utils";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

interface DateDetailPanelProps {
  selectedDate: Date;
  days: CalendarDay[];
}

function findDay(days: CalendarDay[], date: Date): CalendarDay | undefined {
  const key = format(date, "yyyy-MM-dd");
  return days.find(d => format(d.date, "yyyy-MM-dd") === key);
}

export default function DateDetailPanel({
  selectedDate,
  days,
}: DateDetailPanelProps) {
  const isEnglish = useLocale() === englishLocale;
  const dateLocale = isEnglish ? enUS : zhCN;
  const copy = isEnglish
    ? {
        empty: "Select a date to view details.",
        dateFormat: "MMMM d, yyyy EEEE",
        lunarDate: "Lunar date",
        ganzhi: "Gan-Zhi and zodiac",
        year: "year",
        leap: "Leap ",
        lunarInfo: "Lunar info",
        zodiac: "zodiac year",
        constellation: "Constellation",
        constellationSuffix: "",
        nayin: "Na Yin",
        solarTerm: "Solar term:",
        festivals: "Festivals",
        suitable: "Good for",
        avoid: "Avoid",
        none: "None",
        clashTitle: "Clashes and Pengzu taboos",
        clash: "Clash {chong}, Sha {sha}",
        pengzu: "Pengzu taboo:",
        auspicious: "Auspicious deities:",
        inauspicious: "Inauspicious influences:",
      }
    : {
        empty: "请选择一个日期查看详情",
        dateFormat: "yyyy年M月d日 EEEE",
        lunarDate: "农历日期",
        ganzhi: "干支与生肖",
        year: "年",
        leap: "闰",
        lunarInfo: "农历信息",
        zodiac: "年",
        constellation: "星座",
        constellationSuffix: "座",
        nayin: "纳音",
        solarTerm: "节气：",
        festivals: "节日",
        suitable: "宜",
        avoid: "忌",
        none: "无",
        clashTitle: "冲煞与彭祖百忌",
        clash: "冲{chong} 煞{sha}",
        pengzu: "彭祖百忌：",
        auspicious: "吉神宜趋：",
        inauspicious: "凶煞宜忌：",
      };
  const day = findDay(days, selectedDate);

  if (!day) {
    return (
      <Card className="w-full rounded-3xl border-border/60 xl:sticky xl:top-6">
        <CardContent className="py-12 text-center text-muted-foreground">
          {copy.empty}
        </CardContent>
      </Card>
    );
  }

  const { lunar } = day;
  const allFestivals = [
    ...lunar.lunarFestivals.map(f => ({ name: f, type: "lunar" as const })),
    ...lunar.solarFestivals.map(f => ({ name: f, type: "solar" as const })),
    ...lunar.otherFestivals.map(f => ({
      name: f,
      type: "other" as const,
    })),
  ];

  return (
    <Card className="w-full rounded-3xl border-border/60 shadow-sm xl:sticky xl:top-6">
      <CardHeader className="flex flex-col border-b border-border/60 bg-muted/20 pb-5 gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          {format(selectedDate, copy.dateFormat, { locale: dateLocale })}
        </CardTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">{copy.lunarDate}</p>
            <p className="mt-1 text-sm font-medium">
              {lunar.yearInChinese}
              {copy.year} {lunar.isLeapMonth ? copy.leap : ""}
              {lunar.monthInChinese}月{lunar.dayInChinese}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">{copy.ganzhi}</p>
            <p className="mt-1 text-sm font-medium">
              {lunar.yearInGanZhi}
              {copy.year} {lunar.yearShengXiao}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-5 text-sm gap-5">
        <section>
          <h3 className="mb-2 font-medium text-muted-foreground">
            {copy.lunarInfo}
          </h3>
          <p className="leading-6">
            {lunar.yearInGanZhi}
            {copy.year}（{lunar.yearShengXiao}
            {copy.zodiac}）{" "}
            {lunar.monthInGanZhi}月 {lunar.dayInGanZhi}日
          </p>
        </section>

        <Separator />

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              {copy.constellation}
            </p>
            <p className="mt-1 font-medium">
              {lunar.xingZuo}
              {copy.constellationSuffix}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{copy.nayin}</p>
            <p className="mt-1 font-medium">{lunar.dayNaYin}</p>
          </div>
        </section>

        {lunar.jieQi && (
          <>
            <Separator />
            <section>
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {copy.solarTerm}
                {lunar.jieQi}
              </Badge>
            </section>
          </>
        )}

        {allFestivals.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 font-medium text-muted-foreground">
                {copy.festivals}
              </h3>
              <div className="flex flex-wrap gap-2">
                {allFestivals.map((f, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="rounded-full border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                  >
                    {f.name}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">
            <span className="text-green-600 dark:text-green-400">
              {copy.suitable}
            </span>
          </h3>
          {lunar.dayYi.length > 0 ? (
            <ScrollArea className="max-h-[136px]">
              <div className="flex flex-wrap gap-2">
                {lunar.dayYi.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-xs">{copy.none}</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">
            <span className="text-red-600 dark:text-red-400">
              {copy.avoid}
            </span>
          </h3>
          {lunar.dayJi.length > 0 ? (
            <ScrollArea className="max-h-[136px]">
              <div className="flex flex-wrap gap-2">
                {lunar.dayJi.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-xs">{copy.none}</p>
          )}
        </section>

        <Separator />

        <section className="flex flex-col rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground gap-2">
          <p className="font-medium text-foreground">{copy.clashTitle}</p>
          <p>
            {copy.clash
              .replace("{chong}", lunar.chong)
              .replace("{sha}", lunar.sha)}
          </p>
          <p>
            {copy.pengzu}
            {lunar.pengZuGan}
          </p>
          <p>{lunar.pengZuZhi}</p>
        </section>

        {(lunar.dayJiShen.length > 0 || lunar.dayXiongSha.length > 0) && (
          <>
            <Separator />
            <section className="flex flex-col text-xs gap-3">
              {lunar.dayJiShen.length > 0 && (
                <div className="rounded-2xl bg-green-500/5 p-3">
                  <span className="text-muted-foreground">
                    {copy.auspicious}
                  </span>
                  {lunar.dayJiShen.join("、")}
                </div>
              )}
              {lunar.dayXiongSha.length > 0 && (
                <div className="rounded-2xl bg-red-500/5 p-3">
                  <span className="text-muted-foreground">
                    {copy.inauspicious}
                  </span>
                  {lunar.dayXiongSha.join("、")}
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
