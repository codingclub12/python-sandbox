// Styling foundation for the AP Computer Science Principles Teacher Superpack (CSP green theme).
// One source of truth -> every document is visually identical ("fluid").
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  TabStopType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, HeadingLevel
} = require('docx');

const C = {
  NAVY:'064E3B', PURPLE:'065F46', AMBER:'E8A020', AMBERTX:'8A5A00', AMBERBG:'FFF4DE',
  LAVBG:'ECFDF5', TEAL:'0E7490', TEALBG:'E0F2F7', LIGHT:'ECFDF5', CODEBG:'F0F7F4',
  GRAY:'555555', RULE:'065F46'
};
const FONT='Arial', MONO='Consolas';

function styles(){return{
  default:{document:{run:{font:FONT,size:22}}},
  paragraphStyles:[
    {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
      run:{size:30,bold:true,font:FONT,color:C.NAVY},
      paragraph:{spacing:{before:240,after:120},outlineLevel:0}},
    {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,
      run:{size:25,bold:true,font:FONT,color:C.NAVY},
      paragraph:{spacing:{before:220,after:100},outlineLevel:1,
        border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.RULE,space:2}}}},
    {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,
      run:{size:22,bold:true,font:FONT,color:'222222'},
      paragraph:{spacing:{before:160,after:60},outlineLevel:2}},
  ]};}

function numbering(){return{config:[
  {reference:'bullets',levels:[
    {level:0,format:LevelFormat.BULLET,text:'\u2022',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:600,hanging:280}}}},
    {level:1,format:LevelFormat.BULLET,text:'\u25E6',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:1080,hanging:280}}}}]},
  {reference:'nums',levels:[
    {level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:600,hanging:320}}}}]},
]};}

const PAGE={size:{width:12240,height:15840},margin:{top:1180,right:1180,bottom:1180,left:1180}};
const CONTENT_W=9880;

function run(text,opt={}){return new TextRun({text,...opt});}
function p(text,opt={}){const runs=Array.isArray(text)?text:[run(text,opt.run||{})];
  return new Paragraph({children:runs,spacing:{after:opt.after??80,line:276},...opt.para});}
function h1(t){return new Paragraph({heading:HeadingLevel.HEADING_1,children:[run(t)]});}
function h2(t){return new Paragraph({heading:HeadingLevel.HEADING_2,children:[run(t)]});}
function h3(t){return new Paragraph({heading:HeadingLevel.HEADING_3,children:[run(t)]});}
function bullet(text,opt={}){const runs=Array.isArray(text)?text:[run(text)];
  return new Paragraph({numbering:{reference:'bullets',level:opt.level||0},children:runs,spacing:{after:50,line:268}});}
function numItem(text){const runs=Array.isArray(text)?text:[run(text)];
  return new Paragraph({numbering:{reference:'nums',level:0},children:runs,spacing:{after:50,line:268}});}
function link(label,url){return new ExternalHyperlink({link:url,
  children:[new TextRun({text:label,color:C.PURPLE,underline:{}})]});}

function solidBorders(col){const b={style:BorderStyle.SINGLE,size:1,color:col};
  return{top:b,bottom:b,left:b,right:b,insideHorizontal:b,insideVertical:b};}

function code(lines,opt={}){
  const rows=lines.map(line=>new Paragraph({spacing:{after:0,line:248},
    children:[new TextRun({text:line.length?line:' ',font:MONO,size:19,color:'1A1A1A'})]}));
  const w=opt.width||CONTENT_W;
  return new Table({width:{size:w,type:WidthType.DXA},columnWidths:[w],
    rows:[new TableRow({children:[new TableCell({width:{size:w,type:WidthType.DXA},
      shading:{fill:C.CODEBG,type:ShadingType.CLEAR},margins:{top:100,bottom:100,left:160,right:160},
      borders:solidBorders('DAD3F0'),children:rows})]})]});}

function callout(title,bodyChildren,kind='info'){
  const map={info:[C.LAVBG,C.PURPLE],warn:[C.AMBERBG,C.AMBERTX],tip:[C.TEALBG,C.TEAL]};
  const [bg,fg]=map[kind]||map.info; const kids=[];
  if(title)kids.push(new Paragraph({spacing:{after:60},children:[new TextRun({text:title,bold:true,color:fg,size:22})]}));
  bodyChildren.forEach(c=>kids.push(c));
  return new Table({width:{size:CONTENT_W,type:WidthType.DXA},columnWidths:[CONTENT_W],
    rows:[new TableRow({children:[new TableCell({width:{size:CONTENT_W,type:WidthType.DXA},
      shading:{fill:bg,type:ShadingType.CLEAR},margins:{top:120,bottom:120,left:180,right:180},
      borders:{left:{style:BorderStyle.SINGLE,size:18,color:fg},
        top:{style:BorderStyle.SINGLE,size:1,color:bg},bottom:{style:BorderStyle.SINGLE,size:1,color:bg},
        right:{style:BorderStyle.SINGLE,size:1,color:bg}},children:kids})]})]});}

function dataTable(headers,rows,widths){
  // Normalize widths to the ACTUAL column count so a mismatch between the
  // caller's hardcoded width array and the data's column count can't crash the
  // docx layer (widths[i] === undefined). Missing widths get an even split.
  const ncol=Math.max(headers.length,...rows.map(r=>r.length),1);
  let w=Array.isArray(widths)?widths.slice(0,ncol):[];
  if(w.length<ncol){const def=Math.round(9360/ncol);for(let i=w.length;i<ncol;i++)w.push(def);}
  const total=w.reduce((a,b)=>a+b,0);
  const headerRow=new TableRow({tableHeader:true,children:headers.map((htxt,i)=>
    new TableCell({width:{size:w[i],type:WidthType.DXA},shading:{fill:C.NAVY,type:ShadingType.CLEAR},
      borders:solidBorders('FFFFFF'),margins:{top:70,bottom:70,left:110,right:110},verticalAlign:VerticalAlign.CENTER,
      children:[new Paragraph({spacing:{after:0},children:[new TextRun({text:htxt,bold:true,color:'FFFFFF',size:21})]})]}))});
  const bodyRows=rows.map((r,ri)=>new TableRow({children:r.map((cell,i)=>
    new TableCell({width:{size:w[i],type:WidthType.DXA},
      shading:{fill:ri%2?'FFFFFF':C.LAVBG,type:ShadingType.CLEAR},borders:solidBorders('D6CEEC'),
      margins:{top:60,bottom:60,left:110,right:110},verticalAlign:VerticalAlign.CENTER,
      children:(Array.isArray(cell)?cell:[new Paragraph({spacing:{after:0},children:[new TextRun({text:String(cell),size:20})]})])}))}));
  return new Table({width:{size:total,type:WidthType.DXA},columnWidths:w,rows:[headerRow,...bodyRows]});}

function spacer(h=80){return new Paragraph({spacing:{after:h},children:[run('')]});}
function rule(){return new Paragraph({spacing:{before:60,after:120},
  border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.RULE,space:1}},children:[run('')]});}
function pageBreak(){return new Paragraph({children:[new PageBreak()]});}

function brandHeader(docLabel,unitLabel){return new Header({children:[new Paragraph({
  tabStops:[{type:TabStopType.RIGHT,position:CONTENT_W}],spacing:{after:40},
  border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.RULE,space:4}},
  children:[new TextRun({text:'AP Computer Science Principles \u2022 '+(unitLabel||'Big Idea 2: Data'),bold:true,size:16,color:C.NAVY}),
    new TextRun({text:'\t'+docLabel,size:16,color:C.GRAY})]})]});}
function brandFooter(){return new Footer({children:[new Paragraph({
  tabStops:[{type:TabStopType.RIGHT,position:CONTENT_W}],
  children:[new TextRun({text:'APCSExamPrep.com  \u2014  Teacher Superpack',size:16,color:C.GRAY}),
    new TextRun({text:'\tPage ',size:16,color:C.GRAY}),
    new TextRun({children:[PageNumber.CURRENT],size:16,color:C.GRAY})]})]});}

function titleBlock(eyebrow,title,subtitle){return[
  new Paragraph({spacing:{after:40},children:[new TextRun({text:eyebrow,bold:true,size:20,color:C.PURPLE,allCaps:true})]}),
  new Paragraph({spacing:{after:60},children:[new TextRun({text:title,bold:true,size:40,color:C.NAVY})]}),
  new Paragraph({spacing:{after:160},border:{bottom:{style:BorderStyle.SINGLE,size:10,color:C.AMBER,space:4}},
    children:[new TextRun({text:subtitle,size:24,color:'333333'})]}),
];}

function buildDoc(docLabel,children,unitLabel){return new Document({creator:'AP CS Exam Prep',title:docLabel,description:'AP CS Exam Prep',styles:styles(),numbering:numbering(),
  sections:[{properties:{page:PAGE},headers:{default:brandHeader(docLabel,unitLabel)},footers:{default:brandFooter()},children}]});}
async function save(doc,path){const buf=await Packer.toBuffer(doc);require('fs').writeFileSync(path,buf);return path;}

// Verified live AP Cyber Unit 2 website handles (from site, June 2026)
const SITE='https://www.apcsexamprep.com';
const LINKS={
  hub:        SITE+'/pages/ap-cybersecurity-unit-2-securing-spaces',
  l1:         SITE+'/pages/ap-cybersecurity-unit-2-cyber-foundations',
  l2:         SITE+'/pages/ap-cybersecurity-unit-2-physical-vulnerabilities',
  l3:         SITE+'/pages/ap-cybersecurity-unit-2-protecting-physical-spaces',
  l4:         SITE+'/pages/ap-cybersecurity-unit-2-detecting-physical-attacks',
  ex:(n,i)=>  SITE+'/pages/ap-cyber-unit-2-lesson-'+n+'-exercise-'+i,
  lab:(n)=>   SITE+'/pages/ap-cyber-unit-2-lesson-'+n+'-lab',
  quiz:(n)=>  SITE+'/pages/ap-cyber-unit-2-lesson-'+n+'-quiz',
  studyGuide: SITE+'/pages/ap-cybersecurity-study-guide',
  practice:   SITE+'/pages/ap-cybersecurity-practice-exam',
  teacher:    SITE+'/pages/ap-cybersecurity-teacher-resources',
};

// Remove College-Board EK code citations/labels from STUDENT-facing prose, so
// students name techniques/concepts rather than reciting framework codes. Only
// run it on strings that actually mention "EK" (callers gate on /EK/).
const _EKC = '(?:CRD|DAT|AAP|CSN|IOC)-\\d+\\.[A-Z](?:\\.\\d+)?';
const _EKCS = '(?:EK\\s*)?' + _EKC + '(?:\\s*(?:,\\s*(?:and\\s+|to\\s+)?|[–\\-/&]\\s*|and\\s+|to\\s+)\\s*(?:EK\\s*)?(?:' + _EKC + '|\\d+\\.[A-Z](?:\\.\\d+)?|[A-Z]\\.\\d+|\\.\\d+))*';
function stripEK(s) {
  if (!s) return s; let t = s;
  t = t.replace(new RegExp('\\s*per\\s+(?:the\\s+)?(?:EK\\s*)?(?:' + _EKC + '\\s+)?reasoning', 'gi'), '');
  t = t.replace(new RegExp('\\s*\\([^()]*EK\\s*' + _EKC + '[^()]*\\)', 'gi'), '');
  t = t.replace(new RegExp('\\s*\\(\\s*' + _EKCS + '\\s*\\)', 'gi'), '');
  t = t.replace(new RegExp('\\s*\\[[^\\][]*EK\\s*' + _EKC + '[^\\][]*\\]', 'gi'), '');
  t = t.replace(new RegExp('\\s*\\[\\s*' + _EKCS + '\\s*\\]', 'gi'), '');
  t = t.replace(new RegExp('(^|[.?!]\\s+)(?:Using|Citing|Per|Reference|Quoting|Referencing)\\s+' + _EKCS + '\\s*,?\\s*', 'g'), '$1');
  t = t.replace(new RegExp(',?\\s*(?:and\\s+)?(?:citing|cite|per|under|by|from|via|using|reference|referencing|quote|quoting)\\s+(?:its|the|each|one)?\\s*' + _EKCS, 'gi'), '');
  t = t.replace(/,?\s*(?:and\s+|then\s+)?(?:cite|citing|name|naming|quote|quoting|give|state|provide|list|including)\s+(?:its|the|each|which|one|every|both)\s+EK(?:'s)?(?:\s+number)?(?:\s+for\s+(?:each|it|each\s+part|what[^,.]*))?/gi, '');
  t = t.replace(/\s+and\s+(?:its\s+|their\s+)?EK\b/gi, '');
  t = t.replace(/\s+with\s+(?:its|the|each)\s+EK\b/gi, '');
  t = t.replace(/\bwhich\s+EK\b/gi, 'what');
  t = t.replace(/\bthe\s+EK's\b/gi, 'its');
  t = t.replace(new RegExp('\\b(yet|and|because|since|so|but)\\s+EK\\s*' + _EKC + '\\b(?=\\s+[a-z])', 'gi'), '$1 that capability');
  t = t.replace(/\s*\(EK\)/gi, '').replace(/\s*\+\s*EK\b/gi, '').replace(/\s+EK\s*:/gi, ':');
  t = t.replace(new RegExp('\\s*\\bEKs?\\s*' + _EKC + '(?:\\s*,?\\s*(?:and\\s+)?(?:' + _EKC + '|\\d+\\.[A-Z](?:\\.\\d+)?|[A-Z]\\.\\d+))*', 'g'), '');
  t = t.replace(/\s*\bEKs?\b/g, '');
  t = t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:?!])/g, '$1').replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '')
       .replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/\s+,/g, ',')
       .replace(/:\s*\)/g, ')').replace(/\(\s*,/g, '(').replace(/—\s*[,.]/g, '—').replace(/\s+—\s*$/, '').trim();
  // a removed clause can leave a sentence-end glued to a comma, or a dangling comma after a verb
  t = t.replace(/([.?!])\s*,/g, '$1').replace(/\b(state|explain|name|give|identify)\s*,\s+/gi, '$1 ')
       .replace(/—\s*,/g, '—').replace(/,\s*—/g, ' —').replace(/\s{2,}/g, ' ').trim();
  t = t.replace(/^[\s,;:.\u2014\u2013-]+/, '').trim();
  t = t.replace(/(^|[.?!]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  return t;
}

// ---- pages.csv upsert (record-aware) -------------------------------------
// Split CSV text into full records, respecting quoted fields that legitimately
// contain commas AND newlines (Shopify Body HTML does). A naive line-based
// regex removal corrupts multi-line rows into orphaned fragments — this does not.
function splitCsvRecords(text){
  const recs=[]; let cur='', inq=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inq){
      if(c==='"'){ if(text[i+1]==='"'){cur+='""';i++;continue;} inq=false; cur+='"'; continue; }
      cur+=c; continue;
    }
    if(c==='"'){ inq=true; cur+='"'; continue; }
    if(c==='\r'&&text[i+1]==='\n'){ recs.push(cur); cur=''; i++; continue; }
    if(c==='\n'){ recs.push(cur); cur=''; continue; }
    cur+=c;
  }
  if(cur!=='') recs.push(cur);
  return recs;
}
// Upsert one gated page row into pages.csv keyed by handle. headerCells and
// rowCells are already-escaped quoted field strings. Removes any prior record
// for the same handle (full multi-line record), then appends the new one.
function upsertPagesCsvRow(csvPath, headerCells, handle, rowCells){
  const fs=require('fs'); const BOM='﻿';
  let header=headerCells.join(','), body=[];
  if(fs.existsSync(csvPath)){
    let text=fs.readFileSync(csvPath,'utf8');
    if(text.startsWith(BOM)) text=text.slice(BOM.length);
    const recs=splitCsvRecords(text).filter(r=>r.length);
    if(recs.length){ header=recs[0]; body=recs.slice(1).filter(r=>!r.startsWith('"'+handle+'"')); }
  }
  body.push(rowCells.join(','));
  fs.writeFileSync(csvPath, BOM+header+'\r\n'+body.join('\r\n')+'\r\n','utf8');
}

module.exports={C,FONT,MONO,run,p,h1,h2,h3,bullet,numItem,link,code,callout,dataTable,stripEK,
  spacer,rule,pageBreak,titleBlock,buildDoc,save,LINKS,Paragraph,TextRun,PageBreak,
  splitCsvRecords,upsertPagesCsvRow};
