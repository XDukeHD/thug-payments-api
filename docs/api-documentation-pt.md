# Documentação da API Thug Payments

## Índice

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Endpoints da API](#endpoints-da-api)
   - [Pagamentos com Cartão de Crédito](#pagamentos-com-cartão-de-crédito)
   - [Pagamentos PIX](#pagamentos-pix)
   - [Checkout PagBank](#checkout-pagbank)
   - [Gerenciamento de Status](#gerenciamento-de-status)
   - [Pagamentos por Usuário](#pagamentos-por-usuário)
4. [Webhooks](#webhooks)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Códigos de Status](#códigos-de-status)
7. [Exemplos de Requisições](#exemplos-de-requisições)

## Introdução

A API Thug Payments é um sistema robusto de processamento de pagamentos construído sobre a infraestrutura do PagBank. Esta API permite processar pagamentos, rastrear seus status e gerenciar registros de pagamento de forma eficiente.

### URL Base

```
http://seu-dominio.com/api/payments
```

Substitua `seu-dominio.com` pelo seu domínio real ou endereço IP e porta (ex: `localhost:3000` ou `ighostdowncool.com`)

## Autenticação

Todos os endpoints da API (exceto webhooks) exigem autenticação usando uma chave de sistema, que é passada pelo cabeçalho HTTP `x-system-key`.

```
x-system-key: sua_chave_segura_de_sistema_aqui
```

A chave do sistema é definida no seu arquivo `config.json`.

Falha na autenticação resultará em uma resposta 401 Unauthorized:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing system key"
}
```

## Endpoints da API

### Pagamentos com Cartão de Crédito

#### Criar um Pagamento com Cartão de Crédito

Cria um novo pagamento usando o método de cartão de crédito.

**Endpoint:** `POST /credit-card`

**Cabeçalhos da Requisição:**
- Content-Type: application/json
- x-system-key: sua_chave_segura_de_sistema_aqui

**Corpo da Requisição:**
```json
{
  "amount": 100.50,
  "description": "Compra de produto",
  "customerName": "João Silva",
  "customerEmail": "joao@exemplo.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "usuario123",
  "card": {
    "number": "4111111111111111",
    "expMonth": "12",
    "expYear": "2025",
    "securityCode": "123",
    "holderName": "JOAO SILVA"
  },
  "installments": 1
}
```

**Campos Obrigatórios:**
- `amount`: Valor do pagamento (numérico, maior que 0)
- `customerUserId`: Identificador único do cliente no seu sistema
- `card`: Objeto com informações do cartão contendo todos os campos requeridos

**Campos Opcionais:**
- `description`: Descrição do pagamento
- `customerName`: Nome completo do cliente
- `customerEmail`: Endereço de email do cliente
- `customerDocument`: Documento de identificação fiscal do cliente (CPF/CNPJ)
- `installments`: Número de parcelas (padrão: 1)

**Exemplo de Resposta (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "chargeId": "CHARGE_123456789",
    "receiptUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt"
  }
}
```

### Pagamentos PIX

#### Criar um Pagamento PIX

Cria um novo pagamento PIX.

**Endpoint:** `POST /pix`

**Cabeçalhos da Requisição:**
- Content-Type: application/json
- x-system-key: sua_chave_segura_de_sistema_aqui

**Corpo da Requisição:**
```json
{
  "amount": 100.50,
  "description": "Compra de produto",
  "customerName": "João Silva",
  "customerEmail": "joao@exemplo.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "usuario123",
  "expirationHours": 24
}
```

**Campos Obrigatórios:**
- `amount`: Valor do pagamento (numérico, maior que 0)
- `customerUserId`: Identificador único do cliente no seu sistema

**Campos Opcionais:**
- `description`: Descrição do pagamento
- `customerName`: Nome completo do cliente
- `customerEmail`: Endereço de email do cliente
- `customerDocument`: Documento de identificação fiscal do cliente (CPF/CNPJ)
- `expirationHours`: Horas até que o PIX expire (padrão é 24)

**Exemplo de Resposta (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "orderId": "ORDER_123456789",
    "pix": {
      "qrCode": "00020101021226850014br.gov.bcb.pix2563api-h.pagseguro.com/pix/v2/...",
      "qrCodeImage": "https://sandbox.api.pagseguro.com/qrcode/QRCO_123456789/png",
      "copyPaste": "00020101021226850014br.gov.bcb.pix2563...",
      "expirationDate": "2025-05-13T01:57:53.000-03:00"
    }
  }
}
```

### Checkout PagBank

#### Criar uma Sessão de Checkout PagBank

Cria uma sessão de checkout que redireciona o cliente para a página de pagamento do PagBank com várias opções de pagamento.

**Endpoint:** `POST /checkout`

**Cabeçalhos da Requisição:**
- Content-Type: application/json
- x-system-key: sua_chave_segura_de_sistema_aqui

**Corpo da Requisição:**
```json
{
  "amount": 100.50,
  "description": "Compra de produto",
  "customerName": "João Silva",
  "customerEmail": "joao@exemplo.com",
  "customerDocument": "123.456.789-01",
  "customerUserId": "usuario123",
  "enabledTypes": ["CREDIT_CARD", "DEBIT_CARD", "BOLETO", "PIX"],
  "defaultType": "CREDIT_CARD",
  "expiresAt": "2025-05-13T23:59:59-03:00",
  "redirectUrl": "https://sua-loja.com/pagamento/confirmacao"
}
```

**Campos Obrigatórios:**
- `amount`: Valor do pagamento (numérico, maior que 0)
- `customerUserId`: Identificador único do cliente no seu sistema

**Campos Opcionais:**
- `description`: Descrição do pagamento
- `customerName`: Nome completo do cliente
- `customerEmail`: Endereço de email do cliente
- `customerDocument`: Documento de identificação fiscal do cliente (CPF/CNPJ)
- `enabledTypes`: Array de métodos de pagamento habilitados (padrão são todos os métodos disponíveis)
- `defaultType`: Método de pagamento padrão selecionado (padrão é "CREDIT_CARD")
- `expiresAt`: Data ISO para expiração do checkout (padrão é 24 horas após a criação)
- `redirectUrl`: URL para redirecionamento após o pagamento (padrão é a URL configurada no seu config.json)

**Exemplo de Resposta (201 Created):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "status": "PENDING",
    "checkoutId": "CHECKOUT_123456789",
    "checkoutUrl": "https://sandbox.pagseguro.com.br/checkout/123456789"
  }
}
```

### Status de Pagamento

#### Consultar Status de Pagamento

Verifica o status de um pagamento específico.

**Endpoint:** `GET /status/:referenceId`

**Cabeçalhos da Requisição:**
- x-system-key: sua_chave_segura_de_sistema_aqui

**Parâmetros de Caminho:**
- `referenceId`: O ID de referência retornado quando o pagamento foi criado

**Exemplo de Resposta (200 OK):**
```json
{
  "success": true,
  "payment": {
    "referenceId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.50,
    "description": "Compra de produto",
    "status": "PAID",
    "statusMessage": "PAID",
    "customerName": "João Silva",
    "customerEmail": "joao@exemplo.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "usuario123",
    "paymentMethod": "CREDIT_CARD",
    "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
    "createdAt": "2025-05-11T21:09:00.000Z",
    "updatedAt": "2025-05-11T21:15:00.000Z"
  }
}
```

#### Obter Todos os Pagamentos

Recupera todos os registros de pagamento com paginação.

**Endpoint:** `GET /all`

**Cabeçalhos da Requisição:**
- x-system-key: sua_chave_segura_de_sistema_aqui

**Parâmetros de Consulta:**
- `limit`: Número máximo de registros a retornar (padrão: 100)
- `offset`: Número de registros a ignorar (padrão: 0)

**Exemplo de Resposta (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Compra de produto",
      "status": "PAID",
      "customerName": "João Silva",
      "customerEmail": "joao@exemplo.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "usuario123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    },
    {
      "referenceId": "660e8400-e29b-41d4-a716-446655440001",
      "amount": 200.75,
      "description": "Taxa de serviço",
      "status": "PENDING",
      "customerName": "Maria Souza",
      "customerEmail": "maria@exemplo.com",
      "customerDocument": "234.567.890-12",
      "customerUserId": "usuario456",
      "paymentMethod": "PIX",
      "paymentUrl": "https://sandbox.api.pagseguro.com/qrcode/QRCO_987654321/png",
      "createdAt": "2025-05-11T22:30:00.000Z",
      "updatedAt": "2025-05-11T22:30:00.000Z"
    }
  ]
}
```

#### Obter Pagamentos por Status

Recupera registros de pagamento filtrados por status.

**Endpoint:** `GET /status/filter/:status`

**Cabeçalhos da Requisição:**
- x-system-key: sua_chave_segura_de_sistema_aqui

**Parâmetros de Caminho:**
- `status`: O status de pagamento para filtrar (ex: "PAID", "PENDING", "PROCESSING", "CANCELED")

**Parâmetros de Consulta:**
- `limit`: Número máximo de registros a retornar (padrão: 100)
- `offset`: Número de registros a ignorar (padrão: 0)

**Exemplo de Resposta (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "status": "PAID",
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Compra de produto",
      "status": "PAID",
      "customerName": "João Silva",
      "customerEmail": "joao@exemplo.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "usuario123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    }
  ]
}
```

### Pagamentos por Usuário

#### Obter Pagamentos do Usuário

Recupera registros de pagamento para um usuário específico.

**Endpoint:** `GET /user/:userId`

**Cabeçalhos da Requisição:**
- x-system-key: sua_chave_segura_de_sistema_aqui

**Parâmetros de Caminho:**
- `userId`: O ID do usuário para filtrar pagamentos

**Parâmetros de Consulta:**
- `limit`: Número máximo de registros a retornar (padrão: 100)
- `offset`: Número de registros a ignorar (padrão: 0)

**Exemplo de Resposta (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "payments": [
    {
      "referenceId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 100.50,
      "description": "Compra de produto",
      "status": "PAID",
      "customerName": "João Silva",
      "customerEmail": "joao@exemplo.com",
      "customerDocument": "123.456.789-01",
      "customerUserId": "usuario123",
      "paymentMethod": "CREDIT_CARD",
      "paymentUrl": "https://sandbox.api.pagseguro.com/charges/CHARGE_123456789/receipt",
      "createdAt": "2025-05-11T21:09:00.000Z",
      "updatedAt": "2025-05-11T21:15:00.000Z"
    }
  ]
}
```

## Webhooks

### Manipulador de Webhook de Pagamento

A API fornece um endpoint de webhook para receber atualizações de status de pagamento do PagBank.

**Endpoint:** `POST /webhook`

**Observação:** Este endpoint NÃO requer o cabeçalho de chave do sistema, pois é chamado pelo PagBank.

**Exemplo de Corpo da Requisição:**
```json
{
  "id": "charge_123456789",
  "reference_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PAID"
}
```

**Exemplo de Resposta (200 OK):**
```json
{
  "success": true
}
```

## Tratamento de Erros

A API retorna códigos de status HTTP apropriados e mensagens de erro em JSON:

### Respostas de Erro Comuns

**400 Bad Request:**
```json
{
  "error": "Invalid amount",
  "message": "Amount must be greater than zero"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing system key"
}
```

**404 Not Found:**
```json
{
  "error": "Payment not found",
  "message": "No payment with reference ID 550e8400-e29b-41d4-a716-446655440000"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create payment",
  "message": "PagBank API error: 400 - Invalid payment information"
}
```

## Códigos de Status

A API padroniza os status de pagamento para facilitar a integração:

- **PAID**: O pagamento foi recebido e confirmado
- **PROCESSING**: O pagamento está sendo processado ou aguardando confirmação
- **CANCELED**: O pagamento foi cancelado, recusado ou reembolsado

Status brutos do PagBank são mapeados para esses status padronizados para consistência.

## Exemplos de Requisições

### Criar um Pagamento com Cartão de Crédito (com cURL)

```bash
curl -X POST http://localhost:3000/api/payments/credit-card \
  -H "Content-Type: application/json" \
  -H "x-system-key: sua_chave_segura_de_sistema_aqui" \
  -d '{
    "amount": 100.50,
    "description": "Compra de produto",
    "customerName": "João Silva",
    "customerEmail": "joao@exemplo.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "usuario123",
    "card": {
      "number": "4111111111111111",
      "expMonth": "12",
      "expYear": "2025",
      "securityCode": "123",
      "holderName": "JOAO SILVA"
    }
  }'
```

### Criar um Pagamento PIX (com cURL)

```bash
curl -X POST http://localhost:3000/api/payments/pix \
  -H "Content-Type: application/json" \
  -H "x-system-key: sua_chave_segura_de_sistema_aqui" \
  -d '{
    "amount": 100.50,
    "description": "Compra de produto",
    "customerName": "João Silva",
    "customerEmail": "joao@exemplo.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "usuario123",
    "expirationHours": 24
  }'
```

### Criar um Checkout PagBank (com cURL)

```bash
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Content-Type: application/json" \
  -H "x-system-key: sua_chave_segura_de_sistema_aqui" \
  -d '{
    "amount": 100.50,
    "description": "Compra de produto",
    "customerName": "João Silva",
    "customerEmail": "joao@exemplo.com",
    "customerDocument": "123.456.789-01",
    "customerUserId": "usuario123",
    "enabledTypes": ["CREDIT_CARD", "PIX"]
  }'
```

### Verificar Status de Pagamento (com cURL)

```bash
curl -X GET http://localhost:3000/api/payments/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-system-key: sua_chave_segura_de_sistema_aqui"
```