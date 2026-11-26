import JSZip from 'jszip';
import { ScheduleItem, Slide, SongItem, ThemeTemplate } from '../types/worship';
import { getDateStamp } from './backupService';

export interface PptxExportSlideInput {
  itemTitle: string;
  itemSubtitle?: string;
  tag?: string;
  lines: string[];
  subtext?: string;
  textColorHex?: string;
  accentColorHex?: string;
  bgColorHex?: string;
  fontFamily?: string;
  baseFontSizePt?: number;
}

const SLIDE_WIDTH_EMU = 12192000; // 13.333 in (16:9 Widescreen)
const SLIDE_HEIGHT_EMU = 6858000; // 7.5 in

function sanitizeXmlText(value: string): string {
  return String(value || '')
    // Strip XML 1.0 illegal control chars except \t, \n, \r
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFilename(name: string): string {
  const cleaned = String(name || 'FreeWorship-Presentation')
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'FreeWorship-Presentation';
}

function normalizeHexColor(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const trimmed = raw.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return trimmed
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toUpperCase();
  }
  return fallback;
}

function pickCleanFontName(fontFamily?: string): string {
  if (!fontFamily) return 'Segoe UI';
  const first = fontFamily.split(',')[0].replace(/["']/g, '').trim();
  return first || 'Segoe UI';
}

function computeAutoFontSizePt(lines: string[], preferredPt = 36): number {
  const totalChars = lines.reduce((acc, l) => acc + l.length, 0);
  const lineCount = lines.length;
  if (lineCount >= 7 || totalChars > 260) return Math.min(preferredPt, 24);
  if (lineCount >= 5 || totalChars > 180) return Math.min(preferredPt, 28);
  if (lineCount >= 4 || totalChars > 120) return Math.min(preferredPt, 32);
  return Math.max(24, Math.min(preferredPt, 42));
}

function buildContentTypesXml(slideCount: number): string {
  const slideOverrides = Array.from({ length: slideCount }, (_, idx) => {
    const n = idx + 1;
    return `  <Override PartName="/ppt/slides/slide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${slideOverrides}
</Types>`;
}

function buildRootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function buildCorePropsXml(title: string): string {
  const iso = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${sanitizeXmlText(title)}</dc:title>
  <dc:creator>FreeWorship Studio</dc:creator>
  <cp:lastModifiedBy>FreeWorship Studio</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppPropsXml(slideCount: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>FreeWorship Studio</Application>
  <Slides>${slideCount}</Slides>
  <ScaleCrop>false</ScaleCrop>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>`;
}

function buildPresentationXml(slideCount: number): string {
  const sldIds = Array.from({ length: slideCount }, (_, idx) => {
    const id = 256 + idx;
    const rId = `rId${3 + idx}`;
    return `    <p:sldId id="${id}" r:id="${rId}"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
${sldIds}
  </p:sldIdLst>
  <p:sldSz cx="${SLIDE_WIDTH_EMU}" cy="${SLIDE_HEIGHT_EMU}"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function buildPresentationRelsXml(slideCount: number): string {
  const slideRels = Array.from({ length: slideCount }, (_, idx) => {
    const n = idx + 1;
    const rId = `rId${3 + idx}`;
    return `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${n}.xml"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
${slideRels}
</Relationships>`;
}

function buildThemeXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="FreeWorship Sanctuary">
  <a:themeElements>
    <a:clrScheme name="FreeWorship Dark">
      <a:dk1><a:srgbClr val="0B1120"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="E2E8F0"/></a:lt2>
      <a:accent1><a:srgbClr val="F59E0B"/></a:accent1>
      <a:accent2><a:srgbClr val="10B981"/></a:accent2>
      <a:accent3><a:srgbClr val="38BDF8"/></a:accent3>
      <a:accent4><a:srgbClr val="A855F7"/></a:accent4>
      <a:accent5><a:srgbClr val="F43F5E"/></a:accent5>
      <a:accent6><a:srgbClr val="94A3B8"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink>
      <a:folHlink><a:srgbClr val="818CF8"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="FreeWorship Fonts">
      <a:majorFont><a:latin typeface="Segoe UI"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Segoe UI"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="FreeWorship Format">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;
}

function buildSlideMasterXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="0B1120"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>`;
}

function buildSlideMasterRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;
}

function buildSlideLayoutXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function buildSlideLayoutRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;
}

function buildSlideRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
}

function buildTextParagraphsXml(
  lines: string[],
  fontFace: string,
  fontSizePt: number,
  colorHex: string,
  bold: boolean,
  align: 'ctr' | 'l' | 'r' = 'ctr'
): string {
  const safeLines = lines.length > 0 ? lines : [''];
  const sz = Math.round(fontSizePt * 100);
  return safeLines
    .map((line) => {
      const escaped = sanitizeXmlText(line);
      return `          <a:p>
            <a:pPr algn="${align}">
              <a:spcBef><a:spcPts val="300"/></a:spcBef>
              <a:spcAft><a:spcPts val="300"/></a:spcAft>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="${sz}" b="${bold ? '1' : '0'}" dirty="0">
                <a:solidFill><a:srgbClr val="${colorHex}"/></a:solidFill>
                <a:latin typeface="${sanitizeXmlText(fontFace)}"/>
              </a:rPr>
              <a:t>${escaped}</a:t>
            </a:r>
            <a:endParaRPr lang="en-US" sz="${sz}"/>
          </a:p>`;
    })
    .join('\n');
}

function buildSlideXml(slide: PptxExportSlideInput): string {
  const bgHex = normalizeHexColor(slide.bgColorHex, '0B1120');
  const textHex = normalizeHexColor(slide.textColorHex, 'FFFFFF');
  const accentHex = normalizeHexColor(slide.accentColorHex, 'FBBF24');
  const fontFace = pickCleanFontName(slide.fontFamily);
  const cleanLines = (slide.lines || []).filter((l) => l.trim().length > 0);
  const mainLines = cleanLines.length > 0 ? cleanLines : [slide.itemTitle || 'FreeWorship Slide'];
  const mainPt = computeAutoFontSizePt(mainLines, slide.baseFontSizePt || 36);

  const headerText = slide.tag
    ? `${slide.itemTitle}  •  ${slide.tag}`
    : slide.itemTitle;

  const headerParagraphs = headerText
    ? buildTextParagraphsXml([headerText], fontFace, 14, accentHex, true, 'ctr')
    : '';
  const bodyParagraphs = buildTextParagraphsXml(
    mainLines,
    fontFace,
    mainPt,
    textHex,
    true,
    'ctr'
  );
  const footerParagraphs = slide.subtext
    ? buildTextParagraphsXml([slide.subtext], fontFace, 12, '94A3B8', false, 'ctr')
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="${bgHex}"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${
        headerParagraphs
          ? `<p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title Header"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="609600" y="320040"/>
            <a:ext cx="10972800" cy="548640"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" anchor="ctr"/>
          <a:lstStyle/>
${headerParagraphs}
        </p:txBody>
      </p:sp>`
          : ''
      }
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Lyrics Content"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="762000" y="1066800"/>
            <a:ext cx="10668000" cy="4876800"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" anchor="ctr"/>
          <a:lstStyle/>
${bodyParagraphs}
        </p:txBody>
      </p:sp>
      ${
        footerParagraphs
          ? `<p:sp>
        <p:nvSpPr>
          <p:cNvPr id="4" name="Footer Caption"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="762000" y="6080760"/>
            <a:ext cx="10668000" cy="457200"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" anchor="ctr"/>
          <a:lstStyle/>
${footerParagraphs}
        </p:txBody>
      </p:sp>`
          : ''
      }
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

/**
 * Builds a valid OOXML `.pptx` Blob from an array of slide definitions using JSZip.
 */
export async function generatePptxBlob(
  slides: PptxExportSlideInput[],
  deckTitle = 'FreeWorship Presentation'
): Promise<Blob> {
  const safeSlides: PptxExportSlideInput[] =
    slides.length > 0
      ? slides
      : [
          {
            itemTitle: deckTitle,
            lines: [deckTitle],
            subtext: 'Exported from FreeWorship Studio',
          },
        ];

  const zip = new JSZip();
  zip.file('[Content_Types].xml', buildContentTypesXml(safeSlides.length));
  zip.file('_rels/.rels', buildRootRelsXml());
  zip.file('docProps/core.xml', buildCorePropsXml(deckTitle));
  zip.file('docProps/app.xml', buildAppPropsXml(safeSlides.length));
  zip.file('ppt/presentation.xml', buildPresentationXml(safeSlides.length));
  zip.file('ppt/_rels/presentation.xml.rels', buildPresentationRelsXml(safeSlides.length));
  zip.file('ppt/theme/theme1.xml', buildThemeXml());
  zip.file('ppt/slideMasters/slideMaster1.xml', buildSlideMasterXml());
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', buildSlideMasterRelsXml());
  zip.file('ppt/slideLayouts/slideLayout1.xml', buildSlideLayoutXml());
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', buildSlideLayoutRelsXml());

  safeSlides.forEach((slide, idx) => {
    const n = idx + 1;
    zip.file(`ppt/slides/slide${n}.xml`, buildSlideXml(slide));
    zip.file(`ppt/slides/_rels/slide${n}.xml.rels`, buildSlideRelsXml());
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

function triggerBinaryDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function mapSlideToPptxInput(
  itemTitle: string,
  itemSubtitle: string | undefined,
  slide: Slide,
  theme?: ThemeTemplate
): PptxExportSlideInput {
  const fallbackFont =
    theme?.fontFamily === 'serif'
      ? 'Georgia'
      : theme?.fontFamily === 'mono'
      ? 'Consolas'
      : 'Segoe UI';
  return {
    itemTitle,
    itemSubtitle,
    tag: slide.tag,
    lines: slide.lines || [],
    subtext: slide.subtext || itemSubtitle,
    textColorHex: theme?.textColor,
    fontFamily: theme?.customFontName || fallbackFont,
    baseFontSizePt: theme?.baseFontSizePx ? Math.round(theme.baseFontSizePx * 0.56) : 36,
  };
}

/**
 * Exports the entire Service Schedule (songs, scripture readings, presentations) as a 16:9 PowerPoint (.pptx) file.
 */
export async function exportScheduleToPptx(
  schedule: ScheduleItem[],
  themes: ThemeTemplate[],
  fallbackTheme?: ThemeTemplate
): Promise<{ filename: string; slideCount: number }> {
  const exportSlides: PptxExportSlideInput[] = [];

  for (const item of schedule) {
    const matchedTheme =
      themes.find((t) => t.id === item.themeId) || fallbackTheme;
    const itemSlides = item.slides && item.slides.length > 0 ? item.slides : [];
    for (const slide of itemSlides) {
      exportSlides.push(
        mapSlideToPptxInput(item.title, item.subtitle, slide, matchedTheme)
      );
    }
  }

  const filename = `FreeWorship-Schedule-${getDateStamp()}.pptx`;
  const blob = await generatePptxBlob(exportSlides, 'FreeWorship Service Schedule');
  triggerBinaryDownload(filename, blob);
  return { filename, slideCount: exportSlides.length };
}

/**
 * Exports a single ScheduleItem (or active live/preview deck) as a 16:9 PowerPoint (.pptx) file.
 */
export async function exportScheduleItemToPptx(
  item: ScheduleItem,
  theme?: ThemeTemplate
): Promise<{ filename: string; slideCount: number }> {
  const exportSlides = (item.slides || []).map((slide) =>
    mapSlideToPptxInput(item.title, item.subtitle, slide, theme)
  );
  const filename = `${sanitizeFilename(item.title)}.pptx`;
  const blob = await generatePptxBlob(exportSlides, item.title);
  triggerBinaryDownload(filename, blob);
  return { filename, slideCount: exportSlides.length };
}

/**
 * Exports a single SongItem from the library as a 16:9 PowerPoint (.pptx) file.
 */
export async function exportSongToPptx(
  song: SongItem,
  theme?: ThemeTemplate
): Promise<{ filename: string; slideCount: number }> {
  const subtitleParts = [song.author, song.musicalKey ? `Key of ${song.musicalKey}` : ''].filter(
    Boolean
  );
  const asScheduleItem: ScheduleItem = {
    id: song.id,
    type: 'song',
    title: song.title,
    subtitle: subtitleParts.join(' • '),
    backgroundId: '',
    themeId: theme?.id || '',
    slides: song.slides,
  };
  return exportScheduleItemToPptx(asScheduleItem, theme);
}

/**
 * Exports multiple songs into a single combined Worship Songbook PowerPoint (.pptx) deck.
 */
export async function exportSongsLibraryToPptx(
  songs: SongItem[],
  theme?: ThemeTemplate
): Promise<{ filename: string; slideCount: number }> {
  const exportSlides: PptxExportSlideInput[] = [];
  for (const song of songs) {
    const sub = [song.author, song.musicalKey ? `Key of ${song.musicalKey}` : '']
      .filter(Boolean)
      .join(' • ');
    for (const slide of song.slides || []) {
      exportSlides.push(mapSlideToPptxInput(song.title, sub, slide, theme));
    }
  }
  const filename = `FreeWorship-Songs-${songs.length}-${getDateStamp()}.pptx`;
  const blob = await generatePptxBlob(exportSlides, 'FreeWorship Worship Songbook');
  triggerBinaryDownload(filename, blob);
  return { filename, slideCount: exportSlides.length };
}
