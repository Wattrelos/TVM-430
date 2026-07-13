cmake_minimum_required(VERSION 3.10)
project(hud_bridge VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Compilar como biblioteca compartilhada (DLL no Windows, SO no Linux)
add_library(hud_bridge SHARED hud_bridge.cpp hud_bridge.h)

# Linkar com a biblioteca Winsock no Windows
if(WIN32)
    target_link_libraries(hud_bridge ws2_32)
    target_compile_definitions(hud_bridge PRIVATE BUILDING_DLL)
endif()

# Definir as propriedades do alvo
set_target_properties(hud_bridge PROPERTIES
    PREFIX ""
    SUFFIX ".gse"
)
