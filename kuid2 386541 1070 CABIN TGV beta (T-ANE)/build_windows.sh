#!/usr/bin/env bash

# Script para cross-compilar o hud_bridge para Windows (DLL 64-bit) a partir do Linux.
# É necessário ter o compilador g++-mingw-w64-x86-64 instalado.

echo "=== Verificando compilador MinGW-w64 ==="
if ! command -v x86_64-w64-mingw32-g++ &> /dev/null; then
    echo "Erro: x86_64-w64-mingw32-g++ não encontrado."
    echo "Instale executando o comando:"
    echo "  sudo apt-get update && sudo apt-get install -y g++-mingw-w64-x86-64"
    exit 1
fi

echo "Compilando hud_bridge.dll..."

x86_64-w64-mingw32-g++ -shared -o hud_bridge.dll hud_bridge.cpp -DBUILDING_DLL -static -static-libgcc -static-libstdc++ -lws2_32


if [ $? -eq 0 ]; then
    echo "========================================="
    echo " Sucesso! hud_bridge.dll gerada."
    echo "========================================="
else
    echo "Erro durante a compilação."
    exit 1
fi
