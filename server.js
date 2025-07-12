const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/sugestao', (req, res) => {
    const { error, nome, ingredientes, success } = req.query;
    
    // Ler o arquivo HTML
    fs.readFile(path.join(__dirname, 'views', 'sugestao.html'), 'utf8', (err, html) => {
        if (err) {
            return res.status(500).send('Erro ao carregar a página');
        }
        
        // Substituir marcadores
        let finalHtml = html;
        
        // Mensagem de sucesso
        if (success) {
            finalHtml = finalHtml.replace(
                '<!-- SUCCESS_MESSAGE_PLACEHOLDER -->',
                '<div class="success-message"><i class="fas fa-check-circle"></i> Sugestão enviada com sucesso! Obrigado pela contribuição.</div>'
            );
        } else {
            finalHtml = finalHtml.replace('<!-- SUCCESS_MESSAGE_PLACEHOLDER -->', '');
        }
        
        // Mensagem de erro
        if (error) {
            finalHtml = finalHtml.replace(
                '<!-- ERROR_MESSAGE_PLACEHOLDER -->',
                `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${decodeURIComponent(error)}</div>`
            );
        } else {
            finalHtml = finalHtml.replace('<!-- ERROR_MESSAGE_PLACEHOLDER -->', '');
        }
        
        // Preencher campos
        finalHtml = finalHtml.replace('value=""', `value="${nome || ''}"`);
        finalHtml = finalHtml.replace('</textarea>', `${ingredientes || ''}</textarea>`);
        
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

app.post('/contato-enviado', (req, res) => {
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
            <section class="thank-you-section">
                <div class="thank-you-container">
                    <div class="thank-you-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="thank-you-title">Mensagem Enviada!</h2>
                    <p class="thank-you-message">Obrigado por entrar em contato com a DevBurger! Responderemos em breve.</p>
                    
                    <div class="thank-you-details">
                        <div class="detail-item">
                            <span class="detail-label">Nome:</span>
                            <span>${nome}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span>${email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Assunto:</span>
                            <span>${assunto}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Mensagem:</span>
                            <span>${mensagem}</span>
                        </div>
                    </div>
                    
                    <a href="/" class="btn">Voltar ao Cardápio</a>
                </div>
            </section>
        </body>
        </html>
    `;
    res.send(html);
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