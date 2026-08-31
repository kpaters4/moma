"""Deploys the MoMA EDA Streamlit app on Modal.

Usage:
    modal serve modal_app.py    # ephemeral, auto-reloads on file changes
    modal deploy modal_app.py   # persistent deployment, prints a public URL
"""

import shlex
import subprocess
from pathlib import Path

import modal

ROOT = Path(__file__).parent
APP_REMOTE_PATH = "/root/app.py"
STREAMLIT_PORT = 8501

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "streamlit>=1.62.0",
        "pandas>=3.0.5",
        "numpy>=2.5.2",
        "plotly>=6.9.0",
    )
    .add_local_file(ROOT / "app.py", APP_REMOTE_PATH)
    .add_local_dir(ROOT / "data", "/root/data")
    .add_local_dir(ROOT / ".streamlit", "/root/.streamlit")
)

app = modal.App(name="moma-eda", image=image)


@app.function(memory=2048, scaledown_window=60 * 5)
@modal.concurrent(max_inputs=100)
@modal.web_server(STREAMLIT_PORT, startup_timeout=60)
def run():
    target = shlex.quote(APP_REMOTE_PATH)
    cmd = (
        f"streamlit run {target} "
        f"--server.port {STREAMLIT_PORT} "
        "--server.address 0.0.0.0 "
        "--server.enableCORS=false "
        "--server.enableXsrfProtection=false"
    )
    subprocess.Popen(cmd, shell=True, cwd="/root")
