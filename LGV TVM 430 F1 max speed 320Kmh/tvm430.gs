// Poste de semáfaco com velocidade máxima de 320 Km/h.
include "Signal.gs"
include "Trackside.gs"
include "MeshObject.gs"
include "junction.gs"
class Tvm430 isclass Signal {

	Signal esteSinal; // Estado do sinal

	public define int EX_STOP                    = 0;
	public define int EX_STOP_THEN_CONTINUE      = 1;
	public define int EX_CAUTION                 = 4;
	public define int EX_ADVANCE_CAUTION         = 7;
	public define int EX_PROCEED                 = 8;

	void AplicaAspecto(float velocidade_limite, int skin, int aspecto, string razao){
		esteSinal.SetSignalStateEx(aspecto,razao);
		esteSinal.SetSpeedLimit(velocidade_limite);
		return;
	}

	void BuscaObjeto(void){
		Vehicle theVeh;
		GSTrackSearch tampao = esteSinal.BeginTrackSearch(true);
		MapObject nextMapObject = tampao.SearchNext();
		float this_signal_max_speed_limit = 88.81; // velocidade limite deste poste de sinalização (88.89 metros por segundo = 320 Km/h)
		while(true){
			float distancia = tampao.GetDistance(); // Obter a distância em metros.
			if (distancia > 3000) {
				AplicaAspecto(8.34, 41, EX_CAUTION,"Line ahead is unsignalled"); break;
			}
			if (nextMapObject == null){
				AplicaAspecto(8.34, 40, EX_STOP,"Line terminates or is closed"); break;
				break;
			}
			if(cast<Junction> nextMapObject) {
				Junction junc = cast<Junction> nextMapObject;
				int dir = junc.GetDirection();
				nextMapObject = tampao.SearchNext();
				if (nextMapObject == null) {
					AplicaAspecto(0.02, 40, EX_STOP, "Junction is set against route or closed");
					break;
				}
				if (dir == 0 or dir == 2) {
					this_signal_max_speed_limit = 55.56; // Limita a 200 Km/h
				}
				continue;
			}
			if(cast<Vehicle> nextMapObject) {
				theVeh = cast<Vehicle> nextMapObject;
				if(distancia < 30) {
					esteSinal.SetSignalStateEx(0,"Overlap of block ahead is occupied");
					break;
				}
				float speed_another_train = theVeh.GetVelocity();
				if(tampao.GetFacingRelativeToSearchDirection()) {
					speed_another_train = speed_another_train * -1;
				}
				if(speed_another_train < -1.00) {
					AplicaAspecto(8.34, 41, EX_STOP_THEN_CONTINUE,"Line ahead is occupied by another train"); break;
				} else {
					if(speed_another_train > 1.00) {
						AplicaAspecto(0.02, 41, EX_STOP,"Line ahead is reserved for an oncoming train "); break;
					}else{
						AplicaAspecto(0.34, 40, EX_STOP,"Line ahead is occupied by another train"); break;
					}
				}
				break;
			}
			if(cast<Signal> nextMapObject) {
				if(tampao.GetFacingRelativeToSearchDirection()) {
					Trackside trackSideItem = cast<Trackside> nextMapObject;
					if(trackSideItem != null){
						float prox_limit_veloc = trackSideItem.GetSpeedLimit();
						if(prox_limit_veloc >= this_signal_max_speed_limit ){
							if  (this_signal_max_speed_limit > 61.12) { // Verifica se a velocidade é de vias de alta velocidade > 220 Km/h	
								AplicaAspecto(this_signal_max_speed_limit, 45, EX_PROCEED,"Line ahead is clear");  // Mostra fundo verde						
							}else{
								AplicaAspecto(this_signal_max_speed_limit, 43, EX_PROCEED,"Line ahead is clear");  // Mostra fundo preto						
							}
							break;
						} else { // Se a velocidade limite deste poste de sinalização for menor que a velocidade máxima permitida, avisar o condutor para começar a frear.
							int prox_estado = trackSideItem.GetSignalState();
							
							// Aplicar a fórmula de Torriceli para calcular o limite de velocidade deste poste de sinalização de acordo o próximo sinal, distância, de acordo com a curva de desaceleração
							// A taxa típica de desaceleração de um TGV francês varia entre 0,5 m/s² e 1,2 m/s², dependendo do tipo de frenagem aplicada (serviço regular ou emergência).
							// 1. Frenagem de Serviço Regular (Conforto): Valor: 0,5 m/s² a 0,6 m/s²
							// 2. Frenagem de Serviço de Urgência: Valor: 0,7 m/s² a 0,8 m/s²
							// 3. Frenagem de Emergência (Freio de Perigo): Valor: 1,1 m/s² a 1,2 m/s²
							//Aplicar a função trigonometrica arco cosseno, para calcular o ângulo de inclinação da curva de desaceleração. Aplicar a unidade metro/segundo para distancia e metro/segundo² para aceleração.
							float limite_velocidade = Math.Sqrt((prox_limit_veloc * prox_limit_veloc) + (2 * 0.6 * distancia));
							if(limite_velocidade > this_signal_max_speed_limit) AplicaAspecto(this_signal_max_speed_limit, 43, EX_ADVANCE_CAUTION,"Line ahead is clear for two blocks");
							else if(limite_velocidade > 16.67) AplicaAspecto(limite_velocidade, 43, EX_ADVANCE_CAUTION,"Line ahead is clear for two blocks"); // Velocidade limite 60 Km/h
							else if(limite_velocidade > 8.34) AplicaAspecto(limite_velocidade, 43, EX_CAUTION,"Line ahead is clear for one block"); // Velocidade limite 30 Km/h
							else if(limite_velocidade > 0.34) AplicaAspecto(limite_velocidade, 41, EX_STOP_THEN_CONTINUE,"Line ahead is occupied by another train");
							else  AplicaAspecto(0.02, 40, EX_STOP,"Line ahead is occupied");
						}
					}
					break;
				}
			}
			nextMapObject = tampao.SearchNext();
		}
		return;
	}
	thread void SignalMonitor(void) {
		while(true) {
			BuscaObjeto();
			Sleep(1);
		}
	}
	thread void SignalNumber(void) {
		string numero;
		numero = Math.Rand(1000,2000);
		esteSinal.SetFXNameText("Numero",numero);
	}
	public void Init(void) {
		inherited();
		esteSinal = cast<Signal>me;
		SignalNumber();
		SignalMonitor();
	}
};
