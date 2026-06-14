import requests

def buscar_fendas_ativas():
    url = "https://api.warframestat.us/pc/fissures"
    headers = {"Language": "pt"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        dados = response.json()
        
        fendas_ativas = [
            fenda for fenda in dados
            if fenda.get('active') and not fenda.get('isStorm')
        ]
        
        fendas_ordenadas = sorted(fendas_ativas, key=lambda x: x.get('tierNum', 0))
        
        return fendas_ordenadas
        
    except requests.exceptions.RequestException as erro:
        print(f"Erro ao acessar a API: {erro}")
        return None

fendas = buscar_fendas_ativas()

if fendas:
    print("Fendas do Vazio Ativas:")
    for fenda in fendas:
        tier = fenda.get('tier')
        missao = fenda.get('missionType')
        planeta = fenda.get('node')
        tempo_restante = fenda.get('eta')
        print(f"Era: {tier} | Missão: {missao} | Local: {planeta} | Tempo: {tempo_restante}")