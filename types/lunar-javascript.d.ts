declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getFestivals(): string[];
    getOtherFestivals(): string[];
    getXingZuo(): string;
    getWeek(): number;
    getWeekInChinese(): string;
    toYmd(): string;
    toFullString(): string;
  }

  export class Lunar {
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getMonth(): number;
    getJieQi(): string;
    getFestivals(): string[];
    getOtherFestivals(): string[];
    getYearShengXiao(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayJiShen(): string[];
    getDayXiongSha(): string[];
    getChong(): string;
    getSha(): string;
    getDayNaYin(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getPengZuGan(): string;
    getPengZuZhi(): string;
    getStarZodiac(): string;
    getStarDesc(): string;
    getCurrentJieQi(): { getName(): string; getSolar(): Solar } | undefined;
    getCurrentJie(): { getName(): string; getSolar(): Solar } | undefined;
    getEightChar(): EightChar;
    toFullString(): string;
  }

  export class EightChar {
    getMingGong(): { getGanZhi(): string };
  }
}
