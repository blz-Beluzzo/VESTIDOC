# VESTIDOC v1.0
**Gestão de Vestígios e Documentação**
*Extração inteligente de dados · Automação documental · Rastreabilidade*

## Sobre o Projeto
Sistema desenvolvido em **Google Apps Script (Javascript + HTML)** integrado com a API do **Google Gemini (IA Generativa)** para automatizar rotinas de Polícia Judiciária (Polícia Civil). O objetivo é conferir celeridade, padronização e rastreabilidade ao processo de gestão de vestígios e encaminhamento de materiais apreendidos.

## Funcionalidades
- **Extração Inteligente (OCR):** O sistema lê o texto bruto de Laudos Periciais e utiliza Inteligência Artificial para extrair dados chave (Número do Laudo, APF, BO, Embalagem de Custódia, Lacres, Itens Periciados, etc.).
- **Automação Documental:** Geração automática de minutas de **Ofícios** e **Termos de Objeto em Trâmite Eletrônico** diretamente no Google Docs, respeitando os padrões institucionais.
- **Rastreabilidade (Controle Interno):** Lançamento padronizado de dados em planilha (Google Sheets) para controle de ativos da unidade policial.

## Tecnologias Utilizadas
- Google Apps Script (Backend)
- HTML5 / CSS3 / JavaScript Vanilla (Frontend)
- Google Drive API / Google Docs API / Google Sheets API
- Google Gemini API (LLM / Processamento de Linguagem Natural)

## Instalação e Uso (Para Desenvolvedores)
1. Crie um projeto no [Google Apps Script](https://script.google.com/).
2. Copie os arquivos `Code.gs`, `index.html` e `appsscript.json` para o editor do Apps Script.
3. Obtenha uma API Key no [Google AI Studio](https://aistudio.google.com/).
4. No arquivo `Code.gs`, insira a sua API Key na variável `GEMINI_API_KEY`.
5. Insira os IDs dos seus templates (Google Docs) e da sua planilha (Google Sheets) no frontend (`index.html`).
6. Faça a implantação como **App da Web** (Web App).

---
*Desenvolvido para fins de otimização de rotinas de Polícia Judiciária.*