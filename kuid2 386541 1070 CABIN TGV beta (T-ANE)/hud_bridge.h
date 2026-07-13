#ifndef HUD_BRIDGE_H
#define HUD_BRIDGE_H

#include <string>

// Definições de exportação para Windows e Linux
#ifdef _WIN32
    #ifdef BUILDING_DLL
        #define DLL_EXPORT __declspec(dllexport)
    #else
        #define DLL_EXPORT __declspec(dllimport)
    #endif
    #define DLL_CALL __cdecl
#else
    #define DLL_EXPORT __attribute__((visibility("default")))
    #define DLL_CALL
#endif

// Porta e endereço de Broadcast padrão
#define BROADCAST_PORT 5555
#define BROADCAST_IP "255.255.255.255"

// Estrutura de Telemetria
struct TelemetryData {
    int speed_kmh;
    float speed_limit_kmh;
    float throttle_percent;
    float train_brake;
    float brake_pipe;
    float brake_cylinder;
    int tvm_skin;
    int target_distance_m;
};

// Funções de Inicialização e Término de Rede
bool InitializeSocket();
void CleanupSocket();

// Função principal de envio de dados
void SendUDPTelemetry(const TelemetryData& data);

// Interface exposta para o TrainzScript
// Nota: Dependendo da SDK do TNI, o marshaling pode exigir tipos nativos de objeto do Trainz (ex: GSMachine/GSValue).
// Esta assinatura representa a função nativa esperada que realiza o recebimento e redirecionamento de dados.
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
    );
}

#endif // HUD_BRIDGE_H
