#include "hud_bridge.h"
#include <iostream>
#include <cstdio>
#include <cstring>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    typedef SOCKET socket_t;
    #define closesocket_compat(s) closesocket(s)
    #define is_invalid_socket(s) ((s) == INVALID_SOCKET)
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    typedef int socket_t;
    #define closesocket_compat(s) close(s)
    #define is_invalid_socket(s) ((s) < 0)
    #define INVALID_SOCKET -1
#endif

// Socket global
static socket_t g_socket = INVALID_SOCKET;
static bool g_initialized = false;

bool InitializeSocket() {
    if (g_initialized) return true;

#ifdef _WIN32
    WSADATA wsaData;
    int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (result != 0) {
        std::cerr << "[HUDBridge] Falha ao inicializar Winsock. Erro: " << result << std::endl;
        return false;
    }
#endif

    g_socket = socket(AF_INET, SOCK_DGRAM, 0);
    if (is_invalid_socket(g_socket)) {
        std::cerr << "[HUDBridge] Falha ao criar Socket UDP." << std::endl;
#ifdef _WIN32
        WSACleanup();
#endif
        return false;
    }

    // Habilitar a opção de Broadcast no Socket
#ifdef _WIN32
    char broadcastOpt = '1';
#else
    int broadcastOpt = 1;
#endif
    if (setsockopt(g_socket, SOL_SOCKET, SO_BROADCAST, &broadcastOpt, sizeof(broadcastOpt)) < 0) {
        std::cerr << "[HUDBridge] Falha ao habilitar SO_BROADCAST." << std::endl;
        closesocket_compat(g_socket);
        g_socket = INVALID_SOCKET;
#ifdef _WIN32
        WSACleanup();
#endif
        return false;
    }

    g_initialized = true;
    std::cout << "[HUDBridge] Socket UDP inicializado e configurado para Broadcast na porta " << BROADCAST_PORT << std::endl;
    return true;
}

void CleanupSocket() {
    if (g_initialized) {
        if (!is_invalid_socket(g_socket)) {
            closesocket_compat(g_socket);
            g_socket = INVALID_SOCKET;
        }
#ifdef _WIN32
        WSACleanup();
#endif
        g_initialized = false;
        std::cout << "[HUDBridge] Socket UDP finalizado com sucesso." << std::endl;
    }
}

void SendUDPTelemetry(const TelemetryData& data) {
    if (!InitializeSocket()) {
        return;
    }

    // Buffer para formatar o JSON (evitando dependências externas)
    char jsonBuffer[512];
    int bytesFormatted = std::snprintf(
        jsonBuffer, sizeof(jsonBuffer),
        "{\n"
        "  \"speed_kmh\": %d,\n"
        "  \"speed_limit_kmh\": %.1f,\n"
        "  \"throttle_percent\": %.1f,\n"
        "  \"train_brake\": %.2f,\n"
        "  \"brake_pipe\": %.2f,\n"
        "  \"brake_cylinder\": %.2f,\n"
        "  \"tvm_skin\": %d,\n"
        "  \"target_distance_m\": %d\n"
        "}",
        data.speed_kmh,
        data.speed_limit_kmh,
        data.throttle_percent * 100.0f, // Converte 0.0-1.0 para porcentagem 0-100%
        data.train_brake,
        data.brake_pipe,
        data.brake_cylinder,
        data.tvm_skin,
        data.target_distance_m
    );

    if (bytesFormatted < 0 || bytesFormatted >= static_cast<int>(sizeof(jsonBuffer))) {
        std::cerr << "[HUDBridge] Erro de formatação do JSON (Buffer muito pequeno)." << std::endl;
        return;
    }

    // Configurar o endereço de destino (Broadcast na rede local)
    sockaddr_in destAddr;
    std::memset(&destAddr, 0, sizeof(destAddr));
    destAddr.sin_family = AF_INET;
    destAddr.sin_port = htons(BROADCAST_PORT);

#ifdef _WIN32
    destAddr.sin_addr.s_addr = inet_addr(BROADCAST_IP);
#else
    inet_pton(AF_INET, BROADCAST_IP, &destAddr.sin_addr);
#endif

    // Enviar pacote via socket
    int sendResult = sendto(g_socket, jsonBuffer, std::strlen(jsonBuffer), 0,
                            (struct sockaddr*)&destAddr, sizeof(destAddr));
    if (sendResult < 0) {
        std::cerr << "[HUDBridge] Falha ao enviar broadcast UDP." << std::endl;
    }
}

// Implementação da função exportada para o TrainzScript
extern "C" {
    DLL_EXPORT void DLL_CALL SendHUDData(
        int speed, 
        float speedLimit, 
        float throttle, 
        float trainBrake, 
        float brakePipe, 
        float brakeCylinder, 
        int tvmSkin, 
        int targetDistance
    ) {
        TelemetryData data;
        data.speed_kmh = speed;
        data.speed_limit_kmh = speedLimit;
        data.throttle_percent = throttle;
        data.train_brake = trainBrake;
        data.brake_pipe = brakePipe;
        data.brake_cylinder = brakeCylinder;
        data.tvm_skin = tvmSkin;
        data.target_distance_m = targetDistance;

        SendUDPTelemetry(data);
    }
}
