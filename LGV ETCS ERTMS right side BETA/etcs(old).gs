include "signal.gs"
include "Trackside.gs"

class Etcs isclass Signal { 
	float desaceleration = 0.6;
	float mylimit = -0.1;			// Speedlimit for current signal	
	public void ApplySpeedLimitForStateEx(int state)	
	{
		if(mylimit == -2.1) // signal_overlapoccupied_lbl. Overlap! Don't' apply speed limit, yet.
			return;
		SetSpeedLimit(mylimit);
		
	}

	void ApplyUpdatedState(Soup sigSoup)
	{
		inherited(sigSoup);	// Substituição do método "ApplyUpdatedState()" para que a chamada padrão não altere o estado
		// inherited(signalStateSoup);
		int signalState = sigSoup.GetNamedTagAsInt("state", EX_STOP);	
	}
	Soup DetermineUpdatedState(){
		Soup sigSoup = inherited();		
		GSTrackSearch trackSearch = me.BeginTrackSearch(true);
		object nextObject;
		JunctionBase lastJunction = null;
		int trainApproaching = -1;
		Signal nextSignal = null;
		Train approachingTrain = null;
		float signalDistance, maxDistance;
		bool trainInPortalArea;		
		int signalState = -1;
		string signalStateReason = "$signal_undecided_lbl";


		while(trackSearch.SearchNextObject())
		{
			nextObject = trackSearch.GetObject();	
			Signal tempSignal = cast<Signal>(nextObject);			

			if (trackSearch.GetDistance() > 3000.0)
			{
				// Busca limitada em 5000 metros.
				signalState = EX_SLOW;
				signalStateReason = "$signal_unsignalled_lbl";
				mylimit = 8.34;
				break;
			}else if (cast<Vehicle> nextObject)
			{
				if ((trackSearch.GetDistance() > 30.0))
				{					
					signalState = EX_STOP;
					signalStateReason = "$signal_nextblockbusy_lbl";				
					Vehicle theVeh = cast<Vehicle> nextObject;
					if(trackSearch.GetFacingRelativeToSearchDirection()) {
						if(theVeh.GetVelocity() < -1.0) {
							mylimit = 0.02;
						} else {
							mylimit = 8.34;
						}
					} else {
						if(theVeh.GetVelocity() > 1.0) {
							mylimit = 0.02;	
						} else {
							mylimit = 8.34;
						}
					}
					// SetAutopilotHintObj(nextObject);
					break;
				}
				else
				{
				//   	        TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... traincar is entirely within overlap, and is thus still in the block in rear.");
				//   	        TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... vagão de trem está inteiramente dentro da sobreposição, e é isso ainda no bloco na parte traseira.");
					signalState = EX_STOP;
					signalStateReason = "signal_overlapoccupied_lbl";
					mylimit = -2.1;
					// // SetAutopilotHintObj(nextObject);					
					break;					
				}
			}
			
			else if (cast<Signal>(nextObject))				
			{				
								
				if(trackSearch.GetFacingRelativeToSearchDirection())
				{
						float nextlimit = tempSignal.GetSpeedLimit();								
						signalDistance = trackSearch.GetDistance();												
						switch (tempSignal.GetSignalStateEx())
						{	
						    case EX_PROCEED:
							case EX_PROCEED_LEFT:
							case EX_PROCEED_LEFT_2:
							case EX_PROCEED_LEFT_3:
							case EX_PROCEED_RIGHT:
							case EX_PROCEED_RIGHT_2:
							case EX_PROCEED_RIGHT_3:	
								signalStateReason = "$signal_lineclear_lbl";
								signalState = EX_PROCEED;														
								mylimit = Math.Sqrt(nextlimit * nextlimit + 2 * signalDistance * desaceleration);								
								if (mylimit > 100.0)
									mylimit = 100.0;
								break;
							case EX_STOP:
							case EX_STOP_THEN_CONTINUE:
								if(nextlimit < 0.30 and nextlimit > 0.01){			// Trem se aproximando em sentido contrário.
									mylimit = nextlimit + 0.01;
								}else
								{
									signalState = EX_CAUTION;
									signalStateReason = "$signal_nextsignalred_lbl";								
									mylimit = Math.Sqrt(nextlimit * nextlimit + (2 * signalDistance * desaceleration));								
									if (mylimit > 36.12)
										mylimit = 36.12;
								}
								break;							
							case EX_CAUTION:
							case EX_CAUTION_LEFT:
							case EX_CAUTION_LEFT_2:
							case EX_CAUTION_LEFT_3:
							case EX_CAUTION_RIGHT:
							case EX_CAUTION_RIGHT_2:
							case EX_CAUTION_RIGHT_3:
							case EX_SLOW:
							case EX_MEDIUM:								
							case EX_ADVANCE_CAUTION:
							case EX_ADVANCE_CAUTION_LEFT:
							case EX_ADVANCE_CAUTION_LEFT_2:
							case EX_ADVANCE_CAUTION_LEFT_3:
							case EX_ADVANCE_CAUTION_RIGHT:
							case EX_ADVANCE_CAUTION_RIGHT_2:
							case EX_ADVANCE_CAUTION_RIGHT_3:
								signalStateReason = "$signal_nextsignalyellow_lbl";
								signalState = EX_PROCEED;	
								mylimit = Math.Sqrt(nextlimit * nextlimit + 2 * signalDistance * desaceleration);
								if (mylimit > 61.12)
									mylimit = 61.12;
								break;
							default:
								signalState = EX_STOP;
								mylimit = 8.34;								
								signalStateReason = "$signal_unknownstate_lbl";
								TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Signal ahead is in unknown state!");
								break;
						}
						break;
				}
				else
				{
					// Semáforo de costas. Continuar busca.
				    //	       	TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: ... but it's facing the wrong way. This means we're on bi-di track...");
					continue;
					
				}
			}
			else if(cast<Trackside> nextObject)
			{
				// some other trackside object.
				//      	TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found trackside scenery item.");
				Trackside nextTracksideObject = (cast<Trackside> nextObject);
				if(nextTracksideObject.GetIsSearchLimit())
				{
					// it's a direction marker - does it affect signalling?
					if (nextTracksideObject.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsBool("30501-search-limit-affects-signaling"))
					{
						if (!trackSearch.GetFacingRelativeToSearchDirection())
						{
							// facing against us
							signalState = EX_STOP;
							signalStateReason = "$signal_aidirectionmarker_lbl";
							mylimit = 0.01;		
							// SetAutopilotHintObj(cast<MapObject> nextTracksideObject);
							break;
						}
					}
				}
			}
			else if(cast<SceneryWithTrack> nextObject)
			{
				// some kind of crossing / turntable / buildable / fixed track junction.
				//TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a Scenery object with attached track.");
				
				SceneryWithTrack theMoSWT = cast<SceneryWithTrack> nextObject;
				JunctionBase[] attachedJunctions = theMoSWT.GetAttachedJunctions();
					
				if (attachedJunctions and attachedJunctions.size() > 0)
				{
					// We have a fixed track junction
					//TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a fixed track junction with " + attachedJunctions.size() + " junction nodes.");

					if (!me.GetIsRepeater())
					{
						if (!lastJunction)
							SetAutopilotJunction(attachedJunctions[0]);

						lastJunction = attachedJunctions[attachedJunctions.size() - 1];
						if (trainApproaching == -1)
						{
							// "function findApproachingTrain is obsolete" in object Signal.
						    // approachingTrain = findApproachingTrain(me, false, 5, 5000); // 5 signals or 10 miles, whichever is closer
						    if (approachingTrain and approachingTrain.GetFrontmostLocomotive())
								trainApproaching = 1;
						    else
								trainApproaching = 0;
						}
					}
				}
				if (cast<BasePortal> nextObject)
				{
					// it's a portal.
					BasePortal thePortal = cast<BasePortal> nextObject;
					// TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found a Portal");
					// Search to end of track to prove no additional trains are lurking.
					trainInPortalArea = false;
					maxDistance = trackSearch.GetDistance() + PORTAL_LENGTH + HALF_A_CAR_LENGTH;
					while (trackSearch.SearchNext())
					{
						nextObject = trackSearch.GetObject();
						if (cast<Vehicle> nextObject and trackSearch.GetDistance() < maxDistance)
						{
						  signalState = EX_STOP;
						  signalStateReason = "$signal_nextblockbusy_lbl";
						  // SetAutopilotHintObj(nextObject);
						  break;
						}
					}
					if (signalState == -1)
					{
						// assume portal is willing to accept a train if there is no evidence of traincars nearby.
						signalStateReason = "$signal_lineclearportal_lbl";
						if (lastJunction)
						{
							if (trainApproaching)
							{
								switch (lastJunction.GetDirection())
								{
									case Junction.DIRECTION_LEFT:
										signalState = EX_PROCEED_LEFT;
										break;
									case Junction.DIRECTION_RIGHT:
										signalState = EX_PROCEED_RIGHT;
										break;
									default:
										signalState = EX_PROCEED;
									break;
								}
							}
							else
							{
								signalState = EX_STOP;
								signalStateReason = "$signal_trainapproaching_lbl";
							}
						}
						else
						{
							if (alwaysControlled and !trainApproaching)
							{
								signalState = EX_STOP;
								signalStateReason = "$signal_idle_lbl";
							}
							else
							{
								signalState = EX_PROCEED;
							}
						}
					}
						
				}
				else
				{
					// something other than a portal - ignore
					//      		TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Scenery with track is not a Portal or Fixed Track Junction -- irrelevant from the signalling perspective.");
				}
			}
			  
			else
			{
				if (!nextObject)
				{
				  // This is bad. TrackSearch found something, but it can't tell us what it found.
				  TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: TrackSearch.GetObject() returned null, when TrackSearch.SearchNext() returned true. Huh?");
				}
				else
				{
					// nextObject is definitely not null, but it wasn't anything we have code for.
					// It is possible this is something where it's GSClass doesn't match it's native class. This is disturbingly common with Level Crossings, which should be "Crossing", but are often "MapObject".
					if (cast<MapObject> nextObject)
					{
						TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found some other type of object I need to be educated about: \"" + (cast<MapObject> nextObject).GetName() + "\".");
					}
					else
					{
					  TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Found some other type of object I need to be educated about. Not null, but not castable to MapObject.");
					}
				}
			}
		}

		if (signalState == -1)
		{
			//      TrainzScript.Log("Signal.gs: <" + me.GetName() + ">: Ran out of things in the search.");
			signalState = EX_STOP;
			  
			if (lastJunction)
			{
				// SetAutopilotHintObj(lastJunction.GetMapObject());
				signalStateReason = "$signal_unsignalled_lbl";
			}
			else
			{
				signalStateReason = "$signal_endofline_lbl";
			}
		}
    
		// okay, so we've found what we think is the state we want.
		// however, we have no idea if the signal can display it,
		// so we now check this against what the signal can do
		// signalState = FindNearestDisplayableStateEx(signalState);
		sigSoup.SetNamedTag("state", signalState);
		sigSoup.SetNamedTag("reason", signalStateReason);		
		return sigSoup;
	}
	
	
	

	void Init(void)
	{
		inherited();
		string numero;
		numero = Math.Rand(1000,4000);
		Signal esteSinal = cast<Signal>me;
		esteSinal.SetFXNameText("number",numero);
		esteSinal.SetFXNameText("speedlimit","360.0");
	}
};