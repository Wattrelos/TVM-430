include "meshobject.gs"
include "signal.gs"
include "trackside.gs"
include "defaultlocomotivecabin.gs"

class Tvm430 isclass DefaultLocomotiveCabin
{
	public define int EX_STOP                    = 0;
	public define int EX_STOP_THEN_CONTINUE      = 1;
	public define int EX_CAUTION                 = 4;
	public define int EX_ADVANCE_CAUTION         = 7;
	public define int EX_PROCEED                 = 8;

	float distance = 1;
	float decaimento = 0;
	int skin_atual = 0;
	Trackside trackSideItem;
	Train train;
	Asset skins;
	Asset dials;
	void setSkin(int skin) {
		if (skin != skin_atual)
		{						
			if (skins != null)
			{
				SetFXTextureReplacement("efeito",skins,skin);
			}			
			skin_atual = skin;
			if (dials != null)
			{
				SetFXTextureReplacement("dial", dials, 1);
			}
			World.Play2DSound(GetAsset(),"s_info.wav");
			if (trackSideItem != null)
			{
				SetMeshAnimationFrame("target_speed",trackSideItem.GetSpeedLimit(),1.0);
			}
			if (train != null and trackSideItem != null and distance != 0)
			{
				decaimento = (((train.GetSpeedLimit() - trackSideItem.GetSpeedLimit())/distance));						
			}
			else
			{
				decaimento = 0;
			}
		}
		return;
    }
	public void Init(void)
	{
		inherited(); // all others inherited from parent class
		skins = GetAsset().FindAsset("skins");
		dials = GetAsset().FindAsset("dials");
	}
	public void Update(void) // update gets values from locomotive class	
	{
		if (loco == null)
			return;
		train = loco.GetMyTrain();		
		if (train == null)
			return;

		inherited(); // get values from parent class

		MapObject nextItem = null;
		Vehicle searchV;
		Vehicle[] v = train.GetVehicles();
		int velocidade = 0;		
		if (v == null or v.size() == 0)
			return;
		
		bool searchDirection = (v[0].GetVelocity() > -1.0);
		if (searchDirection)
			searchV = v[0];
		else
		{
			searchV = (v[v.size()-1]);       		  	 
		}
		searchDirection = (searchV.GetVelocity() > -1.0);
		GSTrackSearch trackSearch = searchV.BeginTrackSearch(searchDirection);		
		velocidade = train.GetVelocity() * 3.6;
		if(train.GetVelocity() >= 0)
		{				
			SetMeshAnimationFrame("speedometer",train.GetVelocity());
		}else{
			velocidade = velocidade * -1;
			SetMeshAnimationFrame("speedometer",(train.GetVelocity() * -1));
		}	
		SetFXNameText("VLC", velocidade);
		if (dials != null)
		{
			if (train.GetVelocity() > train.GetSpeedLimit())
			{
				SetFXTextureReplacement("dial", dials, 3); // Vermelho
			}
			else
			{
				SetFXTextureReplacement("dial", dials, 1); // Cinza padrão
			}
		}
		while (true){			
			int limite_velocidade = (train.GetSpeedLimit());
			nextItem = trackSearch.SearchNext();			
			if (nextItem == null){
				setSkin(0);	
				break;
			}
			distance = trackSearch.GetDistance();
			if (distance > 5000) {
				setSkin(0);
				break;
			}
			trackSideItem = cast<Trackside> nextItem;  
			if(trackSideItem)
			{
				if(cast<Vehicle> nextItem) {
					setSkin(2);
					break;
				}
				if(cast<Signal> nextItem) {			
					if(trackSearch.GetFacingRelativeToSearchDirection()) {
						Trackside trackSideItem = cast<Trackside> nextItem;
						if(trackSideItem != null){						
							int prox_limit_veloc = trackSideItem.GetSpeedLimit();
							if(prox_limit_veloc > limite_velocidade) prox_limit_veloc = limite_velocidade;
							if(distance > 0)
							{								
								int distancia = distance;
								SetFXNameText("distance", distancia);
								if(decaimento < 0){
									SetMeshAnimationFrame("pointer_limit",train.GetSpeedLimit(),1.0);
								}else{
									SetMeshAnimationFrame("pointer_limit",(trackSideItem.GetSpeedLimit()) + decaimento * distance, 1.0);
								}
							}else{
								SetMeshAnimationFrame("pointer_limit",train.GetSpeedLimit(),1.0);
							}

							if (dials != null)
							{
								if(train.GetVelocity() > train.GetSpeedLimit())
								{
									SetFXTextureReplacement("dial",dials,3);														
								}else{
									if((train.GetVelocity()) > prox_limit_veloc)
									{
										SetFXTextureReplacement("dial",dials,2);
									}else{
										SetFXTextureReplacement("dial",dials,1);
									}
								}
							}
							if (prox_limit_veloc >= 100) setSkin(22); // 100 m/s = 360 km/h
							else if (prox_limit_veloc >= 88.81) setSkin(20); // 88.81 m/s = 320 Km/h
							else if (prox_limit_veloc >= 83.35) setSkin(18); // 83.35 m/s = 300 km/h
							else if (prox_limit_veloc >= 77.80) setSkin(16); // 77.80 m/s = 270 km/h
							else if (prox_limit_veloc >= 61.12) setSkin(14); // 61.12 m/s = 220 km/h
							else if (prox_limit_veloc >= 55.58) setSkin(12); // 55.58 m/s = 200 km/h
							else if (prox_limit_veloc >= 44.46) setSkin(10); // 44.46 m/s = 160 km/h
							else if (prox_limit_veloc >= 33.35) setSkin(8); // 33.35 m/s = 120 km/h
							else if (prox_limit_veloc >= 22.24) setSkin(6); // 22.24 m/s = 80 km/h
							else if (prox_limit_veloc >= 16.68) setSkin(4); // 16.68 m/s = 60 km/h							
							else if (prox_limit_veloc >= 8.34) setSkin(2); // 8.34 m/s = 30 km/h
							else setSkin(1); // 0 km/h
							break; // Sai do loop
						}
					}
				}
			}
		}
	}	
};
