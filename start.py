import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path

# Rutas del proyecto
ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND_INDEX = ROOT / "frontend" / "index.html"

def main():
    if not (BACKEND / "app.py").exists():
        print("No se encontró backend/app.py. ¿Estás en la raíz del proyecto?")
        sys.exit(1)

    if not FRONTEND_INDEX.exists():
        print("No se encontró frontend/index.html")
        sys.exit(1)

    print("Iniciando servidor Flask en http://localhost:5000 ...")

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    proceso = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=str(BACKEND),
        env=env,
    )

    try:
        time.sleep(1.5)

        url = FRONTEND_INDEX.as_uri()  # file:///.../frontend/index.html
        print(f"🌐 Abriendo login: {url}")
        webbrowser.open(url)

        print("\n✅ Todo listo.")
        print("   - Backend:  http://localhost:5000")
        print("   - Frontend: ya se abrió en el navegador")
        print("\nPresiona Ctrl+C para detener el servidor.\n")


        proceso.wait()

    except KeyboardInterrupt:
        print("\n Deteniendo servidor...")
        proceso.terminate()
        try:
            proceso.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proceso.kill()
        print("Listo. ¡Hasta luego!")

if __name__ == "__main__":
    main()