"""EDA app for the MoMA art collection dataset."""

import re
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

DATA_PATH = Path(__file__).parent / "data" / "Artworks.csv"

# --- palette (validated categorical order + sequential/diverging ramps) ---
CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"]
SEQUENTIAL_BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]
DIVERGING = [[0.0, "#e34948"], [0.5, "#f0efec"], [1.0, "#2a78d6"]]
INK_PRIMARY = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
SURFACE = "#fcfcfb"

st.set_page_config(page_title="MoMA Collection EDA", layout="wide")


def style_fig(fig: go.Figure, *, showlegend: bool = False) -> go.Figure:
    fig.update_layout(
        paper_bgcolor=SURFACE,
        plot_bgcolor=SURFACE,
        font=dict(family="system-ui, -apple-system, 'Segoe UI', sans-serif", color=INK_SECONDARY, size=13),
        title=dict(text=fig.layout.title.text or "", font=dict(color=INK_PRIMARY, size=16)),
        margin=dict(l=10, r=10, t=50, b=10),
        showlegend=showlegend,
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=INK_SECONDARY)),
        hoverlabel=dict(bgcolor="white", font=dict(color=INK_PRIMARY)),
    )
    fig.update_xaxes(gridcolor=GRIDLINE, linecolor=GRIDLINE, tickfont=dict(color=INK_MUTED), zeroline=False)
    fig.update_yaxes(gridcolor=GRIDLINE, linecolor=GRIDLINE, tickfont=dict(color=INK_MUTED), zeroline=False)
    return fig


def first_paren_value(raw: str) -> str:
    if not isinstance(raw, str):
        return "Unknown"
    for group in re.findall(r"\(([^)]*)\)", raw):
        group = group.strip()
        if group:
            return group.title()
    return "Unknown"


YEAR_RE = re.compile(r"(1[5-9]\d{2}|20[0-2]\d)")


def extract_year(raw: str):
    if not isinstance(raw, str):
        return None
    match = YEAR_RE.search(raw)
    return int(match.group(1)) if match else None


@st.cache_data(show_spinner="Loading and cleaning the MoMA collection dataset...")
def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, low_memory=False)

    df["Gender_Primary"] = df["Gender"].apply(first_paren_value)
    df["Nationality_Primary"] = df["Nationality"].apply(first_paren_value)
    df["CreationYear"] = df["Date"].apply(extract_year)

    df["DateAcquired"] = pd.to_datetime(df["DateAcquired"], errors="coerce")
    df["AcquiredYear"] = df["DateAcquired"].dt.year

    df["Department"] = df["Department"].fillna("Unknown")
    df["Classification"] = df["Classification"].fillna("Unknown").replace("(not assigned)", "Unknown")
    df["Artist"] = df["Artist"].fillna("Unknown")

    return df


df = load_data()

st.title("MoMA Art Collection — Exploratory Data Analysis")
st.caption(
    f"{len(df):,} artworks from The Museum of Modern Art's public collection dataset. "
    "Use the filters in the sidebar to explore a subset."
)

# ----------------------------- sidebar filters -----------------------------
st.sidebar.header("Filters")

departments = sorted(df["Department"].unique())
sel_departments = st.sidebar.multiselect("Department", departments, default=[])

classifications = df["Classification"].value_counts().index.tolist()
sel_classifications = st.sidebar.multiselect("Classification", classifications, default=[])

genders = sorted(df["Gender_Primary"].unique())
sel_genders = st.sidebar.multiselect("Artist gender", genders, default=[])

top_nationalities = df["Nationality_Primary"].value_counts().head(30).index.tolist()
sel_nationalities = st.sidebar.multiselect(
    "Nationality (top 30 shown)", top_nationalities, default=[]
)

year_min, year_max = int(df["CreationYear"].min()), int(df["CreationYear"].max())
sel_year_range = st.sidebar.slider(
    "Creation year", min_value=year_min, max_value=year_max, value=(year_min, year_max)
)

st.sidebar.caption("Rows with an unrecognized creation year are excluded once this filter is touched.")

mask = pd.Series(True, index=df.index)
if sel_departments:
    mask &= df["Department"].isin(sel_departments)
if sel_classifications:
    mask &= df["Classification"].isin(sel_classifications)
if sel_genders:
    mask &= df["Gender_Primary"].isin(sel_genders)
if sel_nationalities:
    mask &= df["Nationality_Primary"].isin(sel_nationalities)
if sel_year_range != (year_min, year_max):
    mask &= df["CreationYear"].between(*sel_year_range)

fdf = df[mask]

if fdf.empty:
    st.warning("No artworks match the current filters. Adjust the filters in the sidebar.")
    st.stop()

# ----------------------------- KPI row -----------------------------
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Artworks", f"{len(fdf):,}")
c2.metric("Artists", f"{fdf['Artist'].nunique():,}")
c3.metric("Departments", f"{fdf['Department'].nunique():,}")
c4.metric("Classifications", f"{fdf['Classification'].nunique():,}")
year_span = fdf["CreationYear"].dropna()
c5.metric("Creation year span", f"{int(year_span.min())}–{int(year_span.max())}" if not year_span.empty else "N/A")

tab_overview, tab_categories, tab_mediums, tab_artists, tab_time, tab_dimensions, tab_explorer = st.tabs(
    ["Overview", "Categories", "Mediums", "Artists & Nationality", "Time Trends", "Dimensions", "Data Explorer"]
)

# ----------------------------- Overview tab -----------------------------
with tab_overview:
    st.subheader("Collection composition")
    top_classes = fdf["Classification"].value_counts().head(9).index
    tree_df = fdf.assign(
        ClassGroup=fdf["Classification"].where(fdf["Classification"].isin(top_classes), "Other")
    )
    grouped = tree_df.groupby(["Department", "ClassGroup"]).size().reset_index(name="Count")
    grouped = grouped[grouped["Count"] > 0]

    fig = px.treemap(
        grouped, path=["Department", "ClassGroup"], values="Count",
        color="Department", color_discrete_sequence=CATEGORICAL,
    )
    fig.update_traces(
        hovertemplate="%{label}<br>%{value:,} artworks<extra></extra>",
        marker=dict(line=dict(color=SURFACE, width=2)),
    )
    st.plotly_chart(style_fig(fig), width="stretch")
    st.caption(
        "Box size = number of artworks. Each department (outer color) is split into its most "
        "common classifications; rarer ones are grouped as \"Other\"."
    )

    st.subheader("Numeric dimension summary")
    dim_cols = ["Height (cm)", "Width (cm)", "Depth (cm)", "Weight (kg)"]
    st.dataframe(fdf[dim_cols].describe().T.style.format("{:.1f}"), width="stretch")

# ----------------------------- Categories tab -----------------------------
with tab_categories:
    left, right = st.columns(2)

    with left:
        st.subheader("Artworks by department")
        counts = fdf["Department"].value_counts().sort_values(ascending=True)
        fig = go.Figure(go.Bar(
            x=counts.values, y=counts.index, orientation="h",
            marker_color=SEQUENTIAL_BLUE[3],
            hovertemplate="%{y}: %{x:,} artworks<extra></extra>",
        ))
        fig.update_layout(xaxis_title="Artworks", yaxis_title="")
        st.plotly_chart(style_fig(fig), width="stretch")
        with st.expander("View as table"):
            st.dataframe(counts.sort_values(ascending=False).rename("Artworks"), width="stretch")

    with right:
        st.subheader("Top 15 classifications")
        counts = fdf["Classification"].value_counts().head(15).sort_values(ascending=True)
        fig = go.Figure(go.Bar(
            x=counts.values, y=counts.index, orientation="h",
            marker_color=SEQUENTIAL_BLUE[3],
            hovertemplate="%{y}: %{x:,} artworks<extra></extra>",
        ))
        fig.update_layout(xaxis_title="Artworks", yaxis_title="")
        st.plotly_chart(style_fig(fig), width="stretch")
        with st.expander("View as table"):
            st.dataframe(counts.sort_values(ascending=False).rename("Artworks"), width="stretch")

    st.subheader("Gender composition of the top 6 departments")
    top_depts = fdf["Department"].value_counts().head(6).index.tolist()
    cross = (
        fdf[fdf["Department"].isin(top_depts)]
        .groupby(["Department", "Gender_Primary"]).size().rename("Count").reset_index()
    )
    gender_order = fdf["Gender_Primary"].value_counts().index.tolist()[:8]
    fig = go.Figure()
    for i, gender in enumerate(gender_order):
        sub = cross[cross["Gender_Primary"] == gender]
        fig.add_bar(
            name=gender,
            y=sub["Department"], x=sub["Count"], orientation="h",
            marker_color=CATEGORICAL[i % len(CATEGORICAL)],
            hovertemplate=f"{gender} — " + "%{y}: %{x:,}<extra></extra>",
        )
    fig.update_layout(barmode="stack", xaxis_title="Artworks", yaxis_title="", legend_title_text="Gender")
    st.plotly_chart(style_fig(fig, showlegend=True), width="stretch")

# ----------------------------- Mediums tab -----------------------------
with tab_mediums:
    st.subheader("Top 20 mediums by number of works")
    counts = fdf["Medium"].dropna().value_counts().head(20).sort_values(ascending=True)
    fig = go.Figure(go.Bar(
        x=counts.values, y=counts.index, orientation="h",
        marker_color=SEQUENTIAL_BLUE[3],
        hovertemplate="%{y}: %{x:,} artworks<extra></extra>",
    ))
    fig.update_layout(xaxis_title="Artworks", yaxis_title="")
    st.plotly_chart(style_fig(fig), width="stretch")
    with st.expander("View as table"):
        st.dataframe(counts.sort_values(ascending=False).rename("Artworks"), width="stretch")

    st.subheader("Growing diversity of mediums over time")
    medium_df = fdf.dropna(subset=["Medium", "CreationYear"]).copy()
    medium_df["Decade"] = (medium_df["CreationYear"] // 10 * 10).astype(int)
    decade_stats = medium_df.groupby("Decade").agg(
        distinct_mediums=("Medium", "nunique"),
        artworks=("Medium", "size"),
    )
    decade_stats = decade_stats[decade_stats["artworks"] >= 20]
    fig = go.Figure(go.Scatter(
        x=decade_stats.index, y=decade_stats["distinct_mediums"], mode="lines+markers",
        line=dict(color=SEQUENTIAL_BLUE[4], width=2), marker=dict(size=6),
        hovertemplate="%{x}s: %{y:,} distinct mediums<extra></extra>",
    ))
    fig.update_layout(xaxis_title="Decade created", yaxis_title="Distinct mediums used")
    st.plotly_chart(style_fig(fig), width="stretch")
    st.caption(
        "Distinct exact Medium text values per decade (decades with fewer than 20 dated, "
        "medium-tagged artworks omitted). Reflects both real material diversity and "
        "increasingly detailed cataloging in later decades."
    )

# ----------------------------- Artists & Nationality tab -----------------------------
with tab_artists:
    left, right = st.columns(2)

    with left:
        st.subheader("Top 20 artists by number of works")
        counts = (
            fdf[fdf["Artist"] != "Unknown"]["Artist"].value_counts().head(20).sort_values(ascending=True)
        )
        fig = go.Figure(go.Bar(
            x=counts.values, y=counts.index, orientation="h",
            marker_color=SEQUENTIAL_BLUE[3],
            hovertemplate="%{y}: %{x:,} artworks<extra></extra>",
        ))
        fig.update_layout(xaxis_title="Artworks", yaxis_title="")
        st.plotly_chart(style_fig(fig), width="stretch")

    with right:
        st.subheader("Top 20 nationalities")
        counts = (
            fdf[fdf["Nationality_Primary"] != "Unknown"]["Nationality_Primary"]
            .value_counts().head(20).sort_values(ascending=True)
        )
        fig = go.Figure(go.Bar(
            x=counts.values, y=counts.index, orientation="h",
            marker_color=SEQUENTIAL_BLUE[3],
            hovertemplate="%{y}: %{x:,} artworks<extra></extra>",
        ))
        fig.update_layout(xaxis_title="Artworks", yaxis_title="")
        st.plotly_chart(style_fig(fig), width="stretch")

    st.subheader("Artist gender breakdown")
    counts = fdf["Gender_Primary"].value_counts()
    fig = go.Figure(go.Bar(
        x=counts.index, y=counts.values,
        marker_color=SEQUENTIAL_BLUE[3],
        hovertemplate="%{x}: %{y:,} artworks<extra></extra>",
    ))
    fig.update_layout(xaxis_title="", yaxis_title="Artworks")
    st.plotly_chart(style_fig(fig), width="stretch")

# ----------------------------- Time Trends tab -----------------------------
with tab_time:
    st.subheader("Artworks acquired per year")
    acquired = fdf["AcquiredYear"].dropna().astype(int).value_counts().sort_index()
    fig = go.Figure(go.Scatter(
        x=acquired.index, y=acquired.values, mode="lines", fill="tozeroy",
        line=dict(color=SEQUENTIAL_BLUE[4], width=2),
        hovertemplate="%{x}: %{y:,} acquisitions<extra></extra>",
    ))
    fig.update_layout(xaxis_title="Year acquired", yaxis_title="Artworks acquired")
    st.plotly_chart(style_fig(fig), width="stretch")

    st.subheader("Artworks created per decade")
    created = fdf["CreationYear"].dropna()
    decade = (created // 10 * 10).astype(int).value_counts().sort_index()
    fig = go.Figure(go.Bar(
        x=decade.index, y=decade.values,
        marker_color=SEQUENTIAL_BLUE[3],
        hovertemplate="%{x}s: %{y:,} artworks<extra></extra>",
    ))
    fig.update_layout(xaxis_title="Decade created", yaxis_title="Artworks")
    st.plotly_chart(style_fig(fig), width="stretch")

# ----------------------------- Dimensions tab -----------------------------
with tab_dimensions:
    st.subheader("Distribution of physical dimensions")
    dim_choice = st.selectbox("Dimension", ["Height (cm)", "Width (cm)", "Weight (kg)"])
    series = fdf[dim_choice].dropna()
    series = series[series <= series.quantile(0.99)]
    fig = go.Figure(go.Histogram(
        x=series, marker_color=SEQUENTIAL_BLUE[3], nbinsx=60,
        hovertemplate="Range: %{x}<br>Count: %{y:,}<extra></extra>",
    ))
    fig.update_layout(xaxis_title=dim_choice, yaxis_title="Artworks", bargap=0.02)
    fig.add_annotation(
        text="99th percentile and above trimmed for readability", showarrow=False,
        xref="paper", yref="paper", x=1, y=1.08, font=dict(color=INK_MUTED, size=11),
    )
    st.plotly_chart(style_fig(fig), width="stretch")

    st.subheader("Height vs. width by department")
    scatter_df = fdf.dropna(subset=["Height (cm)", "Width (cm)"]).copy()
    scatter_df = scatter_df[
        (scatter_df["Height (cm)"] <= scatter_df["Height (cm)"].quantile(0.99))
        & (scatter_df["Width (cm)"] <= scatter_df["Width (cm)"].quantile(0.99))
    ]
    top3 = fdf["Department"].value_counts().head(3).index.tolist()
    scatter_df["DeptGroup"] = scatter_df["Department"].where(scatter_df["Department"].isin(top3), "Other")
    if len(scatter_df) > 8000:
        scatter_df = scatter_df.sample(8000, random_state=1)
    fig = go.Figure()
    group_order = top3 + (["Other"] if "Other" in scatter_df["DeptGroup"].unique() else [])
    for i, grp in enumerate(group_order):
        sub = scatter_df[scatter_df["DeptGroup"] == grp]
        color = CATEGORICAL[i] if grp != "Other" else INK_MUTED
        fig.add_scatter(
            x=sub["Width (cm)"], y=sub["Height (cm)"], mode="markers", name=grp,
            marker=dict(color=color, size=6, opacity=0.6),
            hovertemplate=f"{grp}<br>" + "Width: %{x:.0f} cm<br>Height: %{y:.0f} cm<extra></extra>",
        )
    fig.update_layout(xaxis_title="Width (cm)", yaxis_title="Height (cm)", legend_title_text="Department")
    st.plotly_chart(style_fig(fig, showlegend=True), width="stretch")
    st.caption("99th percentile and above trimmed; sampled to 8,000 points for rendering performance.")

    st.subheader("Correlation between dimension fields")
    corr_cols = ["Height (cm)", "Width (cm)", "Depth (cm)", "Weight (kg)"]
    corr = fdf[corr_cols].corr()
    fig = go.Figure(go.Heatmap(
        z=corr.values, x=corr.columns, y=corr.columns,
        colorscale=DIVERGING, zmin=-1, zmax=1, zmid=0,
        text=corr.round(2).values, texttemplate="%{text}",
        hovertemplate="%{y} vs %{x}: %{z:.2f}<extra></extra>",
        colorbar=dict(title="r"),
    ))
    st.plotly_chart(style_fig(fig), width="stretch")

# ----------------------------- Data Explorer tab -----------------------------
with tab_explorer:
    st.subheader("Filtered data")
    search = st.text_input("Search title or artist")
    view = fdf
    if search:
        needle = search.lower()
        view = view[
            view["Title"].fillna("").str.lower().str.contains(needle)
            | view["Artist"].fillna("").str.lower().str.contains(needle)
        ]

    default_cols = [
        "Title", "Artist", "Nationality_Primary", "Gender_Primary", "Date",
        "Medium", "Classification", "Department", "DateAcquired",
    ]
    columns = st.multiselect("Columns to display", df.columns.tolist(), default=default_cols)
    st.caption(f"Showing {len(view):,} of {len(fdf):,} filtered artworks.")
    st.dataframe(view[columns] if columns else view, width="stretch", height=450)

    st.download_button(
        "Download filtered data as CSV",
        data=view.to_csv(index=False).encode("utf-8"),
        file_name="moma_artworks_filtered.csv",
        mime="text/csv",
    )
