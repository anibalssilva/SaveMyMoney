import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração da página
st.set_page_config(
    page_title="💰 SaveMyMoney - Gráficos Dinâmicos",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilo CSS customizado (tema cyber)
st.markdown("""
<style>
    .main {
        background-color: #0f0f23;
    }
    .stApp {
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
    }
    h1, h2, h3 {
        color: #00f0ff;
        font-weight: 800;
    }
    .stMetric {
        background-color: rgba(26, 26, 46, 0.6);
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid rgba(0, 240, 255, 0.3);
    }
    .stSelectbox label, .stMultiSelect label, .stDateInput label, .stRadio label {
        color: #00f0ff !important;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# Conexão com MongoDB
@st.cache_resource
def init_connection():
    """Inicializa conexão com MongoDB"""
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/savemymoney')
    return MongoClient(mongo_uri)

@st.cache_data(ttl=60)
def load_data():
    """Carrega transações do MongoDB"""
    client = init_connection()
    db = client.savemymoney
    transactions = list(db.transactions.find())

    # Converter ObjectId para string e processar dados
    for t in transactions:
        t['_id'] = str(t['_id'])
        if 'date' in t:
            t['date'] = pd.to_datetime(t['date'])

    df = pd.DataFrame(transactions)

    if not df.empty:
        # Adicionar colunas auxiliares
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['month_name'] = df['date'].dt.strftime('%B')
        df['weekday'] = df['date'].dt.day_name()
        df['quarter'] = df['date'].dt.quarter

        # Criar coluna de período (mês/ano)
        df['period'] = df['date'].dt.strftime('%m/%Y')

    return df

# Título principal
st.title("📊 Gráficos Dinâmicos - SaveMyMoney")
st.markdown("### Crie visualizações personalizadas dos seus dados financeiros")

# Carregar dados
try:
    df = load_data()

    if df.empty:
        st.warning("⚠️ Nenhuma transação encontrada no banco de dados.")
        st.stop()

    # Sidebar - Filtros
    st.sidebar.header("🔍 Filtros")

    # Botão para limpar filtros
    if st.sidebar.button("🔄 Limpar Todos os Filtros", use_container_width=True):
        st.rerun()

    st.sidebar.markdown("---")

    # Filtro de Tipo de Transação
    transaction_types = st.sidebar.multiselect(
        "Tipo de Transação",
        options=df['type'].unique().tolist(),
        default=df['type'].unique().tolist(),
        help="Selecione Receita ou Despesa"
    )

    # Mostrar aviso se receitas não estiverem selecionadas
    if 'income' not in transaction_types:
        st.sidebar.warning("⚠️ Tipo 'income' não selecionado - Receitas não serão exibidas!")

    # Filtro de Categorias
    income_cats = df[df['type'] == 'income']['category'].dropna().unique().tolist()
    expense_cats = df[df['type'] == 'expense']['category'].dropna().unique().tolist()

    # Mostrar informação sobre categorias disponíveis
    st.sidebar.markdown(f"**Categorias disponíveis:**")
    if 'income' in transaction_types and income_cats:
        st.sidebar.markdown(f"💰 Receitas: {len(income_cats)} categorias")
    if 'expense' in transaction_types and expense_cats:
        st.sidebar.markdown(f"💸 Despesas: {len(expense_cats)} categorias")

    available_categories = df[df['type'].isin(transaction_types)]['category'].dropna().unique().tolist()
    selected_categories = st.sidebar.multiselect(
        "Categorias",
        options=sorted(available_categories),
        default=available_categories,
        help="Selecione uma ou mais categorias (receitas e despesas)"
    )

    # Mostrar quais categorias de receita foram selecionadas
    if 'income' in transaction_types:
        income_selected = [c for c in selected_categories if c in income_cats]
        if not income_selected:
            st.sidebar.error("❌ Nenhuma categoria de RECEITA selecionada! Receitas não aparecerão.")

    # Filtro de Subcategorias (baseado nas categorias selecionadas)
    if selected_categories:
        available_subcategories = df[
            (df['type'].isin(transaction_types)) &
            (df['category'].isin(selected_categories))
        ]['subcategory'].dropna().unique().tolist()

        selected_subcategories = st.sidebar.multiselect(
            "Subcategorias",
            options=sorted(available_subcategories),
            default=available_subcategories,
            help="Selecione uma ou mais subcategorias"
        )
    else:
        selected_subcategories = []

    # Filtro de Método de Pagamento
    payment_methods = df['paymentMethod'].dropna().unique().tolist()
    selected_payment_methods = st.sidebar.multiselect(
        "Método de Pagamento",
        options=sorted(payment_methods),
        default=payment_methods,
        help="Selecione os métodos de pagamento"
    )

    # Filtro de Período
    st.sidebar.subheader("📅 Período")

    filter_type = st.sidebar.radio(
        "Tipo de Filtro",
        options=["Data Específica", "Mês/Ano", "Intervalo de Datas", "Todos"],
        help="Escolha como filtrar as datas"
    )

    # Aplicar filtro de período baseado na seleção
    if filter_type == "Data Específica":
        # Usar ontem como padrão (dia anterior)
        yesterday = datetime.now() - timedelta(days=1)
        selected_date = st.sidebar.date_input(
            "Selecione a Data",
            value=yesterday,
            min_value=df['date'].min().date(),
            max_value=df['date'].max().date(),
            format="DD/MM/YYYY"
        )
        df_filtered = df[df['date'].dt.date == selected_date]

    elif filter_type == "Mês/Ano":
        col1, col2 = st.sidebar.columns(2)
        with col1:
            selected_month = st.selectbox(
                "Mês",
                options=list(range(1, 13)),
                format_func=lambda x: datetime(2000, x, 1).strftime('%B')
            )
        with col2:
            selected_year = st.selectbox(
                "Ano",
                options=sorted(df['year'].unique().tolist(), reverse=True)
            )

        df_filtered = df[(df['month'] == selected_month) & (df['year'] == selected_year)]

    elif filter_type == "Intervalo de Datas":
        col1, col2 = st.sidebar.columns(2)
        with col1:
            start_date = st.date_input(
                "De",
                value=df['date'].min().date(),
                min_value=df['date'].min().date(),
                max_value=df['date'].max().date(),
                format="DD/MM/YYYY"
            )
        with col2:
            end_date = st.date_input(
                "Até",
                value=df['date'].max().date(),
                min_value=df['date'].min().date(),
                max_value=df['date'].max().date(),
                format="DD/MM/YYYY"
            )

        df_filtered = df[(df['date'].dt.date >= start_date) & (df['date'].dt.date <= end_date)]

    else:  # Todos
        df_filtered = df.copy()

    # Aplicar demais filtros
    # Para receitas (income), não aplicar filtro de categoria se ela estiver vazia
    # Para despesas (expense), aplicar filtro de categoria normalmente
    mask_type = df_filtered['type'].isin(transaction_types)

    # Criar máscara para categoria: incluir se for receita OU se categoria está na lista
    mask_category = (
        (df_filtered['type'] == 'income') |  # Incluir todas as receitas
        (df_filtered['category'].isin(selected_categories))  # OU categoria selecionada
    )

    df_filtered = df_filtered[mask_type & mask_category]

    # Filtro de subcategoria (apenas se houver seleção)
    if selected_subcategories:
        # Para receitas, não aplicar filtro de subcategoria se estiver vazio
        mask_subcat = (
            (df_filtered['type'] == 'income') |
            (df_filtered['subcategory'].isin(selected_subcategories))
        )
        df_filtered = df_filtered[mask_subcat]

    # Filtro de método de pagamento
    if selected_payment_methods:
        # Para receitas, não aplicar filtro de método de pagamento
        mask_payment = (
            (df_filtered['type'] == 'income') |
            (df_filtered['paymentMethod'].isin(selected_payment_methods))
        )
        df_filtered = df_filtered[mask_payment]

    # Verificar se há dados após filtragem
    if df_filtered.empty:
        st.warning("⚠️ Nenhuma transação encontrada com os filtros selecionados.")
        st.stop()

    # Seção de Métricas
    st.markdown("---")
    col1, col2, col3, col4 = st.columns(4)

    total_income = df_filtered[df_filtered['type'] == 'income']['amount'].sum()
    total_expense = df_filtered[df_filtered['type'] == 'expense']['amount'].sum()
    balance = total_income - total_expense
    transaction_count = len(df_filtered)

    with col1:
        st.metric("💰 Receitas", f"R$ {total_income:,.2f}", f"{len(df_filtered[df_filtered['type'] == 'income'])} transações")

    with col2:
        st.metric("💸 Despesas", f"R$ {total_expense:,.2f}", f"{len(df_filtered[df_filtered['type'] == 'expense'])} transações")

    with col3:
        delta_color = "normal" if balance >= 0 else "inverse"
        st.metric("📈 Saldo", f"R$ {balance:,.2f}", delta_color=delta_color)

    with col4:
        st.metric("📊 Total de Transações", transaction_count)

    st.markdown("---")

    # Seção de Gráficos Customizáveis
    st.header("📈 Visualizações Personalizadas")

    # Seletor de tipo de gráfico
    chart_type = st.selectbox(
        "Selecione o Tipo de Gráfico",
        options=[
            "Barras - Categorias",
            "Barras - Subcategorias",
            "Barras - Período (Dia/Mês/Ano)",
            "Linhas - Evolução Temporal",
            "Pizza - Distribuição por Categoria",
            "Pizza - Distribuição por Subcategoria",
            "Scatter - Valor vs Data",
            "Funil - Categorias Ordenadas",
            "Treemap - Hierarquia de Gastos",
            "Heatmap - Gastos por Dia da Semana/Mês"
        ],
        help="Escolha o tipo de visualização"
    )

    # Gerar gráficos baseado na seleção
    if "Barras - Categorias" in chart_type:
        st.subheader("📊 Gastos por Categoria")

        group_by = st.radio("Agrupar por", ["Categoria", "Tipo"], horizontal=True)

        if group_by == "Categoria":
            chart_data = df_filtered.groupby('category')['amount'].sum().sort_values(ascending=False).reset_index()
            fig = px.bar(
                chart_data,
                x='category',
                y='amount',
                title='Total por Categoria',
                labels={'category': 'Categoria', 'amount': 'Valor (R$)'},
                color='amount',
                color_continuous_scale='Turbo'
            )
        else:
            chart_data = df_filtered.groupby(['category', 'type'])['amount'].sum().reset_index()
            fig = px.bar(
                chart_data,
                x='category',
                y='amount',
                color='type',
                title='Total por Categoria e Tipo',
                labels={'category': 'Categoria', 'amount': 'Valor (R$)', 'type': 'Tipo'},
                barmode='group',
                color_discrete_map={'income': '#10b981', 'expense': '#ef4444'}
            )

        fig.update_layout(height=500, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Barras - Subcategorias" in chart_type:
        st.subheader("📊 Gastos por Subcategoria")

        chart_data = df_filtered.groupby(['category', 'subcategory'])['amount'].sum().sort_values(ascending=False).reset_index()
        chart_data = chart_data.head(20)  # Top 20

        fig = px.bar(
            chart_data,
            x='subcategory',
            y='amount',
            color='category',
            title='Top 20 Subcategorias',
            labels={'subcategory': 'Subcategoria', 'amount': 'Valor (R$)', 'category': 'Categoria'},
            color_discrete_sequence=px.colors.qualitative.Vivid
        )

        fig.update_layout(height=500, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Barras - Período" in chart_type:
        st.subheader("📊 Gastos por Período")

        period_type = st.radio("Agrupar por", ["Dia", "Mês", "Ano", "Trimestre"], horizontal=True)

        if period_type == "Dia":
            chart_data = df_filtered.groupby(df_filtered['date'].dt.date)['amount'].sum().reset_index()
            chart_data.columns = ['date', 'amount']
            x_label = 'Data'
        elif period_type == "Mês":
            chart_data = df_filtered.groupby('period')['amount'].sum().reset_index()
            x_label = 'Mês/Ano'
        elif period_type == "Ano":
            chart_data = df_filtered.groupby('year')['amount'].sum().reset_index()
            chart_data.columns = ['year', 'amount']
            x_label = 'Ano'
        else:  # Trimestre
            chart_data = df_filtered.groupby(['year', 'quarter'])['amount'].sum().reset_index()
            chart_data['period'] = chart_data['year'].astype(str) + '-Q' + chart_data['quarter'].astype(str)
            chart_data = chart_data[['period', 'amount']]
            x_label = 'Trimestre'

        fig = px.bar(
            chart_data,
            x=chart_data.columns[0],
            y='amount',
            title=f'Total por {period_type}',
            labels={chart_data.columns[0]: x_label, 'amount': 'Valor (R$)'},
            color='amount',
            color_continuous_scale='Blues'
        )

        fig.update_layout(height=500, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Linhas - Evolução" in chart_type:
        st.subheader("📈 Evolução Temporal")

        metric_option = st.radio(
            "Métrica",
            ["Saldo Acumulado", "Receitas e Despesas", "Saldo Diário"],
            horizontal=True
        )

        df_sorted = df_filtered.sort_values('date')

        if metric_option == "Saldo Acumulado":
            df_sorted['cumulative_income'] = df_sorted[df_sorted['type'] == 'income']['amount'].cumsum().fillna(method='ffill').fillna(0)
            df_sorted['cumulative_expense'] = df_sorted[df_sorted['type'] == 'expense']['amount'].cumsum().fillna(method='ffill').fillna(0)
            df_sorted['cumulative_balance'] = df_sorted['cumulative_income'] - df_sorted['cumulative_expense']

            fig = px.line(
                df_sorted,
                x='date',
                y='cumulative_balance',
                title='Saldo Acumulado ao Longo do Tempo',
                labels={'date': 'Data', 'cumulative_balance': 'Saldo Acumulado (R$)'},
                markers=True
            )

        elif metric_option == "Receitas e Despesas":
            daily_data = df_filtered.groupby(['date', 'type'])['amount'].sum().reset_index()

            fig = px.line(
                daily_data,
                x='date',
                y='amount',
                color='type',
                title='Receitas e Despesas ao Longo do Tempo',
                labels={'date': 'Data', 'amount': 'Valor (R$)', 'type': 'Tipo'},
                markers=True,
                color_discrete_map={'income': '#10b981', 'expense': '#ef4444'}
            )

        else:  # Saldo Diário
            daily_income = df_filtered[df_filtered['type'] == 'income'].groupby('date')['amount'].sum()
            daily_expense = df_filtered[df_filtered['type'] == 'expense'].groupby('date')['amount'].sum()
            daily_balance = (daily_income - daily_expense).reset_index()
            daily_balance.columns = ['date', 'balance']

            fig = px.line(
                daily_balance,
                x='date',
                y='balance',
                title='Saldo Diário',
                labels={'date': 'Data', 'balance': 'Saldo (R$)'},
                markers=True
            )

        fig.update_layout(height=500, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Pizza - Distribuição por Categoria" in chart_type:
        st.subheader("🥧 Distribuição por Categoria")

        chart_data = df_filtered.groupby('category')['amount'].sum().reset_index()

        fig = px.pie(
            chart_data,
            values='amount',
            names='category',
            title='Distribuição de Gastos por Categoria',
            hole=0.4,
            color_discrete_sequence=px.colors.qualitative.Set3
        )

        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(height=600, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Pizza - Distribuição por Subcategoria" in chart_type:
        st.subheader("🥧 Distribuição por Subcategoria")

        chart_data = df_filtered.groupby('subcategory')['amount'].sum().sort_values(ascending=False).head(10).reset_index()

        fig = px.pie(
            chart_data,
            values='amount',
            names='subcategory',
            title='Top 10 Subcategorias',
            hole=0.4,
            color_discrete_sequence=px.colors.qualitative.Pastel
        )

        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(height=600, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Scatter - Valor vs Data" in chart_type:
        st.subheader("🔵 Dispersão: Valor vs Data")

        color_by = st.radio("Colorir por", ["Tipo", "Categoria", "Método de Pagamento"], horizontal=True)

        color_map = {
            "Tipo": ('type', {'income': '#10b981', 'expense': '#ef4444'}),
            "Categoria": ('category', None),
            "Método de Pagamento": ('paymentMethod', None)
        }

        color_col, color_discrete_map = color_map[color_by]

        fig = px.scatter(
            df_filtered,
            x='date',
            y='amount',
            color=color_col,
            size='amount',
            hover_data=['description', 'category', 'subcategory'],
            title='Dispersão de Transações',
            labels={'date': 'Data', 'amount': 'Valor (R$)', color_col: color_by},
            color_discrete_map=color_discrete_map
        )

        fig.update_layout(height=600, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Funil - Categorias" in chart_type:
        st.subheader("🔻 Funil de Categorias")

        chart_data = df_filtered.groupby('category')['amount'].sum().sort_values(ascending=False).head(10).reset_index()

        fig = go.Figure(go.Funnel(
            y=chart_data['category'],
            x=chart_data['amount'],
            textinfo="value+percent initial",
            marker={"color": px.colors.sequential.Turbo}
        ))

        fig.update_layout(
            title='Top 10 Categorias - Funil',
            height=600,
            template='plotly_dark'
        )
        st.plotly_chart(fig, use_container_width=True)

    elif "Treemap - Hierarquia" in chart_type:
        st.subheader("🗂️ Hierarquia de Gastos")

        chart_data = df_filtered.groupby(['category', 'subcategory'])['amount'].sum().reset_index()

        fig = px.treemap(
            chart_data,
            path=['category', 'subcategory'],
            values='amount',
            title='Hierarquia: Categoria → Subcategoria',
            color='amount',
            color_continuous_scale='RdYlGn_r'
        )

        fig.update_layout(height=600, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    elif "Heatmap" in chart_type:
        st.subheader("🔥 Heatmap de Gastos")

        df_filtered['weekday_num'] = df_filtered['date'].dt.dayofweek
        df_filtered['week'] = df_filtered['date'].dt.isocalendar().week

        heatmap_data = df_filtered.groupby(['weekday', 'month_name'])['amount'].sum().reset_index()
        heatmap_pivot = heatmap_data.pivot(index='weekday', columns='month_name', values='amount').fillna(0)

        # Ordenar dias da semana
        weekday_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_pivot = heatmap_pivot.reindex(weekday_order)

        fig = px.imshow(
            heatmap_pivot,
            title='Gastos por Dia da Semana e Mês',
            labels={'x': 'Mês', 'y': 'Dia da Semana', 'color': 'Valor (R$)'},
            color_continuous_scale='YlOrRd',
            aspect='auto'
        )

        fig.update_layout(height=500, template='plotly_dark')
        st.plotly_chart(fig, use_container_width=True)

    # Tabela de dados filtrados
    st.markdown("---")
    st.subheader("📋 Dados Filtrados")

    if st.checkbox("Mostrar tabela de transações"):
        display_columns = ['date', 'description', 'type', 'category', 'subcategory', 'amount', 'paymentMethod']
        display_df = df_filtered[display_columns].sort_values('date', ascending=False)

        st.dataframe(
            display_df.style.format({'amount': 'R$ {:.2f}'}),
            use_container_width=True,
            height=400
        )

        # Botão de download
        csv = display_df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Download CSV",
            data=csv,
            file_name=f"transacoes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )

except Exception as e:
    st.error(f"❌ Erro ao carregar dados: {str(e)}")
    st.exception(e)

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #00f0ff; padding: 1rem;'>
        💰 SaveMyMoney - Gráficos Dinâmicos | Desenvolvido com Streamlit
    </div>
    """,
    unsafe_allow_html=True
)
