# ADR: Arquitetura de Comunicação para HUD do Trainz 2022

## Contexto
- O objetivo é criar um HUD para dispositivos móveis (Android) que exiba telemetria em tempo real do Trainz 2022. O jogo não possui saída nativa de rede (UDP/TCP) simplificada, exigindo uma arquitetura intermediária.

## Decisão
- Implementar uma arquitetura de três camadas utilizando uma DLL em C ou C++ como ponte nativa.

## Detalhes da Implementação

- Captura de Dados (TrainzScript): O script .gs coleta os dados da cabine.
- Ponte Nativa (DLL C++): Utilização da Trainz Native Plugin API para criar uma DLL. O .gs chama funções da DLL, que por sua vez, contorna as restrições de segurança do jogo.
- Servidor Intermediário (PC): Recebe os dados via DLL e transmite via Socket (TCP/UDP) ou WebSocket na rede local.
- Interface Android (Kotlin/Jetpack Compose): Consumo dos dados via corrotinas e renderização visual com Jetpack Compose.

## Formato de Dados

- Os dados serão transmitidos via JSON para o aplicativo Android. Rascunho(sujeito a alterações e adaptações):

```json
{
  "speed_kmh": 65.2,
  "speed_limit_kmh": 80.0,
  "brake_pressure_psi": 72.5,
  "throttle_percent": 45,
  "next_signal": {
    "state": "clear_green",
    "distance_meters": 1240.0
  },
  "next_object": {
    "type": "speed_board",
    "distance_meters": 450.0
  }
}
```
## Consequências
- Exige conhecimentos em C++ e API nativa do Trainz.
- Permite comunicação estável e em tempo real, superando as limitações de rede do TrainzScript.
- O uso de Jetpack Compose garante uma interface fluida e reativa no Android.

