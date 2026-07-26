const fs = require('fs');
const path = require('path');
const {
  chooseAjdCard,
  loadAjdList,
} = require('./import_ajd_card_benefits');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CARDS_PATH = path.join(PROJECT_ROOT, 'data/cards.json');

const OFFICIAL_URL_FALLBACKS = {
  '신한카드 Simple Plan+':
    'https://www.shinhancard.com/pconts/html/card/apply/credit/1237252_2207.html',
};

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) continue;
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      options[key] = true;
    } else {
      options[key] = value;
      index += 1;
    }
  }
  return options;
}

function requireParam(url, name, card) {
  const value = url.searchParams.get(name);
  if (!value) {
    throw new Error(`${card.name}: ${name} 상품 코드가 없습니다.`);
  }
  return value;
}

function buildOfficialProductUrl(card, ajdCard) {
  const fallback = OFFICIAL_URL_FALLBACKS[card.name];
  const ajdShortcutUrl = String(ajdCard.shortcutUrl || '').trim();

  if (!ajdShortcutUrl) {
    if (!fallback) {
      throw new Error(`${card.name}: 공식 URL 후보를 만들 원본 URL이 없습니다.`);
    }
    return {
      officialProductUrl: fallback,
      method: 'issuer_search_fallback',
      confidence: 'high',
    };
  }

  const source = new URL(ajdShortcutUrl);
  let officialProductUrl;
  let method;
  let confidence = 'high';

  switch (card.company) {
    case '신한카드': {
      officialProductUrl = `${source.origin}${source.pathname}`;
      method = 'remove_affiliate_query';
      break;
    }

    case '삼성카드': {
      const productCode =
        source.searchParams.get('code') ||
        source.searchParams.get('bgdAlncPdC');
      if (!productCode) {
        throw new Error(`${card.name}: 삼성카드 상품 코드가 없습니다.`);
      }
      const target = new URL(
        'https://www.samsungcard.com/home/card/cardinfo/PGHPPCCCardCardinfoDetails001'
      );
      target.searchParams.set('code', productCode);
      officialProductUrl = target.toString();
      method = 'samsung_product_code';
      break;
    }

    case 'KB국민카드': {
      const cooperationCode = source.searchParams.get('cooperationcode');
      const allianceCode = source.searchParams.get('allianceCode');

      if (cooperationCode) {
        const target = new URL(
          'https://card.kbcard.com/CRD/DVIEW/HCAMCXPRICAC0076'
        );
        target.searchParams.set('cooperationcode', cooperationCode);
        target.searchParams.set('mainCC', 'a');
        officialProductUrl = target.toString();
      } else if (allianceCode) {
        const target = new URL(
          'https://m.kbcard.com/CRD/DVIEW/MCAMCXHIACRC0002'
        );
        target.searchParams.set('allianceCode', allianceCode);
        target.searchParams.set('mainCC', 'b');
        officialProductUrl = target.toString();
      } else {
        throw new Error(`${card.name}: KB국민카드 상품 코드가 없습니다.`);
      }
      method = 'kb_product_code';
      break;
    }

    case '롯데카드': {
      const target = new URL(
        'https://www.lottecard.co.kr/app/LPCDADB_V100.lc'
      );
      target.searchParams.set(
        'vtCdKndC',
        requireParam(source, 'vtCdKndC', card)
      );
      officialProductUrl = target.toString();
      method = 'lotte_product_code';
      break;
    }

    case '하나카드': {
      const target = new URL(
        'https://m.hanacard.co.kr/MKCDCM1010M.web'
      );
      target.searchParams.set(
        'CD_PD_SEQ',
        requireParam(source, 'CD_PD_SEQ', card)
      );
      officialProductUrl = target.toString();
      method = 'hana_product_code';
      confidence = 'medium';
      break;
    }

    case '현대카드': {
      const productCode =
        source.searchParams.get('cardWcd') ||
        source.searchParams.get('cardwcd');
      if (!productCode) {
        throw new Error(`${card.name}: 현대카드 상품 코드가 없습니다.`);
      }
      const target = new URL(
        'https://www.hyundaicard.com/cpc/cr/CPCCR0201_01.hc'
      );
      target.searchParams.set('cardWcd', productCode);
      officialProductUrl = target.toString();
      method = 'hyundai_product_code';
      confidence = 'medium';
      break;
    }

    case 'BC바로카드': {
      const target = new URL(
        'https://app.paybooc.co.kr/ui/card-mgt/card-mgt/pybc-card/card-dts'
      );
      target.searchParams.set(
        'cardPdctCd',
        requireParam(source, 'cardPdctCd', card)
      );
      officialProductUrl = target.toString();
      method = 'paybooc_product_code';
      confidence = 'medium';
      break;
    }

    case 'NH농협카드': {
      const target = new URL(
        'https://card.nonghyup.com/servlet/IpCc2021R.act'
      );
      target.searchParams.set(
        'CD_WRS_SQNO',
        requireParam(source, 'cd_wrs_sqno', card)
      );
      officialProductUrl = target.toString();
      method = 'nh_product_code';
      break;
    }

    case '우리카드': {
      source.protocol = 'https:';
      officialProductUrl = source.toString();
      method = 'issuer_product_url';
      confidence = 'medium';
      break;
    }

    default:
      throw new Error(`${card.name}: 지원하지 않는 카드사입니다.`);
  }

  return {
    officialProductUrl,
    method,
    confidence,
  };
}

function buildReport({ cardsPath, listDir }) {
  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
  const ajdCards = loadAjdList(listDir);
  const candidates = cards.map((card) => {
    const ajdCard = chooseAjdCard(card, ajdCards);
    if (!ajdCard) {
      throw new Error(`${card.name}: AJD 카드 매칭에 실패했습니다.`);
    }

    return {
      id: card.id,
      name: card.name,
      company: card.company,
      ajdCardSn: ajdCard.sn,
      ...buildOfficialProductUrl(card, ajdCard),
    };
  });

  const summary = candidates.reduce((result, candidate) => {
    result[candidate.company] ||= { total: 0, high: 0, medium: 0 };
    result[candidate.company].total += 1;
    result[candidate.company][candidate.confidence] += 1;
    return result;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    total: candidates.length,
    summary,
    candidates,
  };
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const report = buildReport({
    cardsPath: path.resolve(options.cards || DEFAULT_CARDS_PATH),
    listDir: path.resolve(options['list-dir'] || '/tmp'),
  });
  const outputPath = path.resolve(
    options.output || '/tmp/card-product-url-candidates.json'
  );
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({
      outputPath,
      total: report.total,
      summary: report.summary,
    })}\n`
  );
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
  buildOfficialProductUrl,
  buildReport,
};
