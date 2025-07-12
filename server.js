const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Função para escapar HTML (prevenção XSS)
const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/sugestao', (req, res) => {
    const { error, nome, ingredientes, success } = req.query;
    
    fs.readFile(path.join(__dirname, 'views', 'sugestao.html'), 'utf8', (err, html) => {
        if (err) {
            return res.status(500).send('Erro ao carregar a página');
        }
        
        // Substituir marcadores
        let finalHtml = html;
        
        // Mensagem de sucesso
        if (success) {
            finalHtml = finalHtml.replace(
                '<!-- MARCADOR_MENSAGEM_SUCESSO -->',
                '<div class="mensagem-sucesso"><i class="fas fa-check-circle"></i> Sugestão enviada com sucesso! Obrigado pela contribuição.</div>'
            );
        } else {
            finalHtml = finalHtml.replace('<!-- MARCADOR_MENSAGEM_SUCESSO -->', '');
        }
        
        // Mensagem de erro
        if (error) {
            finalHtml = finalHtml.replace(
                '<!-- MARCADOR_MENSAGEM_ERRO -->',
                `<div class="mensagem-erro"><i class="fas fa-exclamation-circle"></i> ${escapeHtml(decodeURIComponent(error))}</div>`
            );
        } else {
            finalHtml = finalHtml.replace('<!-- MARCADOR_MENSAGEM_ERRO -->', '');
        }
        
        // Preencher campos
        const nomeSeguro = escapeHtml(nome || '');
        const ingredientesSeguro = escapeHtml(ingredientes || '');
        
        finalHtml = finalHtml.replace('id="nome-lanche" value=""', `id="nome-lanche" value="${nomeSeguro}"`);
        finalHtml = finalHtml.replace('id="ingredientes-lanche"></textarea>', `id="ingredientes-lanche">${ingredientesSeguro}</textarea>`);
        
        res.send(finalHtml);
    });
});

app.post('/sugestao-enviada', (req, res) => {
    const { nome, ingredientes } = req.body;
    
    // Verifica se os campos estão preenchidos
    if (!nome || !ingredientes) {
        return res.redirect(`/sugestao?error=${encodeURIComponent('Por favor, preencha todos os campos')}&nome=${encodeURIComponent(nome || '')}&ingredientes=${encodeURIComponent(ingredientes || '')}`);
    }
    
    // Redireciona de volta com mensagem de sucesso
    res.redirect(`/sugestao?success=1&nome=${encodeURIComponent(nome)}&ingredientes=${encodeURIComponent(ingredientes)}`);
});

app.get('/contato', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contato.html'));
});

app.post('/contato', (req, res) => {
    const { nome, email, assunto, mensagem } = req.body;
    
    // Verifica se os campos estão preenchidos
    if (!nome || !email || !assunto || !mensagem) {
        return res.redirect('/contato?error=Por favor, preencha todos os campos');
    }
    
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <base href="/">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Contato Recebido - DevBurger</title>
            <link rel="stylesheet" href="/css/style.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                /* Mesmos estilos da página de sugestão */
            </style>
        </head>
        <body>
            <section class="secao-agradecimento">
                <div class="container-agradecimento">
                    <div class="icone-agradecimento">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="titulo-agradecimento">Mensagem Enviada!</h2>
                    <p class="mensagem-agradecimento">Obrigado por entrar em contato com a DevBurger! Responderemos em breve.</p>
                    
                    <div class="detalhes-agradecimento">
                        <div class="item-detalhe">
                            <span class="rotulo-detalhe">Nome:</span>
                            <span>${escapeHtml(nome)}</span>
                        </div>
                        <div class="item-detalhe">
                            <span class="rotulo-detalhe">Email:</span>
                            <span>${escapeHtml(email)}</span>
                        </div>
                        <div class="item-detalhe">
                            <span class="rotulo-detalhe">Assunto:</span>
                            <span>${escapeHtml(assunto)}</span>
                        </div>
                        <div class="item-detalhe">
                            <span class="rotulo-detalhe">Mensagem:</span>
                            <span>${escapeHtml(mensagem)}</span>
                        </div>
                    </div>
                    
                    <a href="/" class="botao">Voltar ao Cardápio</a>
                </div>
            </section>
        </body>
        </html>
    `;
    
    // Configura o cabeçalho corretamente
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(html)
    });
    
    res.end(html);
});

app.get('/api/lanches', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'data', 'lanches.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler dados' });
        res.json(JSON.parse(data));
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));