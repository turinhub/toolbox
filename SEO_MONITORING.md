# SEO Monitoring

Turinhub Toolbox targets Chinese search first. After each SEO-facing release,
use this checklist to keep indexing and search traffic measurable.

## Launch Checks

- Submit `https://turinhub.com/sitemap.xml` in Google Search Console.
- Submit `https://turinhub.com/sitemap.xml` in Baidu Search Resource Platform.
- Verify that `/`, `/tools`, and key tool pages are indexable and return 200.
- Check that `/api/` stays blocked in `robots.txt`.
- Run Rich Results Test or Schema Markup Validator for `/`, `/tools`, and at
  least five tool pages.

## Weekly Metrics

- Natural search landing pages.
- Search impressions, clicks, CTR, and average position.
- Indexed pages and excluded pages.
- Top Chinese queries for each tool category.
- Core Web Vitals for `/`, `/tools`, JSON Formatter, Prompt Optimizer, and GPU
  Calculator.

## Follow-up Rules

- If a tool page receives impressions but low CTR, revise its title and
  description in `lib/routes.ts`.
- If a page is crawled but not indexed, add clearer use cases and internal links.
- If a page has poor mobile Web Vitals, fix the rendering or client bundle before
  adding more content.
