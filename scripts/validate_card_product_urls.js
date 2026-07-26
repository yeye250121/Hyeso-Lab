const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const EXPECTED_DOMAINS = {
  '신한카드': ['shinhancard.com'],
  '롯데카드': ['lottecard.co.kr'],
  '삼성카드': ['samsungcard.com'],
  'KB국민카드': ['kbcard.com'],
  '현대카드': ['hyundaicard.com'],
  'BC바로카드': ['paybooc.co.kr'],
  '하나카드': ['hanacard.co.kr'],
  'NH농협카드': ['nonghyup.com'],
  '우리카드': ['wooricard.com'],
};

const TRACKING_PARAMS = new Set(
  [
    'EntryLoc',
    'EntryLoc2',
    'empSeq',
    'btnApp',
    'alncmpC',
    'affcode',
    'webViewFirstPage',
    'eventCode',
    'agentCode',
    'solicitorcode',
    'FromSite',
    'bId',
    'landingId',
    'incnChnlDv',
    'affiCd',
    '_frame',
  ].map((value) => value.toLowerCase())
);

function parseArgs(argv) {
  const [command = 'report', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (!argument.startsWith('--')) continue;
    const key = argument.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) {
      options[key] = true;
    } else {
      options[key] = value;
      index += 1;
    }
  }
  return { command, options };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^0-9a-z가-힣]/g, '');
}

function detectEncoding(buffer) {
  const sample = buffer.subarray(0, 16_384).toString('latin1');
  const match = sample.match(
    /charset\s*=\s*["']?\s*(utf-8|euc-kr|ks_c_5601-1987|cp949)/i
  );
  if (!match) return 'utf-8';
  const value = match[1].toLowerCase();
  return value === 'utf-8' ? 'utf-8' : 'euc-kr';
}

function decodeBody(buffer) {
  const encoding = detectEncoding(buffer);
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

function bodyText(filePath) {
  const decoded = decodeBody(fs.readFileSync(filePath));
  const $ = cheerio.load(decoded);
  return `${decoded}\n${$.text()}`;
}

function hostMatchesCompany(host, company) {
  return (EXPECTED_DOMAINS[company] || []).some(
    (expected) => host === expected || host.endsWith(`.${expected}`)
  );
}

function trackingParams(url) {
  return [...url.searchParams.keys()].filter((key) =>
    TRACKING_PARAMS.has(key.toLowerCase())
  );
}

function productCodes(url) {
  const keys = [
    'code',
    'cardWcd',
    'cooperationcode',
    'allianceCode',
    'vtCdKndC',
    'CD_PD_SEQ',
    'cardPdctCd',
    'CD_WRS_SQNO',
    'cdPrdCd',
  ];
  return keys
    .map((key) => url.searchParams.get(key))
    .filter(Boolean)
    .map(normalize);
}

function validateCandidate(candidate, index, responseDir) {
  const bodyPath = path.join(responseDir, `${index}.body`);
  const metaPath = path.join(responseDir, `${index}.meta.json`);
  const reasons = [];

  if (!fs.existsSync(bodyPath) || !fs.existsSync(metaPath)) {
    return {
      ...candidate,
      verified: false,
      reasons: ['response_cache_missing'],
    };
  }

  let meta;
  try {
    meta = readJson(metaPath);
  } catch {
    return {
      ...candidate,
      verified: false,
      reasons: ['response_metadata_invalid'],
    };
  }

  let requestedUrl;
  let finalUrl;
  try {
    requestedUrl = new URL(candidate.officialProductUrl);
    finalUrl = new URL(meta.url_effective || candidate.officialProductUrl);
  } catch {
    return {
      ...candidate,
      verified: false,
      reasons: ['url_invalid'],
      http: meta,
    };
  }

  if (Number(meta.exit_code) !== 0) reasons.push('request_failed');
  if (Number(meta.http_code) < 200 || Number(meta.http_code) >= 300) {
    reasons.push('http_not_2xx');
  }
  if (!hostMatchesCompany(finalUrl.hostname, candidate.company)) {
    reasons.push('final_domain_mismatch');
  }

  const foundTrackingParams = trackingParams(requestedUrl);
  if (foundTrackingParams.length > 0) reasons.push('tracking_params_present');

  const text = bodyText(bodyPath);
  const normalizedText = normalize(text);
  const normalizedName = normalize(candidate.name);
  const nameMatched = normalizedName.length > 0 && normalizedText.includes(normalizedName);
  const codes = productCodes(requestedUrl);
  const productCodeMatched =
    codes.length > 0 && codes.some((code) => normalizedText.includes(code));

  if (!nameMatched) reasons.push('card_name_not_found');

  return {
    ...candidate,
    verified: reasons.length === 0,
    reasons,
    evidence: {
      nameMatched,
      productCodeMatched,
      trackingParams: foundTrackingParams,
    },
    http: meta,
  };
}

function buildReport(candidatesPath, responseDir) {
  const source = readJson(candidatesPath);
  const results = source.candidates.map((candidate, index) =>
    validateCandidate(candidate, index, responseDir)
  );
  const summary = results.reduce(
    (result, item) => {
      const status = item.verified ? 'verified' : 'manual';
      result[status] += 1;
      result.byCompany[item.company] ||= { verified: 0, manual: 0 };
      result.byCompany[item.company][status] += 1;
      for (const reason of item.reasons) {
        result.reasons[reason] = (result.reasons[reason] || 0) + 1;
      }
      return result;
    },
    {
      total: results.length,
      verified: 0,
      manual: 0,
      byCompany: {},
      reasons: {},
    }
  );

  return {
    generatedAt: new Date().toISOString(),
    summary,
    results,
  };
}

function dollarQuote(value) {
  const json = JSON.stringify(value);
  let tag = '$urls$';
  let suffix = 0;
  while (json.includes(tag)) {
    suffix += 1;
    tag = `$urls${suffix}$`;
  }
  return `${tag}${json}${tag}`;
}

function buildSql(report, { selection = 'verified' } = {}) {
  const shouldInclude = (item) => {
    if (selection === 'all') return true;
    if (selection === 'manual') return !item.verified;
    return item.verified;
  };
  const updates = report.results
    .filter(shouldInclude)
    .map((item) => ({
      id: item.id,
      official_product_url: item.officialProductUrl,
    }));

  if (updates.length === 0) {
    throw new Error(`선택 조건(${selection})에 해당하는 URL이 없습니다.`);
  }

  return `
with url_updates as (
  select id, official_product_url
  from jsonb_to_recordset(${dollarQuote(updates)}::jsonb)
    as item(
      id text,
      official_product_url text
    )
),
updated as (
  update public.cards as card
  set
    official_product_url = url_updates.official_product_url,
    official_product_url_verified_at = now()
  from url_updates
  where card.id = url_updates.id
  returning card.id
)
select count(*)::integer as updated_count from updated;
`.trim();
}

function buildManualReviewMarkdown(report) {
  const manualItems = report.results.filter((item) => !item.verified);
  const grouped = manualItems.reduce((result, item) => {
    result[item.company] ||= [];
    result[item.company].push(item);
    return result;
  }, {});
  const reasonLabels = {
    response_cache_missing: '자동 HTTP 검증 불가',
    response_metadata_invalid: '응답 메타데이터 오류',
    request_failed: 'HTTP 요청 실패',
    http_not_2xx: '2xx 응답 아님',
    final_domain_mismatch: '최종 도메인 불일치',
    tracking_params_present: '공식 URL에 추적 파라미터 포함',
    card_name_not_found: '응답 본문에서 전체 카드명 불일치',
    url_invalid: 'URL 형식 오류',
  };
  const lines = [
    '# 카드 공식 URL 자동 검증 보류 기록',
    '',
    `- 생성 시각: ${report.generatedAt}`,
    `- 전체 후보: ${report.summary.total}개`,
    `- 자동 검증 및 반영 대상: ${report.summary.verified}개`,
    `- 자동 검증 보류: ${manualItems.length}개`,
    '',
    '아래 항목은 자동 검증을 통과하지 못해 사용자 확인이 필요했던 후보 기록이다. 현재 DB 반영 상태는 별도 DB 조회 결과를 기준으로 판단한다.',
    '',
  ];

  for (const company of Object.keys(grouped)) {
    lines.push(`## ${company} (${grouped[company].length}개)`, '');
    for (const item of grouped[company]) {
      const reasons = item.reasons
        .map((reason) => reasonLabels[reason] || reason)
        .join(', ');
      const codeEvidence = item.evidence?.productCodeMatched
        ? '; 상품 코드 일치'
        : '';
      lines.push(
        `- ${item.name} (\`${item.id}\`): <${item.officialProductUrl}> — ${reasons}${codeEvidence}`
      );
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function run() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === 'report') {
    const report = buildReport(
      path.resolve(options.candidates || '/tmp/card-product-url-candidates.json'),
      path.resolve(options['response-dir'] || '/tmp/card-url-validation')
    );
    const outputPath = path.resolve(
      options.output || '/tmp/card-product-url-validation.json'
    );
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify({ outputPath, summary: report.summary })}\n`
    );
    return;
  }

  if (command === 'sql') {
    if (!options.input) throw new Error('sql 명령에는 --input이 필요합니다.');
    const selection = options.selection || 'verified';
    if (!['verified', 'manual', 'all'].includes(selection)) {
      throw new Error(`지원하지 않는 selection입니다: ${selection}`);
    }
    process.stdout.write(
      buildSql(readJson(path.resolve(options.input)), { selection })
    );
    return;
  }

  if (command === 'manual') {
    if (!options.input) throw new Error('manual 명령에는 --input이 필요합니다.');
    const outputPath = path.resolve(
      options.output || 'reports/card-url-manual-review.md'
    );
    const report = readJson(path.resolve(options.input));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buildManualReviewMarkdown(report));
    process.stdout.write(
      `${JSON.stringify({
        outputPath,
        manual: report.results.filter((item) => !item.verified).length,
      })}\n`
    );
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
  buildManualReviewMarkdown,
  buildReport,
  buildSql,
  normalize,
  validateCandidate,
};
