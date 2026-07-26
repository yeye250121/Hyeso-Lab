const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CARDS_PATH = path.join(PROJECT_ROOT, 'data/cards.json');

const CARD_NAME_ALIASES = {
  '현대카드 ZERO Up': '현대카드 ZERO Up(할인형)',
  'KB국민 트레블러스 체크카드 (토심이)': 'KB국민 트래블러스 체크카드 (토심이)',
};

function parseArgs(argv) {
  const [command = 'build', ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (!argument.startsWith('--')) continue;

    const key = argument.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return { command, options };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadAjdList(listDir) {
  const cards = [];
  let expectedPages = null;

  for (let page = 0; expectedPages === null || page < expectedPages; page += 1) {
    const filePath = path.join(listDir, `ajd-api-page${page}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`AJD 목록 캐시가 없습니다: ${filePath}`);
    }

    const response = readJson(filePath);
    expectedPages = response.totalPages;
    cards.push(...response.content);
  }

  return cards;
}

function createTurndownService() {
  const turndown = new TurndownService({
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    headingStyle: 'atx',
    strongDelimiter: '**',
  });

  turndown.addRule('ajdTable', {
    filter: 'table',
    replacement(_content, node) {
      const rows = Array.from(node.querySelectorAll('tr'))
        .map((row) =>
          Array.from(row.querySelectorAll('th, td')).map((cell) =>
            String(cell.textContent || '')
              .replace(/\s+/g, ' ')
              .replace(/\|/g, '\\|')
              .trim()
          )
        )
        .filter((row) => row.length > 0);

      if (rows.length === 0) return '';

      const width = Math.max(...rows.map((row) => row.length));
      const normalizedRows = rows.map((row) => [
        ...row,
        ...Array(Math.max(0, width - row.length)).fill(''),
      ]);
      const header = normalizedRows[0];
      const separator = Array(width).fill('---');
      const body = normalizedRows.slice(1);
      const toLine = (row) => `| ${row.join(' | ')} |`;

      return `\n\n${[header, separator, ...body].map(toLine).join('\n')}\n\n`;
    },
  });

  return turndown;
}

const turndown = createTurndownService();

function htmlToMarkdown(html) {
  if (!html) return '';

  return turndown
    .turndown(html)
    .replace(/\u00a0/g, ' ')
    .replace(/^(\s*)\\([*-])\s+/gm, '$1$2 ')
    .replace(/^(\s*)●\s*/gm, '$1- ')
    .replace(/\\([\[\]])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBenefitTitle(card, benefit, isCaution) {
  const description = compactText(benefit.benefitDescription) || '상세 혜택';
  if (isCaution) return description;

  const performanceType = compactText(card.performanceTypeText);
  const performanceValue = compactText(card.performanceValueText || card.performanceValue);
  const condition = [performanceType, performanceValue].filter(Boolean).join(' ');

  if (!condition || description.includes(performanceValue)) return description;
  return `${description} (${condition})`;
}

function transformBenefit(card, benefit, isCaution = false) {
  return {
    category:
      compactText(benefit.benefitTitle) || (isCaution ? '유의사항' : '기타'),
    title: buildBenefitTitle(card, benefit, isCaution),
    content: htmlToMarkdown(benefit.benefitDetail),
  };
}

function transformCard(card) {
  const details = Array.isArray(card.benefitDetail) ? card.benefitDetail : [];
  const cautions = Array.isArray(card.benefitCaution) ? card.benefitCaution : [];

  const benefits = [
    ...details.map((benefit) => transformBenefit(card, benefit)),
    ...cautions.map((benefit) => transformBenefit(card, benefit, true)),
  ].filter((benefit) => benefit.content);

  if (benefits.length === 0) {
    throw new Error(`상세 혜택이 비어 있습니다: ${card.name} (${card.sn})`);
  }

  return benefits;
}

function chooseAjdCard(dbCard, candidates) {
  const expectedName = CARD_NAME_ALIASES[dbCard.name] || dbCard.name;
  const matches = candidates.filter(
    (card) =>
      card.name === expectedName &&
      card.cardCompany?.companyName === dbCard.company
  );

  if (matches.length === 0) return null;

  // AJD에 같은 상품명이 중복 등록된 경우 혜택은 같으므로 우선 노출 항목을 사용한다.
  return matches.sort(
    (left, right) =>
      (left.sortNumber ?? Number.MAX_SAFE_INTEGER) -
        (right.sortNumber ?? Number.MAX_SAFE_INTEGER) ||
      left.sn - right.sn
  )[0];
}

function buildUpdates({ cardsPath, listDir, detailDir }) {
  const dbCards = readJson(cardsPath);
  const ajdCards = loadAjdList(listDir);
  const updates = [];
  const unmatched = [];

  for (const dbCard of dbCards) {
    const ajdListCard = chooseAjdCard(dbCard, ajdCards);
    if (!ajdListCard) {
      unmatched.push({
        id: dbCard.id,
        name: dbCard.name,
        company: dbCard.company,
      });
      continue;
    }

    const detailPath = path.join(detailDir, `${ajdListCard.sn}.json`);
    if (!fs.existsSync(detailPath)) {
      throw new Error(`AJD 상세 캐시가 없습니다: ${detailPath}`);
    }

    const ajdDetail = readJson(detailPath);
    updates.push({
      id: dbCard.id,
      name: dbCard.name,
      company: dbCard.company,
      ajdCardSn: ajdDetail.sn,
      sourceUrl: `https://www.ajd.co.kr/card/detail/${ajdDetail.sn}`,
      benefits: transformCard(ajdDetail),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceListUrl: 'https://www.ajd.co.kr/card/list/all-card',
    dbCardCount: dbCards.length,
    ajdCardCount: ajdCards.length,
    matchedCount: updates.length,
    unmatched,
    updates,
  };
}

function dollarQuoteJson(value) {
  const json = JSON.stringify(value);
  let tag = '$ajd$';
  let suffix = 0;

  while (json.includes(tag)) {
    suffix += 1;
    tag = `$ajd${suffix}$`;
  }

  return `${tag}${json}${tag}`;
}

function buildSql(updates, { force = false } = {}) {
  const payload = updates.map(({ id, benefits }) => ({ id, benefits }));
  const json = dollarQuoteJson(payload);
  const preserveExistingCondition = force
    ? ''
    : `
    and jsonb_array_length(coalesce(card.main_benefits, '[]'::jsonb)) = 0`;

  return `
with benefit_updates as (
  select id, benefits
  from jsonb_to_recordset(${json}::jsonb)
    as item(id text, benefits jsonb)
),
updated as (
  update public.cards as card
  set main_benefits = benefit_updates.benefits
  from benefit_updates
  where card.id = benefit_updates.id${preserveExistingCondition}
  returning card.id
)
select count(*)::integer as updated_count from updated;
`.trim();
}

function resolveOptions(options) {
  return {
    cardsPath: path.resolve(options.cards || DEFAULT_CARDS_PATH),
    listDir: path.resolve(options['list-dir'] || '/tmp'),
    detailDir: path.resolve(options['detail-dir'] || '/tmp/ajd-details'),
  };
}

function run() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === 'build') {
    const result = buildUpdates(resolveOptions(options));
    const outputPath = path.resolve(options.output || '/tmp/ajd-card-benefit-updates.json');
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify({
        outputPath,
        dbCardCount: result.dbCardCount,
        ajdCardCount: result.ajdCardCount,
        matchedCount: result.matchedCount,
        unmatched: result.unmatched,
        benefitCount: result.updates.reduce(
          (total, update) => total + update.benefits.length,
          0
        ),
      })}\n`
    );
    return;
  }

  if (command === 'sql') {
    if (!options.input) {
      throw new Error('sql 명령에는 --input 파일이 필요합니다.');
    }

    const result = readJson(path.resolve(options.input));
    const offset = Number(options.offset || 0);
    const limit = Number(options.limit || result.updates.length);
    const updates = result.updates.slice(offset, offset + limit);

    if (updates.length === 0) {
      throw new Error(`SQL로 변환할 데이터가 없습니다: offset=${offset}`);
    }

    process.stdout.write(buildSql(updates, { force: options.force === true }));
    return;
  }

  throw new Error(`지원하지 않는 명령입니다: ${command}`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

module.exports = {
  CARD_NAME_ALIASES,
  buildSql,
  buildUpdates,
  chooseAjdCard,
  htmlToMarkdown,
  loadAjdList,
  transformCard,
};
