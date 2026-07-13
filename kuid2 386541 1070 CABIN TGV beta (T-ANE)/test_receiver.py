#!/usr/bin/env python3
import socket
import json
import sys

# Configurações do Socket
UDP_PORT = 5555
UDP_IP = "0.0.0.0" # Escuta em todas as interfaces de rede

def run_receiver():
    # Criação do Socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # Permitir reuso do endereço (útil para reiniciar rapidamente o script)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        sock.bind((UDP_IP, UDP_PORT))
    except Exception as e:
        print(f"Erro ao bindar na porta {UDP_PORT}: {e}")
        sys.exit(1)

    print("=" * 60)
    print(f" Receptor UDP Telemetria Trainz Ativo")
    print(f" Escutando na porta: {UDP_PORT}...")
    print(" Aguardando pacotes do simulador... (Pressione Ctrl+C para sair)")
    print("=" * 60)

    try:
        while True:
            # Recebe dados do socket (tamanho máximo do buffer: 1024 bytes)
            data, addr = sock.recvfrom(1024)
            
            try:
                # Decodificar e converter para string
                payload = data.decode('utf-8')
                
                # Tentar fazer o parse do JSON para validar e re-formatar de forma elegante
                telemetry = json.loads(payload)
                
                print(f"\n[Recebido de {addr[0]}:{addr[1]}]")
                print("-" * 40)
                print(json.dumps(telemetry, indent=4))
                print("-" * 40)
                
            except json.JSONDecodeError:
                # Se não for JSON válido, exibe em formato raw
                print(f"\n[Raw Data de {addr[0]}:{addr[1]}]: {data}")
            except Exception as e:
                print(f"Erro ao processar dados: {e}")
                
    except KeyboardInterrupt:
        print("\n\nEncerrando receptor local...")
    finally:
        sock.close()
        print("Socket fechado. Até mais!")

if __name__ == "__main__":
    run_receiver()
