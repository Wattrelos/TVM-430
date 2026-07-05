include "signal.gs"
include "mapobject.gs"
include "tracksearch.gs"
include "junction.gs"
include "train.gs"
include "world.gs"

class HighSpeedSignal isclass Signal {

    // Constantes de projeto baseadas no ETCS
    float decelerationRate = -0.5; // m/s² (frenagem de serviço estável)
    float etcsMargin = 1.05;       // 5% de tolerância de velocidade do ETCS

    // Executado periodicamente pelo simulador para atualizar o sinal
    public void Main(void) {
        // Roda o loop principal a cada 1 segundo para checagem de segurança
        while (1) {
            UpdateSignalAspect();
            CheckAndLockJunctions();
            Sleep(1.0); 
        }
    }

    // 1. Busca para FRENTE: Define a cor/aspecto do sinal atual
    void UpdateSignalAspect(void) {
        GSTrackSearch forwardSearch = BeginTrackSearch(true);
        MapObject mo = forwardSearch.SearchNext();
        
        while (mo) {
            Signal nextSig = cast<Signal>mo;
            if (nextSig) {
                // Exemplo simplificado de repetição de aspecto (estilo TVM/ETCS)
                if (nextSig.GetSignalState() == Signal.STATE_RED) {
                    SetSignalState(Signal.STATE_YELLOW); // Próximo está fechado, reduza!
                } else {
                    SetSignalState(Signal.STATE_GREEN);
                }
                break;
            }
            Train nextTrain = cast<Train>mo;
            if (nextTrain) {
                SetSignalState(Signal.STATE_RED); // Trem no bloco da frente, pare!
                break;
            }
            mo = forwardSearch.SearchNext();
        }
    }

    // 2. Busca para TRÁS: Protege as junções contra mudanças intempestivas do jogador
    void CheckAndLockJunctions(void) {
        // Encontra a primeira junção vindo À FRENTE deste sinal para podermos protegê-la
        Junction forwardJunction = FindNextForwardJunction();
        if (!forwardJunction) return;

        // Inicia busca para TRÁS (falsa direção no track search) para ver se vem trem
        GSTrackSearch backwardSearch = BeginTrackSearch(false);
        MapObject mo = backwardSearch.SearchNext();
        float currentDistance = 0.0;

        bool mustLock = false;

        while (mo) {
            currentDistance = currentDistance + backwardSearch.GetDistance();

            Train appTrain = cast<Train>mo;
            if (appTrain) {
                float trainSpeedMS = appTrain.GetVelocity(); // Retorna em m/s nativo do Trainz

                if (trainSpeedMS > 0.1) {
                    // Torricelli + Margem ETCS: s = (V² - V_alvo²) / (2 * |a|)
                    // Para proteção da junção, o alvo é a parada total (V_alvo = 0)
                    float safeStoppingDistance = ((trainSpeedMS * trainSpeedMS) / (2.0 * Math.Abs(decelerationRate))) * etcsMargin;

                    // Se a distância atual do trem até o sinal for menor que o espaço de frenagem seguro
                    if (currentDistance <= safeStoppingDistance) {
                        mustLock = true; 
                    }
                }
                break; // Achou o trem mais próximo, pode encerrar a busca
            }
            mo = backwardSearch.SearchNext();
        }

        // Aplica ou remove o bloqueio na junção à frente
        if (mustLock) {
            if (!forwardJunction.GetLocked()) {
                forwardJunction.SetLocked(true);
                // Interface de cabine/Painel receberia o aviso de rota trancada aqui
            }
        } else {
            if (forwardJunction.GetLocked()) {
                forwardJunction.SetLocked(false); // Libera quando o perigo passa
            }
        }
    }

    // Função auxiliar para localizar a junção alvo à frente
    Junction FindNextForwardJunction(void) {
        GSTrackSearch juncSearch = BeginTrackSearch(true);
        MapObject mo = juncSearch.SearchNext();
        while (mo) {
            Junction junc = cast<Junction>mo;
            if (junc) {
                return junc;
            }
            mo = juncSearch.SearchNext();
        }
        return null;
    }
};
