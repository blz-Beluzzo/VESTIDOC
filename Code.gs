/**
 * ==============================================================
 * VESTIDOC - GESTÃO DE VESTÍGIOS E DOCUMENTAÇÃO (v1.0)
 * Extração inteligente de dados | Automação documental | Rastreabilidade
 * ==============================================================
 */

// ⚠️ ATENÇÃO: NÃO suba sua chave real no GitHub. Ao rodar no Apps Script, cole-a abaixo.
const GEMINI_API_KEY = 'SUA_API_KEY_AQUI'; 

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('VESTIDOC v1.0 - PCSC')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function descobrirModeloDisponivel() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const res = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    const json = JSON.parse(res.getContentText());
    if(!json.models) return 'gemini-1.5-flash';
    let m = json.models.find(x => x.name.includes('flash') && x.supportedGenerationMethods.includes('generateContent')) ||
            json.models.find(x => x.supportedGenerationMethods.includes('generateContent'));
    return m ? m.name.replace('models/', '') : 'gemini-1.5-flash';
  } catch(e) { return 'gemini-1.5-flash'; }
}

function extrairDadosComGemini(textoOCR) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'SUA_API_KEY_AQUI') throw new Error("ERRO CRÍTICO: API Key não configurada no backend.");
  
  const modelo = descobrirModeloDisponivel();
  const prompt = `
    Aja como Perito Criminal. Analise o OCR do Laudo. JSON estrito.
    
    CRÍTICO PARA MATERIAIS:
    - Localize a seção "1 MATERIAL" (ou similar).
    - Copie o texto EXATO de todos os itens.
    - Retorne 'materiais' como UMA ÚNICA STRING com quebras de linha (\n). 

    Campos buscados:
    - laudo, apf, ip, bo, tc, aai, aaa, eproc, vara
    - custodia (Embalagem), lacre, materiais

    Texto:
    ${textoOCR}
  `;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`;
  const response = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    muteHttpExceptions: true
  });
  
  const json = JSON.parse(response.getContentText());
  if (json.error) throw new Error(json.error.message);
  
  let raw = json.candidates[0].content.parts[0].text;
  let dados = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());

  if (dados.materiais) {
    if (Array.isArray(dados.materiais)) {
      dados.materiais = dados.materiais.map(i => (typeof i === 'object') ? Object.values(i).join(' ') : i).join('\n');
    } else if (typeof dados.materiais === 'object') {
      dados.materiais = JSON.stringify(dados.materiais);
    }
  }
  return dados;
}

function preencherTemplateDrive(dados) {
  try {
    const templateId = dados.tipoDoc === 'oficio' ? dados.templateOficioId : dados.templateTermoId;
    if (!templateId) throw new Error("ID do Template não informado!");

    const arquivoTemplate = DriveApp.getFileById(templateId);
    let pasta = dados.pastaId ? DriveApp.getFolderById(dados.pastaId.trim()) : DriveApp.getRootFolder();
    
    let nomeArquivo = "";
    if (dados.tipoDoc === 'oficio') {
        nomeArquivo = `Ofício ${dados.oficioSaida}`;
    } else {
        nomeArquivo = `Termo de Objeto em Trâmite Eletrônico (Ofício ${dados.oficioSaida})`;
    }
    
    const novaCopia = arquivoTemplate.makeCopy(nomeArquivo, pasta);
    const doc = DocumentApp.openById(novaCopia.getId());
    const body = doc.getBody();

    let pDest = (dados.destinatario || "").split('-');
    
    const replacements = {
        '<<NÚMERO_OFÍCIO>>': dados.oficioSaida,
        '<<NÚMERO_SGPE>>': dados.protocolo,
        '<<NUMERO_EMBALAGEM_CUSTODIA>>': dados.custodia,
        '<<NUMERO_APF>>': dados.apf,
        '<<NUMERO_BO>>': dados.bo || "___", 
        '<<NUMERO_LAUDO>>': dados.laudo,
        '<<NUMERO_LACRE>>': dados.lacre,
        '<<ITENS_PERICIADOS>>': dados.materiais,
        '<<NOME_DESTINATÁRIO>>': pDest[0]?.trim() || "AUTORIDADE",
        '<<CARGO_DESTINATÁRIO>>': pDest[1]?.trim() || "Autoridade Policial",
        '<<CIDADE>>': (pDest[2] || "Joinville/SC").split('/')[0].trim(),
        '<<ESTADO>>': (pDest[2] || "Joinville/SC").split('/')[1]?.trim() || "SC",
        '<<SETOR_DE_COMPETÊNCIA_SGPE>>': dados.setorSgpe
    };

    for (const [tag, v] of Object.entries(replacements)) body.replaceText(tag, v || " ");
    doc.saveAndClose();

    return doc.getUrl();
  } catch (e) { throw new Error("Erro de Automação Documental: " + e.message); }
}

function salvarRegistroPlanilha(dados) {
  try {
    if (!dados.planilhaId) throw new Error("ID da Planilha não informado.");
    
    const ss = SpreadsheetApp.openById(dados.planilhaId.trim());
    const sheet = ss.getSheets()[0]; 
    
    sheet.appendRow([
      dados.idRegistro,        
      dados.dataRegistro,      
      dados.laudo,             
      dados.materiais,         
      dados.destino,           
      dados.protocolo,         
      dados.oficioSaida,       
      dados.apf,               
      dados.ip,                
      dados.bo,                
      dados.tc,                
      dados.aai,               
      dados.aaa,               
      dados.custodia,          
      dados.lacre,             
      dados.eproc,             
      dados.vara               
    ]);
    return "Registro gravado com sucesso na base de rastreabilidade!";
  } catch (e) { throw new Error("Erro de Rastreabilidade (Planilha): " + e.message); }
}