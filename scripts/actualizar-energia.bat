@echo off
REM Actualiza la producción de petróleo y gas (Capítulo IV) desde esta PC y la sube al repo.
REM El portal de la Secretaría de Energía no responde a servidores fuera de Argentina,
REM por eso este paso no corre en GitHub Actions.
cd /d "%~dp0\.."
git pull --rebase || goto :error
python scripts\actualizar.py --grupo energia || goto :error
git add data
git diff --cached --quiet && (echo Sin cambios. & goto :fin)
git commit -m "Datos de Energía actualizados" || goto :error
git push || goto :error
:fin
echo Listo.
exit /b 0
:error
echo Hubo un error: revisá el mensaje de arriba.
exit /b 1
