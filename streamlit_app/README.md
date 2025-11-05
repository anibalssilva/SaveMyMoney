# 📊 SaveMyMoney - Gráficos Dinâmicos

Aplicação Streamlit para análise visual e customizável das suas finanças.

## 🚀 Recursos

### Filtros Interativos
- ✅ **Tipo de Transação**: Receitas, Despesas ou ambos
- ✅ **Categorias**: Selecione múltiplas categorias
- ✅ **Subcategorias**: Filtre por subcategorias específicas
- ✅ **Métodos de Pagamento**: PIX, Crédito, Débito, Dinheiro, etc.
- ✅ **Período**:
  - Data específica
  - Mês/Ano
  - Intervalo de datas
  - Todos os dados

### Tipos de Gráficos Disponíveis

1. **📊 Barras - Categorias**: Visualize gastos agrupados por categoria ou tipo
2. **📊 Barras - Subcategorias**: Top 20 subcategorias mais relevantes
3. **📊 Barras - Período**: Agrupe por dia, mês, ano ou trimestre
4. **📈 Linhas - Evolução Temporal**: Acompanhe saldo acumulado, receitas/despesas ou saldo diário
5. **🥧 Pizza - Categoria**: Distribuição percentual por categoria
6. **🥧 Pizza - Subcategoria**: Top 10 subcategorias em formato pizza
7. **🔵 Scatter - Valor vs Data**: Dispersão de transações coloridas por tipo/categoria/método
8. **🔻 Funil**: Top 10 categorias em formato funil
9. **🗂️ Treemap**: Hierarquia categoria → subcategoria
10. **🔥 Heatmap**: Gastos por dia da semana vs mês

### Funcionalidades Extras
- 📋 **Tabela de Dados**: Visualize as transações filtradas em formato tabela
- 📥 **Download CSV**: Exporte os dados filtrados para análise externa
- 📊 **Métricas em Tempo Real**: Cards com receitas, despesas, saldo e total de transações

## 📦 Instalação

### 1. Instalar Dependências

```bash
cd streamlit_app
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `streamlit_app/` com a URL do MongoDB:

```env
MONGO_URI=mongodb://localhost:27017/savemymoney
```

Ou use a mesma variável de ambiente do projeto principal.

### 3. Rodar a Aplicação

```bash
streamlit run app.py
```

A aplicação será aberta automaticamente no navegador em `http://localhost:8501`

## 🎨 Tema Cyber

A aplicação usa o mesmo tema cyber-futurista da aplicação principal:
- Fundo escuro (#0f0f23)
- Destaque em cyan (#00f0ff)
- Gráficos em modo dark com cores vibrantes

## 🔧 Requisitos

- Python 3.8+
- MongoDB rodando (mesma instância do SaveMyMoney)
- Dependências listadas em `requirements.txt`:
  - streamlit
  - pymongo
  - pandas
  - plotly
  - python-dotenv
  - dnspython

## 📖 Como Usar

1. **Selecione os Filtros** na barra lateral esquerda
2. **Escolha o Tipo de Gráfico** no menu dropdown principal
3. **Personalize** as opções adicionais (agrupamento, métricas, etc.)
4. **Visualize** seus dados financeiros de forma interativa
5. **Exporte** os dados filtrados em CSV se necessário

## 🎯 Exemplos de Uso

### Análise Mensal de Gastos
1. Filtro: Selecione "Mês/Ano" e escolha o mês desejado
2. Tipo: Selecione apenas "Despesas"
3. Gráfico: "Barras - Categorias"
4. Resultado: Visualize as categorias com mais gastos no mês

### Evolução do Saldo
1. Filtro: "Intervalo de Datas" com período de 6 meses
2. Tipo: "Receitas" e "Despesas"
3. Gráfico: "Linhas - Evolução Temporal" → "Saldo Acumulado"
4. Resultado: Acompanhe como seu saldo evoluiu ao longo do tempo

### Distribuição de Gastos por Categoria
1. Filtro: "Todos" os períodos
2. Tipo: Apenas "Despesas"
3. Gráfico: "Pizza - Distribuição por Categoria"
4. Resultado: Veja em percentual onde você mais gasta

## 🐛 Troubleshooting

### Erro de Conexão com MongoDB
- Verifique se o MongoDB está rodando
- Confirme se a URL no `.env` está correta
- Teste a conexão: `mongosh mongodb://localhost:27017/savemymoney`

### Gráficos não aparecem
- Certifique-se de que há transações no banco de dados
- Verifique se os filtros não estão muito restritivos
- Recarregue a página (R ou F5)

### Dados não atualizam
- Use o botão "Clear cache" no menu do Streamlit (canto superior direito)
- Ou pressione Ctrl+Shift+R para recarregar com cache limpo

## 🤝 Integração com SaveMyMoney

Esta aplicação se conecta ao mesmo banco MongoDB do SaveMyMoney principal. Não é necessário sincronizar dados - tudo é lido em tempo real (com cache de 60 segundos para performance).

## 📝 Licença

Parte do projeto SaveMyMoney.
